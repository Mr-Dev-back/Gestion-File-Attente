import { type LucideIcon } from 'lucide-react';
import { Card } from '../../molecules/ui/card';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    iconColor?: string;
    iconBgColor?: string;
}

export const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    iconColor = 'text-primary',
    iconBgColor = 'bg-primary/10'
}: StatCardProps) => {
    return (
        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                    {trend && (
                        <div className="flex items-center mt-2">
                            <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">vs hier</span>
                        </div>
                    )}
                </div>
                <div className={`${iconBgColor} p-3 rounded-xl`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
            </div>
        </Card>
    );
};
