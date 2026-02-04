import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/atoms/ui/button';
import { Input } from '../components/atoms/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/molecules/ui/card';
import { api } from '../services/api';
import { toast } from '../components/molecules/ui/toast';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError("Token invalide ou manquant");
            return;
        }
        if (password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères");
            return;
        }
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await api.post('/auth/reset-password', {
                token,
                password
            });
            setIsSuccess(true);
            toast("Mot de passe réinitialisé !", 'success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.error || "Erreur lors de la réinitialisation";
            setError(errorMsg);
            toast(errorMsg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md border-danger/50 shadow-xl">
                    <CardHeader><CardTitle className="text-danger">Lien invalide</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-text-muted mb-4">Le lien de réinitialisation est manquant ou invalide.</p>
                        <Link to="/login"><Button>Retour à la connexion</Button></Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-warning/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

            <Card className="w-full max-w-md border-white/20 shadow-2xl bg-white/60 backdrop-blur-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Lock className="h-6 w-6 text-primary" />
                        Nouveau mot de passe
                    </CardTitle>
                    <CardDescription>
                        Choisissez un nouveau mot de passe sécurisé.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 animate-in fade-in zoom-in">
                            <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center text-success">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-text-main">Mot de passe modifié !</h3>
                            <p className="text-text-muted text-sm">
                                Vous allez être redirigé vers la page de connexion...
                            </p>
                            <div className="mt-4">
                                <Link to="/login">
                                    <Button variant="outline">Connexion immédiate</Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Nouveau mot de passe</label>
                                <Input
                                    type="password"
                                    placeholder="******"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Confirmer le mot de passe</label>
                                <Input
                                    type="password"
                                    placeholder="******"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                            </div>
                            <Button type="submit" className="w-full" isLoading={isLoading}>
                                Réinitialiser le mot de passe
                            </Button>
                        </form>
                    )}
                </CardContent>
                {!isSuccess && (
                    <CardFooter className="flex justify-center border-t border-white/10 pt-4 pb-2">
                        <Link to="/login" className="text-sm text-text-muted hover:text-primary flex items-center justify-center gap-2 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Annuler
                        </Link>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
