import { Card } from '../../molecules/ui/card';
import { Clock } from 'lucide-react';

export interface Activity {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'success' | 'warning' | 'info' | 'error';
}

export interface RecentActivityListProps {
    activities: Activity[];
    maxItems?: number;
}

export const RecentActivityList = ({ activities, maxItems = 5 }: RecentActivityListProps) => {
    const displayedActivities = activities.slice(0, maxItems);

    const getTypeColor = (type: Activity['type']) => {
        const colors = {
            success: 'bg-green-100 text-green-600',
            warning: 'bg-yellow-100 text-yellow-600',
            info: 'bg-blue-100 text-blue-600',
            error: 'bg-red-100 text-red-600'
        };
        return colors[type];
    };

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité Récente</h3>
            <div className="space-y-4">
                {displayedActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune activité récente
                    </p>
                ) : (
                    displayedActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                            <div className={`w-2 h-2 rounded-full mt-2 ${getTypeColor(activity.type).split(' ')[0]}`} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{activity.timestamp}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
};
