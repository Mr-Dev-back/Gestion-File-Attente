import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Button } from '../components/atoms/ui/button';
import { Input } from '../components/atoms/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/molecules/ui/card';
import { api } from '../services/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError("L'email est requis");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            setIsSuccess(true);
        } catch (err) {
            console.error(err);
            // Pour la sécurité, on affiche le succès même en cas d'erreur (sauf si on veut debugger)
            // Mais ici on peut juste dire qu'on a traité la demande
            setIsSuccess(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

            <Card className="w-full max-w-md border-white/20 shadow-2xl bg-white/60 backdrop-blur-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Mail className="h-6 w-6 text-primary" />
                        Mot de passe oublié
                    </CardTitle>
                    <CardDescription>
                        Entrez votre email pour recevoir un lien de réinitialisation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 animate-in fade-in zoom-in">
                            <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center text-success">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-text-main">Email envoyé !</h3>
                            <p className="text-text-muted text-sm max-w-xs">
                                Si un compte existe avec cet email, vous recevrez les instructions de réinitialisation sous peu.
                            </p>
                            <div className="mt-4">
                                <Link to="/login">
                                    <Button variant="outline">Retour à la connexion</Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                                <Input
                                    type="email"
                                    placeholder="exemple@entreprise.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                            </div>
                            <Button type="submit" className="w-full" isLoading={isLoading}>
                                Envoi du lien
                            </Button>
                        </form>
                    )}
                </CardContent>
                {!isSuccess && (
                    <CardFooter className="flex justify-center border-t border-white/10 pt-4">
                        <Link to="/login" className="text-sm text-text-muted hover:text-primary flex items-center gap-2 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Retour à la connexion
                        </Link>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
