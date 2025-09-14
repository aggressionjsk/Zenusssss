import { cn } from "@/lib/utils"
import { forwardRef } from "react"

const Skeleton = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn("animate-pulse rounded-md bg-muted", className)}
    ref={ref}
    {...props}
  />
))
Skeleton.displayName = "Skeleton"

export { Skeleton }