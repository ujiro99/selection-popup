import React, { useState, useEffect, forwardRef, useContext } from 'react'
import { APP_ID } from '@/const'
import { context } from '@/components/App'
import { useLeftClickHold } from '@/hooks/useDetectStartup'

function isPopup(elm: Element): boolean {
  if (elm == null) return false
  if (elm.id === APP_ID) return true
  if (elm.nodeName === 'body') return false
  return isPopup(elm.parentElement as Element)
}

type Point = {
  x: number
  y: number
}

type Rect = {
  start: Point
  end: Point
}

type Props = {
  selectionText: string
}
export const SelectAnchor = forwardRef<HTMLDivElement, Props>(
  (props: Props, ref) => {
    const text = props.selectionText
    const selected = text != null && text.length > 0
    const { setTarget } = useContext(context)
    const [startPoint, setStartPoint] = useState<Point>({} as Point)
    const [rect, setRect] = useState<Rect>()
    const detectHold = useLeftClickHold(props)

    useEffect(() => {
      const onDown = (e: MouseEvent) => {
        if (!isPopup(e.target as Element)) {
          setStartPoint({ x: e.x, y: e.y })
          setTarget(e.target as Element)
        }
      }
      const onUp = (e: MouseEvent) => {
        if (!isPopup(e.target as Element)) {
          const endPoint = { x: e.x, y: e.y }

          if (startPoint.x === endPoint.x && startPoint.y === endPoint.y) {
            // Remove rect if it's a click
            setRect(undefined)
          }

          const start = { ...startPoint }
          const end = { x: e.x, y: e.y }
          if (startPoint.x > endPoint.x) {
            start.x = endPoint.x
            end.x = startPoint.x
          }
          if (startPoint.y > endPoint.y) {
            start.y = endPoint.y
            end.y = startPoint.y
          }
          setRect({ start, end })

          if (detectHold) {
            e.preventDefault()
            e.stopPropagation()
          }
        }
      }
      document.addEventListener('mousedown', onDown)
      document.addEventListener('mouseup', onUp)
      return () => {
        document.removeEventListener('mousedown', onDown)
        document.removeEventListener('mouseup', onUp)
      }
    }, [setTarget, startPoint, detectHold])

    if (rect == null || !selected) return null

    const { start, end } = rect
    const styles = {
      position: 'absolute',
      top: window.scrollY + start.y,
      left: window.scrollX + start.x,
      height: end.y - start.y,
      width: end.x - start.x,
      pointerEvents: 'none',
      padding: '4px', // adjust position of the Popup
    } as React.CSSProperties

    return <div style={styles} ref={ref} />
  },
)
