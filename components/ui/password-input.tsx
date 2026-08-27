"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface PasswordInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  /** Class applied to the wrapping element rather than the input itself. */
  wrapperClassName?: string
}

/**
 * Password field with an accessible show/hide toggle.
 *
 * The toggle is a real <button type="button"> so it never submits the parent
 * form, is reachable by keyboard, and announces its state to screen readers via
 * aria-pressed + a dynamic label. Visibility resets to hidden whenever the field
 * becomes disabled so a password is never left revealed in a locked-out form.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, wrapperClassName, disabled, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)

    // Never leave the value revealed if the field gets disabled mid-interaction.
    React.useEffect(() => {
      if (disabled) setVisible(false)
    }, [disabled])

    const Icon = visible ? EyeOff : Eye
    const label = visible ? "Hide password" : "Show password"

    return (
      <div className={cn("relative", wrapperClassName)}>
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          disabled={disabled}
          // Leave room for the toggle so long values never sit under the icon.
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={label}
          aria-pressed={visible}
          title={label}
          // Excluded from the tab order only when disabled, so keyboard users
          // can still reach it in the normal flow.
          tabIndex={disabled ? -1 : 0}
          className="absolute inset-y-0 right-0 flex items-center justify-center px-3 rounded-r-md
            text-muted-foreground transition-colors hover:text-foreground
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
            disabled:pointer-events-none disabled:opacity-50"
        >
          <Icon className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
