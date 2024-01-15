import React, { useState, useContext } from 'react'
import { MenuItem } from './MenuItem'
import { menu, list } from './Menu.module.css'
import { context } from './App'

type MenuProps = {
  selectionText: string
}

const NOT_SELECTED = -1

export function Menu(props: MenuProps): JSX.Element {
  const settings = useContext(context)
  const commands = settings.commands
  const [currentId, setCurrentId] = useState(NOT_SELECTED)

  function toUrl(searchUrl: string, text: string): string {
    let textEscaped = text.replaceAll(' ', '+')
    textEscaped = encodeURI(textEscaped)
    return searchUrl.replace('%s', textEscaped)
  }

  return (
    <div className={menu}>
      <ul className={list}>
        {commands.map((obj) => {
          return (
            <li key={'menu_' + obj.id}>
              <MenuItem
                menuId={obj.id}
                title={obj.title}
                url={toUrl(obj.searchUrl, props.selectionText)}
                iconUrl={obj.iconUrl}
                openMode={obj.openMode}
                currentMenuId={currentId}
                onSelect={setCurrentId}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
