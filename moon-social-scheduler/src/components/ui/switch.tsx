"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-white/10 transition-all duration-300 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-primary/50 focus-visible:shadow-lg focus-visible:shadow-primary/10 aria-invalid:border-destructive/50 aria-invalid:shadow-lg aria-invalid:shadow-destructive/10 data-[size=default]:h-7 data-[size=default]:w-12 data-[size=sm]:h-5 data-[size=sm]:w-9 data-unchecked:bg-white/5 data-checked:bg-primary/20 data-checked:border-primary/30 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-background ring-0 transition-all duration-300 shadow-lg group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4 group-data-[size=default]/switch:data-checked:translate-x-5 group-data-[size=sm]/switch:data-checked:translate-x-4 group-data-[size=default]/switch:data-unchecked:translate-x-1 group-data-[size=sm]/switch:data-unchecked:translate-x-1 data-checked:bg-primary data-unchecked:bg-muted-foreground/50"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
