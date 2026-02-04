import * as React from "react"
import { cn } from "../../../lib/utils"

interface TabsProps {
    defaultValue: string
    children: React.ReactNode
    className?: string
}

const TabsContext = React.createContext<{
    value: string
    setValue: (value: string) => void
} | null>(null)

export function Tabs({ defaultValue, children, className }: TabsProps) {
    const [value, setValue] = React.useState(defaultValue)
    return (
        <TabsContext.Provider value={{ value, setValue }}>
            <div className={cn("w-full", className)}>{children}</div>
        </TabsContext.Provider>
    )
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("inline-flex items-center justify-center rounded-lg bg-secondary/50 p-1 text-text-muted", className)}>
            {children}
        </div>
    )
}

interface TabsTriggerProps {
    value: string
    children: React.ReactNode
    className?: string
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsTrigger must be used within Tabs")

    const isActive = context.value === value

    return (
        <button
            onClick={() => context.setValue(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                isActive
                    ? "bg-surface text-text-main shadow-sm"
                    : "hover:bg-surface/50 hover:text-text-main",
                className
            )}
        >
            {children}
        </button>
    )
}

interface TabsContentProps {
    value: string
    children: React.ReactNode
    className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsContent must be used within Tabs")

    if (context.value !== value) return null

    return (
        <div className={cn("mt-2 focus-visible:outline-none", className)}>
            {children}
        </div>
    )
}
