import { useState, useEffect } from 'react'
import { MOUSE, LINK_COMMAND_ENABLED } from '@/const'
import { Point } from '@/types'
import { ExecState } from '@/action'
import { LinkPreview } from '@/action/linkPreview'
import { useSetting } from '@/hooks/useSetting'
import {
  isPopup,
  isAnchorElement,
  isClickableElement,
  isLinkCommand,
  getScreenSize,
} from '@/services/util'

const isTargetEvent = (e: MouseEvent): boolean => {
  return (
    e.button === MOUSE.LEFT &&
    !isPopup(e.target as Element) &&
    (isAnchorElement(e.target as Element) ||
      isClickableElement(e.target as Element))
  )
}

export function useDetectDrag() {
  const [startPosition, setStartPosition] = useState<Point | null>()
  const [mousePosition, setMousePosition] = useState<Point | null>()
  const [target, setTarget] = useState<Element | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [activate, setActivate] = useState(false)
  const [progress, setProgress] = useState(0)
  const { settings, pageRule } = useSetting()
  const command = settings.commands.find((c) => isLinkCommand(c))
  const showIndicator = command?.linkCommandOption.showIndicator ?? true
  const commandEnabled =
    pageRule?.linkCommandEnabled !== LINK_COMMAND_ENABLED.DISABLE
  const playPixel = 20
  const threshold = command?.linkCommandOption.threshold ?? 150

  const onChangeState = (state: ExecState, message?: string) => {
    console.debug({ state, message })
  }

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!isTargetEvent(e)) return
      setStartPosition({ x: e.clientX, y: e.clientY })
      setTarget(e.target as Element)
      e.stopPropagation()
      e.preventDefault()
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (e.button !== MOUSE.LEFT) return
      if (startPosition == null) return

      const current = { x: e.clientX, y: e.clientY }
      const distance = Math.sqrt(
        Math.pow(current.x - startPosition.x, 2) +
          Math.pow(current.y - startPosition.y, 2),
      )

      setMousePosition(current)
      setIsDetecting(showIndicator && distance > playPixel)
      setActivate(distance > threshold)
      setProgress(Math.min(Math.floor((distance / threshold) * 100), 100))
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button !== MOUSE.LEFT) return
      if (startPosition == null) return
      if (activate && command) {
        const screen = getScreenSize()
        const position = { x: e.screenX, y: e.screenY - 50 }
        if (
          command.popupOption &&
          command.popupOption.height + position.y - screen.top > screen.height
        ) {
          position.y = screen.height - command.popupOption.height + screen.top
        }
        if (
          command.popupOption &&
          command.popupOption.width + position.x - screen.left > screen.width
        ) {
          position.x = screen.width - command.popupOption.width + screen.left
        }
        LinkPreview.execute({
          selectionText: '',
          command,
          position,
          useSecondary: false,
          changeState: onChangeState,
          target,
        })
      }
      setStartPosition(null)
      setTarget(null)
      setMousePosition(null)
      setIsDetecting(false)
      setActivate(false)
    }

    if (commandEnabled) {
      window.addEventListener('mousedown', handleMouseDown)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('mousemove', handleMouseMove)
    }
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [commandEnabled, startPosition, activate, command, target])

  return { progress, mousePosition, isDetecting }
}
