import React from 'react'
import type { ExecProps } from './index'

import {
  resultTable,
  resultTableContainer,
  resultTableHeader,
  resultTableBody,
  resultTableProperty,
  resultTableValue,
  resultTableCopy,
} from '@/components/menu/ResultPopup.module.css'
import { Icon } from '@/components/Icon'

const toName = (str: string) => {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}

const toProp = (str: string) => {
  return str.replace(/([A-Z])/g, '-$1').replace(/^./, (s) => s.toLowerCase())
}

export const GetStyles = {
  async execute({ target }: ExecProps) {
    if (target) {
      const styles = getFontCSS(target as HTMLElement)
      const ret = Object.entries(styles).map(([key, value]) => ({
        key,
        value,
      }))

      const cssCopy = () => {
        const copyText = ret
          .map((item) => `${toProp(item.key)}: ${item.value};`)
          .join('\n')
        navigator.clipboard.writeText(copyText)
      }

      return (
        <div className={resultTableContainer}>
          <button className={resultTableCopy} onClick={cssCopy}>
            <Icon name="copy" />
            Copy
          </button>
          <table className={resultTable}>
            <thead className={resultTableHeader}>
              <tr key="table-header">
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody className={resultTableBody}>
              {ret.map((item) => {
                return (
                  <tr key={item.key}>
                    <td className={resultTableProperty}>{toName(item.key)}</td>
                    <td className={resultTableValue}>{item.value}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }
  },
}

type FontCSS = Pick<
  CSSStyleDeclaration,
  | 'fontFamily'
  | 'fontWeight'
  | 'fontStyle'
  | 'fontSize'
  | 'color'
  | 'lineHeight'
  | 'letterSpacing'
>

const CANVAS_OPTIONS = {
  fillStyle: 'rgb(0,0,0)',
  height: 50,
  size: '40px',
  textBaseline: 'top',
  width: 600,
}

function getFontOption(css: FontCSS) {
  return `${css.fontStyle} ${css.fontWeight} ${CANVAS_OPTIONS.size} ${css.fontFamily}`
}

function getCanvasData(css: FontCSS, text = 'abcdefghijklmnopqrstuvwxyz') {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_OPTIONS.width
  canvas.height = CANVAS_OPTIONS.height

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  Object.assign(ctx, CANVAS_OPTIONS)

  ctx.font = getFontOption(css)
  ctx.fillText(text, 0, 0)

  return canvas
    .getContext('2d')
    ?.getImageData(0, 0, CANVAS_OPTIONS.width, CANVAS_OPTIONS.height).data
}

function isFontEqual(leftCss: FontCSS, rightCss: FontCSS) {
  const left = getCanvasData(leftCss)
  const right = getCanvasData(rightCss)

  if (!left || !right) return false

  if (left.length !== right.length) {
    return false
  }

  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) {
      return false
    }
  }

  return true
}

const getActiveFont = (css: FontCSS) => {
  const stack = css.fontFamily.split(/,\s*/)

  for (let f = 0; f < stack.length; f++) {
    const serifStyle = {
      ...css,
      fontFamily: stack[f] + ', serif',
    }
    const sansSerifStyle = {
      ...css,
      fontFamily: stack[f] + ', sans-serif',
    }

    if (
      isFontEqual(serifStyle, sansSerifStyle) &&
      isFontEqual(serifStyle, css)
    ) {
      return stack[f]
    }
  }
  return css.fontFamily
}

function getFontCSS(element: HTMLElement): FontCSS {
  const computed = getComputedStyle(element)

  return {
    fontFamily: getActiveFont(computed),
    fontWeight: computed.getPropertyValue('font-weight') || 'normal',
    fontStyle: computed.getPropertyValue('font-style') || 'normal',
    fontSize: computed.getPropertyValue('font-size'),
    color: computed.getPropertyValue('color'),
    lineHeight: computed.getPropertyValue('line-height'),
    letterSpacing: computed.getPropertyValue('letter-spacing'),
  }
}
