import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "glass h-10 w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base transition-all duration-300 outline-none placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:bg-white/10 focus-visible:shadow-lg focus-visible:shadow-primary/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive/50 aria-invalid:shadow-lg aria-invalid:shadow-destructive/10",
        className
      )}
      {...props}
    />
  )
}

export { Input }
