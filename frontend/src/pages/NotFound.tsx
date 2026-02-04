import { useNavigate } from 'react-router-dom';
import { Button } from '../components/atoms/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="max-w-2xl w-full text-center animate-fade-in">
                {/* Animated Truck Illustration */}
                <div className="mb-8 relative">
                    <div className="animate-float">
                        {/* Road */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-2 bg-gray-300 rounded-full"></div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-1 flex justify-around items-center">
                            <div className="w-8 h-1 bg-white rounded-full animate-pulse"></div>
                            <div className="w-8 h-1 bg-white rounded-full animate-pulse delay-100"></div>
                            <div className="w-8 h-1 bg-white rounded-full animate-pulse delay-200"></div>
                        </div>

                        {/* Lost Truck SVG */}
                        <svg className="h-48 w-48 mx-auto mb-4" viewBox="0 0 200 200" fill="none">
                            {/* Truck Body */}
                            <rect x="40" y="80" width="80" height="50" rx="8" fill="#3B82F6" className="animate-wiggle" />
                            <rect x="120" y="90" width="40" height="40" rx="6" fill="#60A5FA" />

                            {/* Windows */}
                            <rect x="125" y="95" width="30" height="20" rx="3" fill="#DBEAFE" />
                            <rect x="50" y="85" width="25" height="20" rx="3" fill="#DBEAFE" />
                            <rect x="85" y="85" width="25" height="20" rx="3" fill="#DBEAFE" />

                            {/* Wheels */}
                            <circle cx="60" cy="130" r="12" fill="#1F2937" />
                            <circle cx="60" cy="130" r="6" fill="#6B7280" />
                            <circle cx="140" cy="130" r="12" fill="#1F2937" />
                            <circle cx="140" cy="130" r="6" fill="#6B7280" />

                            {/* Question Mark (Lost) */}
                            <text x="100" y="70" fontSize="40" fill="#EF4444" fontWeight="bold" textAnchor="middle">?</text>

                            {/* Exhaust smoke */}
                            <circle cx="35" cy="75" r="8" fill="#9CA3AF" opacity="0.5" className="animate-ping" />
                            <circle cx="30" cy="65" r="6" fill="#9CA3AF" opacity="0.3" className="animate-ping delay-100" />
                        </svg>

                        {/* Floating Search Icon */}
                        <div className="absolute top-0 right-1/4 bg-yellow-400 rounded-full p-3 shadow-lg animate-bounce">
                            <Search className="h-6 w-6 text-yellow-900" />
                        </div>
                    </div>
                </div>

                {/* Error Code */}
                <div className="mb-4">
                    <span className="inline-block px-6 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold tracking-wider">
                        ERREUR 404
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
                    Page Non Trouvée
                </h1>

                {/* Description */}
                <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                    Oups ! Le camion s'est perdu en route. Cette page n'existe pas ou a été déplacée.
                </p>

                {/* Helpful Links */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8 max-w-md mx-auto">
                    <p className="text-sm text-gray-500 mb-3">
                        <span className="font-semibold text-gray-700">Pages utiles :</span>
                    </p>
                    <div className="flex flex-col gap-2 text-sm">
                        <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-700 hover:underline text-left">
                            → Accueil - Enregistrement camion
                        </button>
                        <button onClick={() => navigate('/queue')} className="text-blue-600 hover:text-blue-700 hover:underline text-left">
                            → File d'attente
                        </button>
                        <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-700 hover:underline text-left">
                            → Connexion
                        </button>
                    </div>
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
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                
                @keyframes wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-2deg); }
                    75% { transform: rotate(2deg); }
                }
                
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                
                .animate-wiggle {
                    animation: wiggle 2s ease-in-out infinite;
                }
                
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
                
                .delay-100 {
                    animation-delay: 0.1s;
                }
                
                .delay-200 {
                    animation-delay: 0.2s;
                }
            `}</style>
        </div>
    );
}
