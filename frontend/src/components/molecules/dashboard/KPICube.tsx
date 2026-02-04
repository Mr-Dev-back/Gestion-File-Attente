import { Card, CardContent } from '../ui/card';
import { cn } from '../../../lib/utils';
import { type LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPICubeProps {
    title: string;
    value: string | number;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    icon: LucideIcon;
    color: "primary" | "secondary" | "success" | "warning" | "danger" | "info";
}

const colorMap = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    info: "bg-blue-500/10 text-blue-500",
};

export function KPICube({ title, value, trend, icon: Icon, color }: KPICubeProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-text-muted mb-1">{title}</p>
                        <h3 className="text-2xl font-bold text-text-main">{value}</h3>
                    </div>
                    <div className={cn("p-3 rounded-xl", colorMap[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>

                {trend && (
                    <div className="mt-4 flex items-center gap-2">
                        <span className={cn(
                            "text-xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-1",
                            trend.isPositive ? "text-success bg-success/10" : "text-danger bg-danger/10"
                        )}>
                            {trend.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(trend.value)}%
                        </span>
                        <span className="text-xs text-text-muted">vs hier</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
