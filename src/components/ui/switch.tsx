import React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void
  label?: string
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, label, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(event.target.checked)
    }

    return (
      <label className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            ref={ref}
            onChange={handleChange}
            {...props}
          />
          <div className={cn(
            "block bg-gray-600 w-14 h-8 rounded-full transition-colors duration-200 ease-in-out",
            props.checked ? "bg-yellow-500" : "",
            className
          )}></div>
          <div className={cn(
            "absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out",
            props.checked ? "transform translate-x-6" : ""
          )}></div>
        </div>
        {label && <span className="ml-3 text-sm font-medium text-gray-300">{label}</span>}
      </label>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }