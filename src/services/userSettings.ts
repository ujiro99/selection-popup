import { Storage, STORAGE_KEY, STORAGE_AREA } from './storage'
import DefaultSettings, { DefaultCommands } from './defaultUserSettings'
import { OPTION_FOLDER, STARTUP_METHOD, VERSION } from '@/const'
import type { UserSettingsType, Version, Command } from '@/types'
import {
  isBase64,
  isEmpty,
  toDataURL,
  versionDiff,
  VersionDiff,
  isLinkCommand,
} from '@/services/util'
import { OptionSettings } from '@/services/optionSettings'

enum LOCAL_STORAGE_KEY {
  CACHES = 'caches',
}

export type Caches = {
  images: ImageCache
}

export type ImageCache = {
  [id: string]: string // key: url or uuid, value: data:image/png;base64
}

const callbacks = [] as ((data: UserSettingsType) => void)[]
Storage.addListener(STORAGE_KEY.USER, async (newVal: unknown) => {
  const settings = newVal as UserSettingsType
  settings.commands = await Storage.getCommands()
  callbacks.forEach((cb) => cb(settings))
})
Storage.addCommandListener(async (commands: Command[]) => {
  const settings = await UserSettings.get()
  settings.commands = commands
  callbacks.forEach((cb) => cb(settings))
})

export const UserSettings = {
  get: async (excludeOptions = false): Promise<UserSettingsType> => {
    let data = await Storage.get<UserSettingsType>(STORAGE_KEY.USER)
    const commands = await Storage.getCommands()
    if (commands.length > 0) {
      data.commands = commands
    }

    data = migrate(data)

    data.folders = data.folders.filter((folder) => !!folder.title)
    if (!excludeOptions) {
      // Remove once to avoid duplication.
      removeOptionSettings(data)
      // Add option settings
      data.commands.push(...OptionSettings.commands)
      data.folders.push(OptionSettings.folder)
    }
    return data
  },

  set: async (data: UserSettingsType): Promise<boolean> => {
    // remove unused caches
    const urls = UserSettings.getUrls(data)
    const caches = await UserSettings.getCaches()
    for (const key in caches.images) {
      if (!urls.includes(key)) {
        console.debug('remove unused cache', key)
        delete caches.images[key]
      }
    }

    // Convert iconUrl to DataURL for cache.
    const noCacheUrls = urls
      .filter((url) => !isEmpty(url))
      .filter((url) => !isBase64(url) && caches.images[url] == null)
    const newCaches = await Promise.all(
      noCacheUrls.map(async (url) => {
        let dataUrl = ''
        try {
          dataUrl = await toDataURL(url)
        } catch (e) {
          console.warn('Failed to convert to data url', url)
          console.warn(e)
        }
        return [url, dataUrl]
      }),
    )
    for (const [iconUrl, dataUrl] of newCaches) {
      if (isEmpty(dataUrl)) continue
      caches.images[iconUrl] = dataUrl
    }

    // Restore a link command if not exists.
    const linkCommands = data.commands.filter(isLinkCommand)
    if (linkCommands.length === 0) {
      const defaultLinkCommand = DefaultCommands.find(isLinkCommand)
      if (defaultLinkCommand != null) {
        data.commands.push(defaultLinkCommand)
      }
    }

    // Settings for options are kept separate from user set values.
    removeOptionSettings(data)

    await Storage.setCommands(data.commands)
    data.commands = []
    await Storage.set(STORAGE_KEY.USER, data)
    await Storage.set(LOCAL_STORAGE_KEY.CACHES, caches, STORAGE_AREA.LOCAL)
    return true
  },

  updateCommands: async (commands: Command[]): Promise<boolean> => {
    await Storage.updateCommands(commands)
    return true
  },

  reset: async () => {
    await Storage.set(STORAGE_KEY.USER, DefaultSettings)
    await Storage.setCommands(DefaultCommands)
  },

  addChangedListener: (callback: (data: UserSettingsType) => void) => {
    callbacks.push(callback)
  },

  removeChangedListener: (callback: (data: UserSettingsType) => void) => {
    const idx = callbacks.indexOf(callback)
    if (idx !== -1) callbacks.splice(idx, 1)
  },

  getCaches: async (): Promise<Caches> => {
    return Storage.get<Caches>(LOCAL_STORAGE_KEY.CACHES, STORAGE_AREA.LOCAL)
  },

  getUrls: (settings: UserSettingsType): string[] => {
    const iconUrls = settings.commands.map((c) => c.iconUrl)
    const folderIconUrls = settings.folders.map((f) => f.iconUrl)
    const optionIconUrls = OptionSettings.commands.map((c) => c.iconUrl)
    return [
      ...iconUrls,
      ...folderIconUrls,
      ...optionIconUrls,
      OptionSettings.folder.iconUrl,
    ] as string[]
  },
}

const removeOptionSettings = (data: UserSettingsType): void => {
  data.commands = data.commands.filter(
    (c) => c?.parentFolderId !== OPTION_FOLDER,
  )
  data.folders = data.folders.filter((f) => f.id !== OPTION_FOLDER)
}

export const migrate = (data: UserSettingsType): UserSettingsType => {
  if (data.settingVersion == null) {
    data = migrate073(data)
  }
  if (versionDiff(data.settingVersion, '0.8.2') === VersionDiff.Old) {
    data = migrate082(data)
  }
  if (versionDiff(data.settingVersion, '0.10.0') === VersionDiff.Old) {
    data.settingVersion = VERSION as Version
    data = migrate0_10_0(data)
  }
  return data
}

const migrate073 = (data: UserSettingsType): UserSettingsType => {
  if (data.startupMethod == null) {
    data.startupMethod = DefaultSettings.startupMethod as {
      method: STARTUP_METHOD
    }
  }
  return data
}

const migrate082 = (data: UserSettingsType): UserSettingsType => {
  // parentFolder -> parentFolderId
  data.commands = data.commands.map((c) => {
    if (c.parentFolder != null) {
      c.parentFolderId = c.parentFolder.id
      delete c.parentFolder
    }
    return c
  })
  return data
}

const migrate0_10_0 = (data: UserSettingsType): UserSettingsType => {
  // Add a link command if not exists.
  const linkCommands = data.commands.filter(isLinkCommand)
  if (linkCommands.length === 0) {
    const defaultLinkCommand = DefaultCommands.find(isLinkCommand)
    if (defaultLinkCommand != null) {
      data.commands.push(defaultLinkCommand)
      console.debug('migrate 0.10.0 link command')
    }
  }
  return data
}
