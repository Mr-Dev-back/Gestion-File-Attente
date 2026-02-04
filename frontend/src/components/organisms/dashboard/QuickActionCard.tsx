import { type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../molecules/ui/card';
import { ArrowRight } from 'lucide-react';

interface QuickActionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    iconColor?: string;
    iconBgColor?: string;
}

export const QuickActionCard = ({
    title,
    description,
    icon: Icon,
    href,
    iconColor = 'text-primary',
    iconBgColor = 'bg-primary/10'
}: QuickActionCardProps) => {
    const navigate = useNavigate();

    return (
        <Card
            className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-primary/50"
            onClick={() => navigate(href)}
        >
            <div className="flex items-start gap-4">
                <div className={`${iconBgColor} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
        </Card>
    );
};
