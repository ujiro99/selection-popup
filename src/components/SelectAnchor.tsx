import React, {
  useState,
  useEffect,
  forwardRef,
  useContext,
  useCallback,
} from 'react'
import { context } from '@/components/App'
import { useLeftClickHold } from '@/hooks/useDetectStartup'
import { MOUSE } from '@/const'
import { isEmpty, isPopup } from '@/services/util'

type Point = {
  x: number
  y: number
}

type Props = {
  selectionText: string
  removeDelay?: number
}

const SIZE = 40

export const SelectAnchor = forwardRef<HTMLDivElement, Props>(
  (props: Props, ref) => {
    const { setTarget } = useContext(context)
    const [isMouseDown, setIsMouseDown] = useState<boolean>(false)
    const [isDragging, setIsDragging] = useState<boolean>(false)
    const [point, setPoint] = useState<Point | null>(null)
    const [offset, setOffset] = useState<Point>({} as Point)
    const [delayTO, setDelayTO] = useState<number | null>()
    const { detectHold, position } = useLeftClickHold(props)
    const selected = !isEmpty(props.selectionText)

    useEffect(() => {
      // Offset of the body
      const style = window.getComputedStyle(document.documentElement)
      const x = parseInt(style.marginLeft, 10)
      const y = parseInt(style.marginTop, 10)
      setOffset({ x, y })
    }, [])

    const isTargetEvent = (e: MouseEvent): boolean => {
      return e.button === MOUSE.LEFT && !isPopup(e.target as Element)
    }

    // event / mode      | invisible | visible              |
    // 1. mouse move     | none      | hide immediately     |
    // 2. mouse hold     | show      | none                 |
    // 3. drag           | show      | show(move)           |
    // 4. click          | none      | hide after animation |
    // 5. double click   | show      | show(move)           |
    // 6. tripple click  | show      | show(move)           |

    const setAnchor = useCallback(
      (p: Point) => {
        clearTimeout(delayTO as number)
        setPoint(p)
        const s = document.getSelection()
        setTarget(s?.getRangeAt(0)?.startContainer.parentElement as Element)
      },
      [delayTO, setPoint, setTarget],
    )

    const releaseAnchor = useCallback(
      (immediately = false) => {
        clearTimeout(delayTO as number)
        if (immediately) {
          setPoint(null)
          return
        }
        const to = window.setTimeout(() => {
          setPoint(null)
        }, props.removeDelay ?? 0)
        setDelayTO(to)
      },
      [delayTO, setPoint, props.removeDelay],
    )

    useEffect(() => {
      const onMouseDown = (e: MouseEvent) => {
        setIsMouseDown(true)
      }

      const onMouseUp = (e: MouseEvent) => {
        setIsMouseDown(false)
        if (!isTargetEvent(e)) return
        if (e.detail >= 3) {
          // With triple-clicking, the entire phrase is selected.
          // In this case, it is treated the same as a double click.
          onDouble(e)
          return
        }
        if (isDragging) {
          onDrag(e)
        }
        if (detectHold) {
          e.preventDefault()
          e.stopPropagation()
        }
      }

      const onClick = (e: MouseEvent) => {
        if (!isTargetEvent(e)) return
        if (isDragging) {
          setIsDragging(false)
          return
        }
        if (!selected) {
          releaseAnchor()
        }
      }

      const onDrag = (e: MouseEvent) => {
        if (!isTargetEvent(e)) return
        setAnchor({ x: e.clientX, y: e.clientY })
      }

      const onDouble = (e: MouseEvent) => {
        if (!isTargetEvent(e)) return
        setAnchor({ x: e.clientX, y: e.clientY })
      }

      document.addEventListener('mousedown', onMouseDown)
      document.addEventListener('mouseup', onMouseUp)
      document.addEventListener('click', onClick)
      document.addEventListener('dblclick', onDouble)
      return () => {
        document.removeEventListener('mousedown', onMouseDown)
        document.removeEventListener('mouseup', onMouseUp)
        document.removeEventListener('click', onClick)
        document.removeEventListener('dblclick', onDouble)
      }
    }, [
      isMouseDown,
      isDragging,
      detectHold,
      selected,
      releaseAnchor,
      setAnchor,
    ])

    useEffect(() => {
      const onMouseMove = (e: MouseEvent) => {
        if (!isTargetEvent(e)) return
        setIsDragging(true)
        if (point != null) {
          releaseAnchor(true)
        }
      }
      if (isMouseDown) {
        document.addEventListener('mousemove', onMouseMove)
      }
      return () => {
        document.removeEventListener('mousemove', onMouseMove)
      }
    }, [point, isMouseDown, setIsDragging, releaseAnchor])

    useEffect(() => {
      if (detectHold) {
        if (point == null) {
          setAnchor(position)
        }
      }
    }, [detectHold, point, setAnchor])

    if (point == null) return null

    const styles = {
      position: 'absolute',
      top: window.scrollY + point.y - offset.y - SIZE / 2,
      left: window.scrollX + point.x - offset.x - SIZE / 2,
      height: SIZE,
      width: SIZE,
      pointerEvents: 'none',
      zIndex: 2147483647,
      // backgroundColor: 'rgba(255, 0, 0, 0.6)',
      // border: '1px solid red',
    } as React.CSSProperties

    return (
      <>
        <div style={styles} ref={ref} />
        <LinkClickGuard {...props} />
      </>
    )
  },
)

const LinkClickGuard = (props: Props) => {
  const { detectHoldLink, position } = useLeftClickHold(props)

  const styles = {
    position: 'absolute',
    top: window.scrollY + position?.y - 5,
    left: window.scrollX + position?.x - 5,
    height: 10,
    width: 10,
  } as React.CSSProperties

  return detectHoldLink && <div style={styles} />
}
