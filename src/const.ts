export const APP_ID = process.env.NAME as string
export const VERSION = process.env.VERSION

export enum OPEN_MODE {
  POPUP = 'popup',
  TAB = 'tab',
  API = 'api',
  LINK_POPUP = 'linkPopup',
  COPY = 'copy',
  OPTION = 'option',
  GET_TEXT_STYLES = 'getTextStyles',
  ADD_PAGE_RULE = 'addPageRule',
}

export enum STARTUP_METHOD {
  TEXT_SELECTION = 'textSelection',
  CONTEXT_MENU = 'contextMenu',
  KEYBOARD = 'keyboard',
  LEFT_CLICK_HOLD = 'leftClickHold',
}

export enum KEYBOARD {
  CTRL = 'Control',
  ALT = 'Alt',
  SHIFT = 'Shift',
  META = 'Meta',
}

export enum MOUSE {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
}

export enum POPUP_ENABLED {
  ENABLE = 'Enable',
  DISABLE = 'Disable',
}

export enum STYLE {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}

export enum OPTION_MSG {
  START = 'start',
  CHANGED = 'changed',
  JUMP = 'jump',
  FETCH_ICON_URL = 'fetchIconUrl',
  RES_FETCH_ICON_URL = 'resFetchIconUrl',
  KEY_INPUT = 'key_input',
  MOUSE = 'mouse',
}

export const ROOT_FOLDER = ''
export const OPTION_FOLDER = 'option'

/**
 * Setting value to switch the debug log output from this module.
 * true: enables all log. | false: disables debug log.
 */
const environment = process.env.NODE_ENV || 'development'
export const isDebug = environment === 'development'
