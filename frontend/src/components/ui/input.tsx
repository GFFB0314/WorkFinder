import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "../../lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false)
        const isPassword = type === "password"

        const togglePassword = () => setShowPassword(!showPassword)

        return (
            <div className="relative">
                <input
                    type={isPassword && showPassword ? "text" : type}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={togglePassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
