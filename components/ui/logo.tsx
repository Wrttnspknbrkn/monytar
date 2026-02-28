import Image from "next/image"
import { Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const sizes = {
  sm: { wrapper: "gap-2", imgH: 18, iconBox: "w-6 h-6", iconInner: "w-3 h-3" },
  md: { wrapper: "gap-2.5", imgH: 24, iconBox: "w-8 h-8", iconInner: "w-4 h-4" },
  lg: { wrapper: "gap-3", imgH: 30, iconBox: "w-10 h-10", iconInner: "w-5 h-5" },
}

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showIcon?: boolean
  variant?: "default" | "white"
}

export function Logo({ size = "md", className, showIcon = true, variant = "default" }: LogoProps) {
  const s = sizes[size]

  return (
    <span className={cn("flex items-center", s.wrapper, className)}>
      {showIcon && (
        <span
          className={cn(
            "flex items-center justify-center rounded-lg shadow-sm",
            s.iconBox,
            variant === "white"
              ? "bg-white/20 backdrop-blur-sm shadow-white/10"
              : "bg-primary shadow-primary/25",
          )}
        >
          <Wallet
            className={cn(
              s.iconInner,
              variant === "white" ? "text-white" : "text-primary-foreground",
            )}
          />
        </span>
      )}
      {variant === "white" ? (
        <span
          className={cn(
            "font-heading font-bold tracking-tight text-white",
            size === "sm" ? "text-sm" : size === "md" ? "text-lg" : "text-xl",
          )}
        >
          SpendWell
        </span>
      ) : (
        <Image
          src="/images/spendwell-logo.png"
          alt="SpendWell"
          width={Math.round(s.imgH * 4.5)}
          height={s.imgH}
          className="object-contain"
          priority
        />
      )}
    </span>
  )
}
