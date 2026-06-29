import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-all duration-300 focus-visible:border-ring focus-visible:shadow-lg focus-visible:shadow-ring/20 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:border-destructive aria-invalid:shadow-lg aria-invalid:shadow-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "glass border-primary/30 bg-primary/10 text-primary-foreground [a]:hover:bg-primary/20 [a]:hover:border-primary/50",
        secondary:
          "glass border-secondary/30 bg-secondary/10 text-secondary-foreground [a]:hover:bg-secondary/20 [a]:hover:border-secondary/50",
        destructive:
          "glass border-destructive/30 bg-destructive/10 text-destructive [a]:hover:bg-destructive/20 [a]:hover:border-destructive/50 [a]:hover:shadow-lg [a]:hover:shadow-destructive/20",
        outline:
          "glass border-white/10 bg-white/5 text-foreground [a]:hover:bg-white/10 [a]:hover:border-white/20",
        glow: "animated-gradient border-transparent text-white [a]:hover:shadow-xl [a]:hover:shadow-primary/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
