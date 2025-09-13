"use client"

import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"

const SlotClone = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ children, asChild = false, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children,
      {
        ...props,
        ...children.props,
        ref: ref
          ? (value: unknown) => {
              if (typeof ref === "function") {
                ref(value as HTMLDivElement)
              } else if (ref) {
                ref.current = value as HTMLDivElement
              }

              const { ref: childRef } = children as unknown as {
                ref: React.Ref<HTMLDivElement>
              }

              if (typeof childRef === "function") {
                childRef(value as HTMLDivElement)
              } else if (childRef) {
                ;(childRef as React.MutableRefObject<unknown>).current = value
              }
            }
          : undefined,
      },
      (children as React.ReactElement<any>).props.children
    )
  }

  return (
    <Slot ref={ref} {...props}>
      <Slottable>{children}</Slottable>
    </Slot>
  )
})

SlotClone.displayName = "SlotClone"

export { SlotClone }