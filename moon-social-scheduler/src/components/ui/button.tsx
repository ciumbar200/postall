import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border text-sm font-medium whitespace-nowrap transition-all duration-300 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "glass border-primary/30 bg-primary/10 text-primary-foreground hover:bg-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5",
        glow: "animated-gradient border-transparent text-white hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5",
        outline:
          "glass border-border/30 bg-background/50 text-foreground hover:bg-accent/10 hover:border-accent/50 hover:-translate-y-0.5",
        secondary:
          "glass border-secondary/30 bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 hover:border-secondary/50 hover:-translate-y-0.5",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:backdrop-blur-sm",
        destructive:
          "glass border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:border-destructive/50 hover:shadow-lg hover:shadow-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "glass-shine glass-card border-white/10 bg-white/5 text-foreground hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5",
      },
      size: {
        default:
          "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-lg px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-lg px-3 text-[0.8rem] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-9",
        "icon-xs": "size-6 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  nativeButton,
  asChild,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const childRender =
    render ?? (asChild && React.isValidElement(children) ? children : undefined)
  const usesCustomElement = Boolean(childRender)
  const content = usesCustomElement && asChild ? undefined : children

  return (
    <ButtonPrimitive
      data-slot="button"
      nativeButton={usesCustomElement ? false : nativeButton}
      render={childRender}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {content}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
