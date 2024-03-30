import * as mv3 from 'mv3-hot-reload'
import { isDebug } from './const'
import { Ipc, BgCommand, SidePanelCommand } from './services/ipc'
import type { IpcCallback } from './services/ipc'
import { escapeJson } from './services/util'
import { UserSettings } from './services/userSettings'
import type { CommandVariable } from './services/userSettings'
import { Storage, STORAGE_KEY } from './services/storage'

mv3.utils.setConfig({ isDev: isDebug })
mv3.background.init()

type WindowType = {
  id: number
  commandId: number
}

type WindowLayer = WindowType[]

class BgData {
  private static instance: BgData

  public sidePanelTabId: number | null
  public lastWindow: WindowType | null
  public windowStack: WindowLayer[]

  private constructor() {
    this.lastWindow = null
    this.windowStack = []
    this.sidePanelTabId = null

    Storage.get<BgData>(STORAGE_KEY.BG).then((val: BgData) => {
      if (val) {
        BgData.instance = val
      }
    })
  }

  public static get(): BgData {
    if (!BgData.instance) {
      BgData.instance = new BgData()
    }
    return BgData.instance
  }

  public static set(val: BgData) {
    BgData.instance = val
    Storage.set(STORAGE_KEY.BG, BgData.instance)
  }
}

const data = BgData.get()

type Sender = chrome.runtime.MessageSender

export type openPopupProps = {
  commandId: number
  url: string
  top: number
  left: number
  width: number
  height: number
}

export type execApiProps = {
  url: string
  pageUrl: string
  pageTitle: string
  selectionText: string
  fetchOptions: string
  variables: CommandVariable[]
}

export type openTabProps = {
  url: string
  active: boolean
}

function bindVariables(
  str: string,
  variables: CommandVariable[],
  obj: { [key: string]: string },
): string {
  const arr = [...variables]
  for (const [key, value] of Object.entries(obj)) {
    arr.push({ name: key, value: value })
  }
  let res = str
  for (const v of arr) {
    const re = new RegExp(`\\$\\{${v.name}\\}`, 'g')
    res = res.replace(re, v.value)
  }
  return res
}

const commandFuncs = {
  [BgCommand.openPopup]: (param: openPopupProps): boolean => {
    const open = async () => {
      const current = await chrome.windows.getCurrent()
      const window = await chrome.windows.create({
        url: param.url,
        width: param.width,
        height: param.height,
        top: param.top,
        left: param.left,
        type: 'popup',
        incognito: current.incognito,
      })
      if (window.id) {
        data.lastWindow = {
          id: window.id,
          commandId: param.commandId,
        }
        data.windowStack.push([{ id: window.id, commandId: param.commandId }])
        BgData.set(data)
      }
      console.log('openPopup', data.windowStack)
    }
    open()
    return false
  },

  [BgCommand.enableSidePanel]: (param: unknown, sender: Sender): boolean => {
    const tabId = sender?.tab?.id
    if (tabId != null) {
      console.debug('enable sidePanel', tabId)
      chrome.sidePanel.setOptions({
        tabId,
        path: 'sidepanel.html',
        enabled: true,
      })
    }
    return false
  },

  [BgCommand.disableSidePanel]: (param: unknown, sender: Sender): boolean => {
    const tabId = sender?.tab?.id
    if (tabId && tabId === data.sidePanelTabId) {
      console.debug('disable sidePanel', tabId)
      data.sidePanelTabId = null
      BgData.set(data)
      chrome.sidePanel.setOptions({
        tabId,
        enabled: false,
      })
    }
    return false
  },

  [BgCommand.openSidePanel]: (
    param: unknown,
    sender: Sender,
    response,
  ): boolean => {
    console.debug('open sidePanel', param)
    const tabId = sender?.tab?.id
    const { url } = param as { url: string }
    if (tabId != null) {
      openSidePanel(tabId, url).then((ret) => {
        console.debug('ret openSidePanel', ret)
        response?.(ret)
      })
    }
    return true
  },

  [BgCommand.openOption]: (param: unknown, sender: Sender): boolean => {
    chrome.tabs.create({
      url: 'options_page.html',
    })
    return false
  },

  [BgCommand.openTab]: (param: openTabProps, sender: Sender): boolean => {
    chrome.tabs.create({
      url: param.url,
      active: param.active,
    })
    return false
  },

  [BgCommand.execApi]: (
    param: execApiProps,
    sender: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    const { url, pageUrl, pageTitle, selectionText, fetchOptions, variables } =
      param
    try {
      const str = bindVariables(fetchOptions, variables, {
        pageUrl,
        pageTitle,
        text: escapeJson(escapeJson(selectionText)),
      })
      const opt = JSON.parse(str)
      ;(async () => {
        const res = await fetch(url, opt)
        const json = await res.json()
        response({ ok: res.ok, res: json })
      })()
    } catch (e) {
      console.error(e)
      response({ ok: false, res: e })
    }
    // return async
    return true
  },
} as { [key: string]: IpcCallback }

for (const key in BgCommand) {
  const command = BgCommand[key as keyof typeof BgCommand]
  Ipc.addListener(command, commandFuncs[key])
}

const openSidePanel = async (tabId: number, url: string) => {
  await chrome.sidePanel.open({ tabId })
  await updateRules(tabId)
  const sidePanelTabId = data.sidePanelTabId
  return new Promise((resolve) => {
    if (sidePanelTabId === tabId) {
      // If SidePanel was already opened.
      Ipc.send(SidePanelCommand.setUrl, { url }).then((ret) => {
        resolve(ret)
      })
    } else {
      // Close the last opened SidePanel .
      if (sidePanelTabId != null) {
        console.debug('disable sidePanel', sidePanelTabId)
        chrome.sidePanel.setOptions({
          tabId: sidePanelTabId,
          enabled: false,
        })
      }
      // Open the new SidePanel.
      Ipc.addListener(SidePanelCommand.onLoad, () => {
        Ipc.send(SidePanelCommand.setUrl, { url }).then((ret) => {
          resolve(ret)
          data.sidePanelTabId = tabId
          BgData.set(data)
        })
        // return sync
        return false
      })
    }
  })
}

const updateRules = async (tabId: number) => {
  const rules = await chrome.declarativeNetRequest.getSessionRules()
  const removeIds = rules.map((r) => r.id)
  console.debug('sessionRules', rules)
  const newRules = [
    {
      id: tabId,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        responseHeaders: [
          {
            header: 'X-Frame-Options',
            operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
          },
        ],
      },
      condition: {
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.SUB_FRAME],
        tabIds: [chrome.tabs.TAB_ID_NONE],
      },
    },
  ]
  await chrome.declarativeNetRequest.updateSessionRules({
    addRules: newRules,
    removeRuleIds: removeIds,
  })
}

const updateWindowSize = async (
  commandId: number,
  width: number,
  height: number,
) => {
  const obj = await UserSettings.get()
  const found = obj.commands.find((c) => c.id === commandId)
  if (found) {
    found.popupOption = {
      width,
      height,
    }
  }
  await UserSettings.set(obj)
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: 'options_page.html',
  })
})

chrome.windows.onFocusChanged.addListener(async (windowId: number) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return
  }

  // Force close the menu
  // Ipc.sendAllTab(BgCommand.closeMenu)

  // Close popup windows when focus changed to lower stack window
  const stack = data.windowStack
  const idx = stack.map((s) => s.findIndex((w) => w.id === windowId))

  const closeAll = idx.every((i) => i < 0)
  if (closeAll && stack.length > 0) {
    for (const layer of stack) {
      for (const window of layer) {
        chrome.windows.remove(window.id)
      }
    }
    data.windowStack = []
  }

  // Delete windows up to the window stack in focus
  for (let i = idx.length - 2; i >= 0; i--) {
    if (idx[i] >= 0) {
      const layers = stack.splice(i + 1)
      if (layers) {
        for (const layer of layers) {
          for (const window of layer) {
            chrome.windows.remove(window.id)
          }
        }
        data.windowStack = stack
      }
      break
    }
  }
  BgData.set(data)
})

chrome.windows.onBoundsChanged.addListener((window) => {
  const lastWindow = data.lastWindow
  if (
    lastWindow &&
    lastWindow?.id === window.id &&
    window.width &&
    window.height
  ) {
    updateWindowSize(lastWindow.commandId, window.width, window.height)
  }
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  // Force close the menu
  Ipc.sendAllTab(BgCommand.closeMenu)

  const sidePanelTabId = data.sidePanelTabId
  // console.debug('onActivated', tabId, sidePanelTabId)
  if (tabId !== sidePanelTabId) {
    // Disables the side panel on all other sites
    console.debug('disable sidePanel', tabId)
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false,
    })
  }
})
