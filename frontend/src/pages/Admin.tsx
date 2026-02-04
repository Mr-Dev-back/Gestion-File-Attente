import { useState, type Dispatch, type SetStateAction } from 'react';
import { cn } from '../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../components/molecules/ui/card';
import { Button } from '../components/atoms/ui/button';
import { Input } from '../components/atoms/ui/input';
import { Badge } from '../components/atoms/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/molecules/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/molecules/ui/tabs';
import { Modal, ConfirmModal } from '../components/molecules/ui/modal';
import { toast } from '../components/molecules/ui/toast';
import {
    Users,
    Settings,
    Plus,
    Shield,
    UserPlus,
    Trash2,
    Edit2,
    Tag,
    ToggleLeft,
    ToggleRight,
    Loader2,
    Building2,
    Search,
    Lock,
    History,
    Network,
    Monitor,
    Smartphone,
    LogOut
} from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { useCategories } from '../hooks/useCategories';
import { useCompanies } from '../hooks/useCompanies';
import { useSites } from '../hooks/useSites';
import { useWorkflows } from '../hooks/useWorkflows';
import { useAuthStore } from '../stores/useAuthStore';

import { WorkflowManager } from '../components/admin/WorkflowManager';
import { QueueManager } from '../components/admin/QueueManager';
import { KioskManager } from '../components/admin/KioskManager';
import { CategoryManager } from '../components/admin/CategoryManager';
import { SettingsManager } from '../components/admin/SettingsManager';

const ROLES = [
    { value: 'ADMINISTRATOR', label: 'Administrateur' },
    { value: 'SUPERVISOR', label: 'Superviseur' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'AGENT_QUAI', label: 'Agent de Quai' },
];

// --- Settings Subcomponents Removed ---

// --- Main Component ---

export default function Admin() {
    const isAdmin = useAuthStore(state => state.isAdmin());
    const isSupervisor = useAuthStore(state => state.isSupervisor());
    const isManager = useAuthStore(state => state.isManager());

    // Hooks
    const { users, isLoading: isLoadingUsers, createUser, updateUser, deleteUser, toggleActive, unlockUser, getLoginHistory, getUserSessions, revokeSession } = useUsers();
    const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
    const { companies, createCompany, updateCompany, deleteCompany } = useCompanies();
    const { sites, createSite, updateSite, deleteSite } = useSites();
    const { workflows } = useWorkflows();

    // Modals State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);

    const [editingUser, setEditingUser] = useState<any>(null);
    const [editingCompany, setEditingCompany] = useState<any>(null);
    const [editingSite, setEditingSite] = useState<any>(null);

    // History Modal
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyUser, setHistoryUser] = useState<any>(null);
    const [loginHistory, setLoginHistory] = useState<any[]>([]);

    // Sessions Modal
    const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
    const [sessionsUser, setSessionsUser] = useState<any>(null);
    const [activeSessions, setActiveSessions] = useState<any[]>([]);

    // Confirmation Modal State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'warning' | 'primary';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const closeConfirm = () => setConfirmState(prev => ({ ...prev, isOpen: false }));

    const handleOpenHistory = async (user: any) => {
        setHistoryUser(user);
        setIsHistoryModalOpen(true);
        setLoginHistory([]); // Reset
        try {
            const history = await getLoginHistory(user.id);
            setLoginHistory(history);
        } catch (error) {
            console.error("Failed to load history", error);
        }
    };

    const handleUnlockUser = (user: any) => {
        setConfirmState({
            isOpen: true,
            title: 'Débloquer l\'utilisateur',
            message: `Voulez-vous débloquer l'utilisateur ${user.username} ?`,
            onConfirm: () => {
                unlockUser.mutate(user.id, {
                    onSuccess: () => toast('Utilisateur débloqué avec succès', 'success'),
                    onError: () => toast('Erreur lors du déblocage', 'error')
                });
            },
            variant: 'primary'
        });
    };

    const handleOpenSessions = async (user: any) => {
        setSessionsUser(user);
        setIsSessionsModalOpen(true);
        setActiveSessions([]);
        try {
            const sessions = await getUserSessions(user.id);
            setActiveSessions(sessions);
        } catch (error) {
            console.error("Failed to load sessions", error);
        }
    };

    const handleRevokeSession = (sessionId: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Révoquer la session',
            message: 'Voulez-vous vraiment déconnecter cet appareil à distance ?',
            variant: 'danger',
            onConfirm: () => {
                revokeSession.mutate(sessionId, {
                    onSuccess: () => {
                        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
                    }
                });
            }
        });
    };

    // Form States
    const [userForm, setUserForm] = useState({ username: '', email: '', password: '', role: 'MANAGER', siteId: '' });
    const [companyForm, setCompanyForm] = useState({ name: '', code: '', description: '', isActive: true });
    const [siteForm, setSiteForm] = useState({ name: '', code: '', companyId: '', workflowId: '', isActive: true, isMonoUserProcess: false });

    // --- Search & Selection State ---
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
    const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);

    const [userSearch, setUserSearch] = useState('');
    const [companySearch, setCompanySearch] = useState('');
    const [siteSearch, setSiteSearch] = useState('');

    // --- Filtering Logic ---
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(companySearch.toLowerCase())
    );

    const filteredSites = sites.filter(site =>
        site.name.toLowerCase().includes(siteSearch.toLowerCase()) ||
        site.company?.name?.toLowerCase().includes(siteSearch.toLowerCase())
    );

    // --- Bulk Actions Logic ---
    const handleSelectAll = (ids: string[], setter: Dispatch<SetStateAction<string[]>>, checked: boolean) => {
        setter(checked ? ids : []);
    };

    const handleSelectOne = (id: string, setter: Dispatch<SetStateAction<string[]>>, checked: boolean) => {
        setter((prev: string[]) => checked ? [...prev, id] : prev.filter(x => x !== id));
    };

    const handleBulkDelete = async (
        ids: string[],
        setter: Dispatch<SetStateAction<string[]>>,
        mutation: any,
        confirmMsg: string
    ) => {
        setConfirmState({
            isOpen: true,
            title: 'Suppression groupée',
            message: confirmMsg,
            variant: 'danger',
            onConfirm: async () => {
                const promises = ids.map(id => mutation.mutateAsync(id));
                try {
                    await Promise.all(promises);
                    setter([]);
                    toast(`${ids.length} éléments supprimés`, 'success');
                } catch (error) {
                    console.error("Erreur lors de la suppression de masse", error);
                    toast('Erreur lors de la suppression de masse', 'error');
                }
            }
        });
    };

    // Users Bulk
    const handleSelectAllUsers = (checked: boolean) => handleSelectAll(filteredUsers.map(u => u.id), setSelectedUserIds, checked);
    const handleSelectUser = (id: string, checked: boolean) => handleSelectOne(id, setSelectedUserIds, checked);
    const handleBulkDeleteUsers = () => handleBulkDelete(selectedUserIds, setSelectedUserIds, deleteUser, `Supprimer ${selectedUserIds.length} utilisateurs ?`);

    const handleBulkToggleUsers = async (isActive: boolean) => {
        const action = isActive ? 'activer' : 'désactiver';
        setConfirmState({
            isOpen: true,
            title: `${isActive ? 'Activation' : 'Désactivation'} groupée`,
            message: `Voulez-vous vraiment ${action} ${selectedUserIds.length} utilisateurs ?`,
            onConfirm: async () => {
                const promises = selectedUserIds.map(id => toggleActive.mutateAsync({ id, isActive }));
                try {
                    await Promise.all(promises);
                    setSelectedUserIds([]);
                    toast(`${selectedUserIds.length} utilisateurs ${isActive ? 'activés' : 'désactivés'}`, 'success');
                } catch (error) {
                    console.error(`Erreur lors de l'action de masse`, error);
                    toast(`Erreur lors de la ${action}`, 'error');
                }
            }
        });
    };

    // --- CRUD Actions ---
    const handleOpenUserModal = (user: any = null) => {
        if (user) {
            setEditingUser(user);
            setUserForm({ username: user.username, email: user.email, password: '', role: user.role, siteId: user.siteId || '' });
        } else {
            setEditingUser(null);
            setUserForm({ username: '', email: '', password: '', role: 'MANAGER', siteId: '' });
        }
        setIsUserModalOpen(true);
    };

    const handleSaveUser = () => {
        const payload: any = { ...userForm };
        if (payload.siteId === '') payload.siteId = null;
        if (payload.password === '') delete payload.password;

        if (editingUser) {
            updateUser.mutate({ id: editingUser.id, data: payload } as any, {
                onSuccess: () => {
                    setIsUserModalOpen(false);
                    toast('Utilisateur mis à jour', 'success');
                },
                onError: () => toast('Erreur lors de la mise à jour', 'error')
            });
        } else {
            createUser.mutate(payload as any, {
                onSuccess: () => {
                    setIsUserModalOpen(false);
                    toast('Utilisateur créé avec succès', 'success');
                },
                onError: () => toast('Erreur lors de la création', 'error')
            });
        }
    };

    const handleOpenCompanyModal = (company: any = null) => {
        setEditingCompany(company);
        if (company) {
            setCompanyForm({ name: company.name, code: company.code || '', description: company.description || '', isActive: company.isActive ?? true });
        } else {
            setCompanyForm({ name: '', code: '', description: '', isActive: true });
        }
        setIsCompanyModalOpen(true);
    };

    const handleSaveCompany = async () => {
        if (!companyForm.name || !companyForm.code) {
            toast("Le nom et le code sont obligatoires", "error");
            return;
        }
        try {
            if (editingCompany) {
                await updateCompany.mutateAsync({ id: editingCompany.id, data: companyForm });
                toast('Société mise à jour', 'success');
            } else {
                await createCompany.mutateAsync(companyForm);
                toast('Société créée avec succès', 'success');
            }
            setIsCompanyModalOpen(false);
            setCompanyForm({ name: '', code: '', description: '', isActive: true });
            setEditingCompany(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenSiteModal = (site: any = null) => {
        setEditingSite(site);
        if (site) {
            setSiteForm({
                name: site.name,
                code: site.code || '',
                companyId: site.companyId,
                workflowId: site.workflowId || '',
                isActive: site.isActive ?? true,
                isMonoUserProcess: site.isMonoUserProcess ?? false
            });
        } else {
            setSiteForm({ name: '', code: '', companyId: '', workflowId: '', isActive: true, isMonoUserProcess: false });
        }
        setIsSiteModalOpen(true);
    };
    const canSeeUsers = isAdmin;
    const canSeeCompanies = isAdmin;
    const canSeeCategories = isAdmin || isSupervisor;
    const canSeeWorkflows = isAdmin || isSupervisor || isManager;
    const canSeeKiosks = isAdmin || isSupervisor || isManager;
    const canSeeSettings = isAdmin;

    // Determine initial tab
    const defaultTab = canSeeUsers ? "users" : (canSeeCompanies ? "companies" : "workflows");

    const handleSaveSite = () => {
        const mutation = editingSite ? updateSite : createSite;
        const payload = editingSite ? { id: editingSite.id, data: siteForm } : siteForm;
        mutation.mutate(payload as any, {
            onSuccess: () => {
                setIsSiteModalOpen(false);
                toast(editingSite ? 'Site mis à jour' : 'Site créé avec succès', 'success');
            },
            onError: () => toast('Erreur lors de l\'opération', 'error')
        });
    };

    const handleDelete = (id: string, mutation: any, message: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Confirmation de suppression',
            message: message,
            variant: 'danger',
            onConfirm: () => {
                mutation.mutate(id, {
                    onSuccess: () => toast('Suppression réussie', 'success'),
                    onError: () => toast('Erreur lors de la suppression', 'error')
                });
            }
        });
    };


    return (
        <div className="space-y-8 relative pb-20">
            {/* Elements decoratifs */}
            <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/20 mb-8 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm animate-fade-in hover:shadow-md transition-all duration-500">
                <div>
                    <h2 className="text-5xl font-black tracking-tighter text-text-main flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl text-white shadow-lg shadow-primary/30 transform -rotate-2"><Settings className="h-10 w-10" /></div>
                        Administration
                    </h2>
                    <p className="text-text-muted font-bold tracking-wide mt-2 ml-20 text-lg uppercase opacity-70">Gestion centralisée des accès & configurations</p>
                </div>
            </div>

            <Tabs defaultValue={defaultTab} className="space-y-8">
                <TabsList className="bg-white/40 backdrop-blur-md p-2 rounded-2xl border border-white/40 shadow-sm flex flex-wrap gap-2 h-auto w-fit mx-auto">
                    {canSeeUsers && (
                        <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-6 py-3 text-sm font-bold flex items-center gap-2"><Users className="h-4 w-4" />Utilisateurs</TabsTrigger>
                    )}
                    {canSeeCompanies && (
                        <TabsTrigger value="companies" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-6 py-3 text-sm font-bold flex items-center gap-2"><Building2 className="h-4 w-4" />Sociétés & Sites</TabsTrigger>
                    )}
                    {canSeeCategories && (
                        <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-6 py-3 text-sm font-bold flex items-center gap-2"><Tag className="h-4 w-4" />Catégories</TabsTrigger>
                    )}
                    {canSeeWorkflows && (
                        <TabsTrigger value="workflows" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-6 py-3 text-sm font-bold flex items-center gap-2"><Network className="h-4 w-4" />Flux & Files</TabsTrigger>
                    )}
                    {canSeeKiosks && (
                        <TabsTrigger value="kiosks" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-6 py-3 text-sm font-bold flex items-center gap-2"><Monitor className="h-4 w-4" />Bornes</TabsTrigger>
                    )}
                    {canSeeSettings && (
                        <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-6 py-3 text-sm font-bold flex items-center gap-2"><Settings className="h-4 w-4" />Paramètres</TabsTrigger>
                    )}
                </TabsList>

                {/* --- USERS TAB --- */}
                {isAdmin && (
                    <TabsContent value="users" className="space-y-4 animate-slide-up">
                        <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border-white/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 p-8 border-b border-white/10 bg-white/30">
                                <div className="flex flex-col gap-1">
                                    <CardTitle className="text-2xl font-black flex items-center gap-3"><span className="w-2 h-8 bg-primary rounded-full"></span>Gestion des Comptes</CardTitle>
                                    <p className="text-sm text-text-muted font-medium ml-5">Gérez les accès et les rôles des utilisateurs</p>
                                </div>
                                {isAdmin && (
                                    <div className="flex items-center gap-4">
                                        {selectedUserIds.length > 0 && (
                                            <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
                                                <span className="text-xs font-bold text-primary mr-2">{selectedUserIds.length} sélectionné(s)</span>
                                                <Button size="sm" variant="ghost" onClick={() => handleBulkToggleUsers(true)} className="h-8 text-xs text-success"><ToggleRight className="h-3.5 w-3.5 mr-1" /> Activer</Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleBulkToggleUsers(false)} className="h-8 text-xs text-text-muted"><ToggleLeft className="h-3.5 w-3.5 mr-1" /> Désactiver</Button>
                                                <Button size="sm" variant="ghost" onClick={handleBulkDeleteUsers} className="h-8 text-xs text-danger"><Trash2 className="h-3.5 w-3.5 mr-1" /> Supprimer</Button>
                                            </div>
                                        )}
                                        <Button onClick={() => handleOpenUserModal()} className="gap-2 rounded-xl shadow-lg shadow-primary/20"><UserPlus className="h-4 w-4" />Nouvel Utilisateur</Button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-6 border-b border-white/10 bg-white/20">
                                    <div className="relative max-w-md group">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                        <Input placeholder="Rechercher un utilisateur (nom, email)..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-10 h-10 bg-white/50 border-white/40 focus:bg-white rounded-xl shadow-sm" />
                                    </div>
                                </div>
                                {isLoadingUsers ? <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary/50" /></div> : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-white/10 hover:bg-transparent bg-white/10">
                                                <TableHead className="w-[50px] pl-6"><input type="checkbox" checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0} onChange={(e) => handleSelectAllUsers(e.target.checked)} className="rounded border-primary/30" /></TableHead>
                                                <TableHead>UTILISATEUR</TableHead>
                                                <TableHead>SITE / SOCIÉTÉ</TableHead>
                                                <TableHead>RÔLE</TableHead>
                                                <TableHead>STATUT</TableHead>
                                                <TableHead className="text-right pr-8">ACTIONS</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-text-muted">Aucun utilisateur trouvé</TableCell></TableRow> : filteredUsers.map(user => (
                                                <TableRow key={user.id} className={cn("transition-all duration-200 border-white/5", selectedUserIds.includes(user.id) ? "bg-primary/5" : "hover:bg-white/40")}>
                                                    <TableCell className="pl-6"><input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={(e) => handleSelectUser(user.id, e.target.checked)} className="rounded border-primary/30" /></TableCell>
                                                    <TableCell><div className="flex flex-col"><span className="font-bold text-text-main text-base">{user.username}</span><span className="text-xs text-text-muted font-medium">{user.email}</span></div></TableCell>
                                                    <TableCell><div className="flex flex-col"><span className="text-sm font-bold text-primary">{user.site?.name || 'Aucun site'}</span><span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">{user.site?.company?.name}</span></div></TableCell>
                                                    <TableCell><Badge variant="outline" className="bg-white/50 border-white/40"><Shield className="h-3 w-3 mr-1.5 opacity-70" />{user.role}</Badge></TableCell>
                                                    <TableCell><Badge variant={user.isActive ? "success" : "secondary"}>{user.isActive ? "Actif" : "Inactif"}</Badge></TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex justify-end gap-1">
                                                            {isAdmin && (
                                                                <>
                                                                    <Button variant="ghost" size="sm" onClick={() => toggleActive.mutate({ id: user.id, isActive: !user.isActive })} className="h-8 w-8">{user.isActive ? <ToggleRight className="h-5 w-5 text-success" /> : <ToggleLeft className="h-5 w-5 text-text-muted" />}</Button>
                                                                    {user.lockUntil && new Date(user.lockUntil) > new Date() && <Button variant="ghost" size="sm" onClick={() => handleUnlockUser(user)} className="h-8 w-8 text-warning" title="Débloquer"><Lock className="h-4 w-4" /></Button>}
                                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenHistory(user)} className="h-8 w-8 text-primary" title="Historique"><History className="h-4 w-4" /></Button>
                                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenSessions(user)} className="h-8 w-8 text-info" title="Sessions Actives"><Smartphone className="h-4 w-4" /></Button>
                                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenUserModal(user)} className="h-8 w-8" title="Modifier"><Edit2 className="h-4 w-4" /></Button>
                                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id, deleteUser, 'Supprimer ?')} className="h-8 w-8 text-danger" title="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* --- COMPANIES & SITES TAB --- */}
                {canSeeCompanies && (
                    <TabsContent value="companies" className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Societies */}
                            <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-xl rounded-[2rem] overflow-hidden border-white/20">
                                <CardHeader className="flex flex-row items-center justify-between p-6 bg-white/20 border-b border-white/10">
                                    <div className="flex flex-col gap-1">
                                        <CardTitle className="text-xl font-black flex items-center gap-3">
                                            <Building2 className="h-5 w-5 text-primary" />
                                            Sociétés
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {selectedCompanyIds.length > 0 && (
                                            <div className="flex items-center gap-2 bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                                                <span className="text-[10px] font-bold text-primary mr-1">{selectedCompanyIds.length}</span>
                                                <Button size="sm" variant="ghost" onClick={() => handleBulkDelete(selectedCompanyIds, setSelectedCompanyIds, deleteCompany, 'Supprimer ?')} className="h-6 px-2 text-[10px] text-danger"><Trash2 className="h-3 w-3 mr-1" /> Supprimer</Button>
                                            </div>
                                        )}
                                        <Button size="sm" onClick={() => handleOpenCompanyModal()} className="rounded-xl h-8">
                                            <Plus className="h-4 w-4 mr-1" /> Nouveau
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="p-4 border-b border-white/10 bg-white/10">
                                        <div className="relative group">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                            <Input placeholder="Rechercher une société..." value={companySearch} onChange={(e) => setCompanySearch(e.target.value)} className="pl-9 h-9 bg-white/50 border-white/30 rounded-lg text-sm" />
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-white/10 border-white/10 hover:bg-transparent">
                                                    <TableHead className="w-[40px] pl-6"><input type="checkbox" checked={selectedCompanyIds.length === filteredCompanies.length && filteredCompanies.length > 0} onChange={(e) => handleSelectAll(filteredCompanies.map(c => c.id), setSelectedCompanyIds, e.target.checked)} className="rounded border-primary/30" /></TableHead>
                                                    <TableHead>NOM</TableHead>
                                                    <TableHead>CODE</TableHead>
                                                    <TableHead className="text-right pr-6">ACTIONS</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredCompanies.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-text-muted">Aucune société</TableCell></TableRow> : filteredCompanies.map(company => (
                                                    <TableRow key={company.id} className={cn("border-white/5 hover:bg-white/40", selectedCompanyIds.includes(company.id) && "bg-primary/5")}>
                                                        <TableCell className="pl-6"><input type="checkbox" checked={selectedCompanyIds.includes(company.id)} onChange={(e) => handleSelectOne(company.id, setSelectedCompanyIds, e.target.checked)} className="rounded border-primary/30" /></TableCell>
                                                        <TableCell className="font-bold text-text-main">{company.name}</TableCell>
                                                        <TableCell><Badge variant="outline" className="text-[10px] font-bold">{company.code}</Badge></TableCell>
                                                        <TableCell className="text-right pr-4">
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="sm" onClick={() => handleOpenCompanyModal(company)} className="h-8 w-8"><Edit2 className="h-4 w-4" /></Button>
                                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(company.id, deleteCompany, 'Supprimer cette société ?')} className="h-8 w-8 text-danger"><Trash2 className="h-4 w-4" /></Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sites */}
                            <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-xl rounded-[2rem] overflow-hidden border-white/20">
                                <CardHeader className="flex flex-row items-center justify-between p-6 bg-white/20 border-b border-white/10">
                                    <div className="flex flex-col gap-1">
                                        <CardTitle className="text-xl font-black flex items-center gap-3">
                                            <Building2 className="h-5 w-5 text-primary" />
                                            Sites
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {selectedSiteIds.length > 0 && (
                                            <div className="flex items-center gap-2 bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                                                <span className="text-[10px] font-bold text-primary mr-1">{selectedSiteIds.length}</span>
                                                <Button size="sm" variant="ghost" onClick={() => handleBulkDelete(selectedSiteIds, setSelectedSiteIds, deleteSite, 'Supprimer ?')} className="h-6 px-2 text-[10px] text-danger"><Trash2 className="h-3 w-3 mr-1" /> Supprimer</Button>
                                            </div>
                                        )}
                                        <Button size="sm" onClick={() => handleOpenSiteModal()} className="rounded-xl h-8">
                                            <Plus className="h-4 w-4 mr-1" /> Nouveau
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="p-4 border-b border-white/10 bg-white/10">
                                        <div className="relative group">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                            <Input placeholder="Rechercher un site..." value={siteSearch} onChange={(e) => setSiteSearch(e.target.value)} className="pl-9 h-9 bg-white/50 border-white/30 rounded-lg text-sm" />
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-white/10 border-white/10 hover:bg-transparent">
                                                    <TableHead className="w-[40px] pl-6"><input type="checkbox" checked={selectedSiteIds.length === filteredSites.length && filteredSites.length > 0} onChange={(e) => handleSelectAll(filteredSites.map(s => s.id), setSelectedSiteIds, e.target.checked)} className="rounded border-primary/30" /></TableHead>
                                                    <TableHead>NOM</TableHead>
                                                    <TableHead>SOCIÉTÉ</TableHead>
                                                    <TableHead className="text-right pr-6">ACTIONS</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredSites.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-text-muted">Aucun site</TableCell></TableRow> : filteredSites.map(site => (
                                                    <TableRow key={site.id} className={cn("border-white/5 hover:bg-white/40", selectedSiteIds.includes(site.id) && "bg-primary/5")}>
                                                        <TableCell className="pl-6"><input type="checkbox" checked={selectedSiteIds.includes(site.id)} onChange={(e) => handleSelectOne(site.id, setSelectedSiteIds, e.target.checked)} className="rounded border-primary/30" /></TableCell>
                                                        <TableCell className="font-bold text-text-main">{site.name}</TableCell>
                                                        <TableCell><span className="text-xs text-text-muted font-bold tracking-wider uppercase">{site.company?.name}</span></TableCell>
                                                        <TableCell className="text-right pr-4">
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="sm" onClick={() => handleOpenSiteModal(site)} className="h-8 w-8"><Edit2 className="h-4 w-4" /></Button>
                                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(site.id, deleteSite, 'Supprimer ce site ?')} className="h-8 w-8 text-danger"><Trash2 className="h-4 w-4" /></Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>

                            </Card>
                        </div>
                    </TabsContent>
                )}

                {/* --- CATEGORIES TAB --- */}
                {canSeeCategories && (
                    <TabsContent value="categories" className="space-y-4">
                        <Card className="border-border/50">
                            <CardContent className="p-6">
                                <CategoryManager />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* --- SETTINGS TAB --- */}
                {canSeeSettings && (
                    <TabsContent value="settings" className="space-y-4">
                        <Card className="border-border/50">
                            <CardContent className="p-6">
                                <SettingsManager />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* --- QUEUES & WORKFLOWS TAB (US-008) --- */}
                {canSeeWorkflows && (
                    <TabsContent value="workflows" className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6 items-start">
                            {/* Queues Management */}
                            <Card className="border-border/50 shadow-sm h-full">
                                <CardContent className="p-6">
                                    <QueueManager />
                                </CardContent>
                            </Card>

                            {/* Workflows Management */}
                            <Card className="border-border/50 shadow-sm h-full">
                                <CardContent className="p-6">
                                    <WorkflowManager />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                )}

                {/* --- KIOSKS TAB (US-009) --- */}
                {canSeeKiosks && (
                    <TabsContent value="kiosks">
                        <Card className="border-border/50 shadow-sm">
                            <CardContent className="p-6">
                                <KioskManager />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

            </Tabs>

            {/* --- Modals --- */}
            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Utilisateur">
                <div className="space-y-4 py-4">
                    <Input placeholder="Nom d'utilisateur" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
                    <Input placeholder="Email" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                    <Input placeholder="Mot de passe" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                    <select className="w-full p-2 border rounded-md" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    {['MANAGER', 'SUPERVISOR', 'AGENT_QUAI'].includes(userForm.role) && (
                        <select className="w-full p-2 border rounded-md" value={userForm.siteId} onChange={(e) => setUserForm({ ...userForm, siteId: e.target.value })}>
                            <option value="">-- Sélectionner un Site --</option>
                            {companies.map(c => (
                                <optgroup key={c.id} label={c.name}>
                                    {sites.filter(s => s.companyId === c.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleSaveUser}>{editingUser ? 'Modifier' : 'Créer'}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} title="Société">
                <div className="space-y-4 py-4">
                    <Input placeholder="Nom de la société" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
                    <Input placeholder="Code Unique (ex: SIBM)" value={companyForm.code} onChange={(e) => setCompanyForm({ ...companyForm, code: e.target.value })} />
                    <Input placeholder="Description" value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} />
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={companyForm.isActive} onChange={(e) => setCompanyForm({ ...companyForm, isActive: e.target.checked })} />
                        <label>Actif</label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsCompanyModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleSaveCompany} disabled={createCompany.isPending || updateCompany.isPending}>
                            {(createCompany.isPending || updateCompany.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingCompany ? 'Modifier' : 'Créer'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isSiteModalOpen} onClose={() => setIsSiteModalOpen(false)} title="Site">
                <div className="space-y-4 py-4">
                    <select className="w-full p-2 border rounded-md" value={siteForm.companyId} onChange={(e) => setSiteForm({ ...siteForm, companyId: e.target.value })}>
                        <option value="">-- Sélectionner une Société --</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <select className="w-full p-2 border rounded-md" value={siteForm.workflowId} onChange={(e) => setSiteForm({ ...siteForm, workflowId: e.target.value })}>
                        <option value="">-- Sélectionner un Workflow --</option>
                        {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                    </select>

                    <Input placeholder="Nom du site" value={siteForm.name} onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })} />
                    <Input placeholder="Code Unique (ex: SITE-01)" value={siteForm.code} onChange={(e) => setSiteForm({ ...siteForm, code: e.target.value })} />
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={siteForm.isActive} onChange={(e) => setSiteForm({ ...siteForm, isActive: e.target.checked })} />
                        <label>Actif</label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsSiteModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleSaveSite} disabled={createSite.isPending || updateSite.isPending}>
                            {(createSite.isPending || updateSite.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingSite ? 'Modifier' : 'Créer'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isSessionsModalOpen} onClose={() => setIsSessionsModalOpen(false)} title={`Sessions Actives: ${sessionsUser?.username}`}>
                <div className="space-y-4">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Appareils et navigateurs connectés</p>
                    <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                        {activeSessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-4 bg-white/40 border border-white/60 rounded-2xl group hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                        <Smartphone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-text-main line-clamp-1">{session.userAgent || 'Appareil inconnu'}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[10px] py-0">{session.ipAddress}</Badge>
                                            <span className="text-[10px] text-text-muted font-medium italic">Dernier accès: {new Date(session.updatedAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRevokeSession(session.id)}
                                    className="h-9 w-9 text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Révoquer la session"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {activeSessions.length === 0 && (
                            <div className="py-10 text-center text-text-muted font-bold italic bg-white/20 rounded-2xl border border-dashed border-white/40">
                                Aucune session active trouvée.
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
            />

        </div >
    );
}
