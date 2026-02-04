import * as React from "react"
import { cn } from "../../../lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning";
    size?: "default" | "sm" | "lg" | "icon";
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", isLoading, children, ...props }, ref) => {

        // Base styles
        const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer shadow-sm active:scale-[0.98] duration-100";

        // Variant styles
        const variants = {
            default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow",
            destructive: "bg-danger text-white hover:bg-danger/90 shadow-sm",
            outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground shadow-none",
            link: "text-primary underline-offset-4 hover:underline shadow-none",
            success: "bg-success text-white hover:bg-success/90 shadow",
            warning: "bg-warning text-black hover:bg-warning/90 shadow",
        };

        // Size styles
        const sizes = {
            default: "h-9 px-4 py-2",
            sm: "h-8 rounded-md px-3 text-xs",
            lg: "h-10 rounded-md px-8",
            icon: "h-9 w-9",
        };

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                        {children}
                    </span>
                ) : (
                    children
                )}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
