import { useState } from 'react';
import { useSystemSettings, type SystemSetting } from '../../hooks/useSystemSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../molecules/ui/card';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../molecules/ui/tabs';
import { Save, Sliders } from 'lucide-react';
import { cn } from '../../lib/utils';

export const SettingsManager = () => {
    const { settings, isLoading, error, updateSetting } = useSystemSettings();
    const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});

    const handleInputChange = (key: string, value: string) => {
        setEditedSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = (setting: SystemSetting) => {
        const newValue = editedSettings[setting.key];
        if (newValue === undefined) return; // No change

        updateSetting.mutate({
            ...setting,
            value: newValue,
            scope: 'GLOBAL' // Defaulting to GLOBAL edits for Admin
        }, {
            onSuccess: () => {
                // Clear dirty state for this key
                const newEdited = { ...editedSettings };
                delete newEdited[setting.key];
                setEditedSettings(newEdited);
            }
        });
    };

    if (isLoading) return <div className="p-8 text-center text-text-muted">Chargement de la configuration...</div>;
    if (error) return <div className="p-8 text-center text-destructive">Erreur de chargement des paramètres.</div>;

    // Normalize category mapping for tabs (simplified)
    const groupedSettings: Record<string, SystemSetting[]> = {
        'general': settings.filter(s => !s.category || s.category.toUpperCase() === 'GENERAL' || s.category.toUpperCase() === 'PROCESS'),
        'display': settings.filter(s => s.category?.toUpperCase() === 'DISPLAY'),
        'notifications': settings.filter(s => s.category?.toUpperCase() === 'NOTIFICATIONS'),
    };

    // Helper to render input based on type
    const renderInput = (setting: SystemSetting) => {
        const value = editedSettings[setting.key] ?? setting.value;
        const isDirty = editedSettings[setting.key] !== undefined && editedSettings[setting.key] !== setting.value;

        switch (setting.type) {
            case 'BOOLEAN':
                return (
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant={value === 'true' ? 'default' : 'outline'}
                                onClick={() => handleInputChange(setting.key, 'true')}
                                className={cn("h-8 px-3", value === 'true' ? "bg-green-600 hover:bg-green-700" : "")}
                            >Oui</Button>
                            <Button
                                size="sm"
                                variant={value === 'false' ? 'default' : 'outline'}
                                onClick={() => handleInputChange(setting.key, 'false')}
                                className={cn("h-8 px-3", value === 'false' ? "bg-red-600 hover:bg-red-700" : "")}
                            >Non</Button>
                        </div>
                        {isDirty && (
                            <Button size="sm" variant="ghost" onClick={() => handleSave(setting)} disabled={updateSetting.isPending}>
                                <Save className="h-4 w-4 text-primary" />
                            </Button>
                        )}
                    </div>
                );
            case 'INTEGER':
            case 'FLOAT':
                return (
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            value={value}
                            onChange={(e) => handleInputChange(setting.key, e.target.value)}
                            className="max-w-[150px]"
                        />
                        {isDirty && (
                            <Button size="icon" variant="ghost" onClick={() => handleSave(setting)} disabled={updateSetting.isPending}>
                                <Save className="h-4 w-4 text-primary" />
                            </Button>
                        )}
                    </div>
                );
            case 'STRING':
            default:
                if (setting.key.includes('color')) {
                    return (
                        <div className="flex gap-2 items-center">
                            <Input
                                type="color"
                                value={value}
                                onChange={(e) => handleInputChange(setting.key, e.target.value)}
                                className="w-12 h-12 p-1 cursor-pointer"
                            />
                            <Input
                                type="text"
                                value={value}
                                onChange={(e) => handleInputChange(setting.key, e.target.value)}
                                className="max-w-[150px]"
                            />
                            {isDirty && (
                                <Button size="icon" variant="ghost" onClick={() => handleSave(setting)} disabled={updateSetting.isPending}>
                                    <Save className="h-4 w-4 text-primary" />
                                </Button>
                            )}
                        </div>
                    );
                }
                return (
                    <div className="flex gap-2 w-full">
                        <Input
                            type="text"
                            value={value}
                            onChange={(e) => handleInputChange(setting.key, e.target.value)}
                        />
                        {isDirty && (
                            <Button size="icon" variant="ghost" onClick={() => handleSave(setting)} disabled={updateSetting.isPending}>
                                <Save className="h-4 w-4 text-primary" />
                            </Button>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-text-main flex items-center gap-2">
                        <Sliders className="h-6 w-6 text-primary" /> Configuration Système
                    </h2>
                    <p className="text-text-muted">Gérez les paramètres globaux de l'application.</p>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[500px]">
                    <TabsTrigger value="general">Général & Processus</TabsTrigger>
                    <TabsTrigger value="display">Affichage</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                {Object.entries(groupedSettings).map(([tabKey, settingsList]) => (
                    <TabsContent key={tabKey} value={tabKey} className="mt-4">
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader>
                                <CardTitle className="capitalize">{tabKey}</CardTitle>
                                <CardDescription>Paramètres liés à {tabKey === 'display' ? "l'affichage" : tabKey === 'notifications' ? 'aux notifications' : 'au fonctionnement général'}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {settingsList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 text-text-muted/50 border-2 border-dashed border-border/50 rounded-lg">
                                        <Sliders className="h-10 w-10 mb-2 opacity-50" />
                                        <p>Aucun paramètre dans cette catégorie.</p>
                                    </div>
                                ) : (
                                    settingsList.map(setting => (
                                        <div key={setting.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 rounded-lg bg-surface/50 border border-border/30 hover:border-border/80 transition-colors">
                                            <div className="md:col-span-1">
                                                <label className="text-base font-medium">{setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                                                {setting.description && <p className="text-xs text-text-muted mt-1">{setting.description}</p>}
                                            </div>
                                            <div className="md:col-span-2">
                                                {renderInput(setting)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};
