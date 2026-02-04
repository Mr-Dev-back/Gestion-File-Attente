import { useNavigate } from 'react-router-dom';
import { Button } from '../components/atoms/ui/button';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
            <div className="max-w-2xl w-full text-center animate-fade-in">
                {/* Animated Illustration */}
                <div className="mb-8 animate-shake">
                    <div className="relative inline-block">
                        {/* Shield Background Glow */}
                        <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse"></div>

                        {/* Main Shield Icon */}
                        <div className="relative bg-white rounded-3xl p-8 shadow-2xl border-4 border-red-100">
                            <ShieldX className="h-32 w-32 text-red-500 mx-auto" strokeWidth={1.5} />
                        </div>

                        {/* Floating Lock Icon */}
                        <div className="absolute -top-4 -right-4 bg-red-500 rounded-full p-3 shadow-lg animate-bounce">
                            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Error Code */}
                <div className="mb-4">
                    <span className="inline-block px-6 py-2 bg-red-100 text-red-600 rounded-full text-sm font-semibold tracking-wider">
                        ERREUR 403
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
                    Accès Refusé
                </h1>

                {/* Description */}
                <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                    Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                </p>

                {/* Additional Info */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8 max-w-md mx-auto">
                    <p className="text-sm text-gray-500 mb-2">
                        <span className="font-semibold text-gray-700">Besoin d'accès ?</span>
                    </p>
                    <p className="text-sm text-gray-600">
                        Contactez votre administrateur système pour obtenir les autorisations appropriées.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto group"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        Retour
                    </Button>
                    <Button
                        onClick={() => navigate('/')}
                        size="lg"
                        className="w-full sm:w-auto group bg-primary hover:bg-primary/90"
                    >
                        <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                        Aller à l'accueil
                    </Button>
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-shake {
                    animation: shake 0.6s ease-in-out;
                }
                
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}
