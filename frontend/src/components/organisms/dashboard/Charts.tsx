import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../molecules/ui/card";
import { useTruckStore, type Truck } from "../../../stores/useTruckStore";

const volumeData = [
    { name: "06h", camions: 12 },
    { name: "08h", camions: 45 },
    { name: "10h", camions: 68 },
    { name: "12h", camions: 55 },
    { name: "14h", camions: 40 },
    { name: "16h", camions: 72 },
    { name: "18h", camions: 38 },
];



export function VolumeChart() {
    return (
        <Card className="h-[400px]">
            <CardHeader>
                <CardTitle>Volume de Camions par Heure</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={volumeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCamions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0097e6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#0097e6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#718093" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#718093" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dcdde1" />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #dcdde1" }}
                                itemStyle={{ color: "#2f3640" }}
                            />
                            <Area type="monotone" dataKey="camions" stroke="#0097e6" strokeWidth={2} fillOpacity={1} fill="url(#colorCamions)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

export function CategoryDistributionChart() {
    const { trucks } = useTruckStore();

    // Calculation of category distribution
    const categoryStats = trucks.reduce((acc: Record<string, number>, truck: Truck) => {
        if (truck.categories && Array.isArray(truck.categories)) {
            truck.categories.forEach((cat) => {
                acc[cat] = (acc[cat] || 0) + 1;
            });
        }
        return acc;
    }, {} as Record<string, number>);

    const COLORS: Record<string, string> = {
        'INFRA': '#3b82f6', // blue
        'ELECT': '#eab308', // yellow
        'BATIMENT': '#22c55e',   // green
    };

    // Convert to format required by Recharts
    const data = Object.entries(categoryStats).map(([name, value]) => ({
        name,
        value,
        color: COLORS[name] || '#94a3b8'
    }));

    if (data.length === 0) {
        data.push({ name: "Aucune donnée", value: 1, color: "#e5e7eb" });
    }

    return (
        <Card className="h-[400px]">
            <CardHeader>
                <CardTitle>Répartition par Catégorie (Live)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

export function WaitTimeChart() {
    return (
        <Card className="h-[400px]">
            <CardHeader>
                <CardTitle>Temps d'Attente Moyen</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={volumeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="camions" fill="#2f3640" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
