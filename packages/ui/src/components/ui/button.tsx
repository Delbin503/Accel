import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button-variants"

// Accel: buttonVariants lives in ./button-variants.ts so this file only exports
// components (React Fast Refresh).

function Button({
  className,
  variant = "default",
  size = "sm",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      // Exposes the variant so a container can style by it — the Modal Gallery's
      // "tidy" preview hides ghost (Cancel) buttons this way. No visual change.
      data-variant={variant ?? "default"}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
