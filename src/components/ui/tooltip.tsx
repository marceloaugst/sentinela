import * as Primitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

export const TooltipProvider = Primitive.Provider

export function Tooltip({ content, children, side = 'right' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <Primitive.Root delayDuration={200}>
      <Primitive.Trigger asChild>{children}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          side={side}
          sideOffset={6}
          className="z-50 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
        >
          {content}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  )
}
