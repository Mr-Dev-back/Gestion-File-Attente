import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/atoms/ui/button';
import { Input } from '../components/atoms/ui/input';
import { AlertCircle, Truck, ShieldCheck, ArrowRight, Lock, User } from 'lucide-react';
import { Alert, AlertDescription } from '../components/atoms/ui/alert';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [lockInfo, setLockInfo] = useState<{ until: Date } | null>(null);
    const [errorField, setErrorField] = useState<'email' | 'password' | null>(null);
    const { login } = useAuth();

    const handleLogin = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError(null);
        setErrorField(null);

        login.mutate(
            { email, password },
            {
                onError: (err: any) => {
                    const data = err.response?.data;
                    setError(data?.error || 'Échec de la connexion. Vérifiez vos identifiants.');
                    setErrorField(data?.field || null);

                    if (data?.code === 'ACCOUNT_LOCKED' && data?.lockUntil) {
                        setLockInfo({ until: new Date(data.lockUntil) });
                    } else {
                        setLockInfo(null);
                    }
                }
            }
        );
    };

    return (
        <div className="min-h-screen flex w-full">
            {/* Left Side - Hero / Branding */}
            <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/90 to-primary/70"></div>

                <div className="relative z-10 text-white max-w-lg animate-slide-up">
                    <div className="h-20 w-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/30 shadow-2xl">
                        <Truck className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-black tracking-tight mb-6">SIGFA</h1>
                    <p className="text-xl text-primary-foreground/90 font-medium leading-relaxed mb-8">
                        Système Intégré de Gestion de File d'Attente.
                        Optimisez vos flux logistiques, sécurisez vos accès et améliorez l'efficacité de votre site.
                    </p>
                    <div className="flex gap-4 opacity-80">
                        <div className="flex items-center gap-2 text-sm font-medium bg-white/10 px-4 py-2 rounded-full border border-white/10">
                            <ShieldCheck className="h-4 w-4" /> Sécurisé
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium bg-white/10 px-4 py-2 rounded-full border border-white/10">
                            <Truck className="h-4 w-4" /> Temps Réel
                        </div>
                    </div>
                </div>

                {/* Decorative circles */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse-slow"></div>
                <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-8 relative">
                <div className="w-full max-w-[400px] animate-fade-in">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold tracking-tight text-text-main">Bon Retour</h2>
                        <p className="text-text-muted mt-2">Connectez-vous pour accéder à votre espace.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <Alert variant="destructive" className="animate-scale-in border-destructive/50 bg-destructive/10">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="space-y-1">
                                    <p className="font-bold">{error}</p>
                                    {lockInfo && (
                                        <p className="text-xs opacity-80 italic">
                                            Déblocage prévu à : {lockInfo.until.toLocaleTimeString()}
                                        </p>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none" htmlFor="email">Identifiant</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-text-muted transition-colors peer-focus:text-primary" />
                                    <Input
                                        id="email"
                                        type="text"
                                        placeholder="nom@entreprise.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={login.isPending}
                                        required
                                        className={`pl-10 h-11 bg-surface transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary ${errorField === 'email' ? 'border-destructive ring-destructive/20' : ''}`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium leading-none" htmlFor="password">Mot de passe</label>
                                    <a href="#" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Mot de passe oublié ?</a>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-text-muted transition-colors peer-focus:text-primary" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={login.isPending}
                                        required
                                        className={`pl-10 h-11 bg-surface transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary ${errorField === 'password' ? 'border-destructive ring-destructive/20' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
                            type="submit"
                            isLoading={login.isPending}
                            disabled={login.isPending}
                        >
                            Se Connecter <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-sm text-text-muted">
                        Un problème d'accès ? <a href="#" className="font-medium text-primary hover:text-primary/80 transition-colors">Contactez le support</a>
                    </p>
                </div>

                {/* Mobile decorative background (subtle) */}
                <div className="lg:hidden absolute inset-0 -z-10 bg-surface/50">
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                </div>
            </div>
        </div>
    );
}
