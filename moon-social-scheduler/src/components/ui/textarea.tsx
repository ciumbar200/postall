import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "glass flex field-sizing-content min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base transition-all duration-300 outline-none placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:bg-white/10 focus-visible:shadow-lg focus-visible:shadow-primary/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive/50 aria-invalid:shadow-lg aria-invalid:shadow-destructive/10 resize-none",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
