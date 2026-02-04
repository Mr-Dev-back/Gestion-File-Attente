import { create } from 'zustand';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

type ToastType = 'success' | 'warning' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (message: string, type: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (message, type, duration = 3000) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
            toasts: [...state.toasts, { id, message, type, duration }]
        }));
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id)
                }));
            }, duration);
        }
    },
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        }));
    }
}));

export function toast(message: string, type: ToastType = 'info', duration?: number) {
    useToastStore.getState().addToast(message, type, duration);
}

const icons = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
    info: Info,
};

const styles = {
    success: 'bg-success/10 border-success/20 text-success',
    warning: 'bg-warning/10 border-warning/20 text-warning',
    error: 'bg-danger/10 border-danger/20 text-danger',
    info: 'bg-primary/10 border-primary/20 text-primary',
};

export function Toaster() {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map((t) => {
                const Icon = icons[t.type];
                return (
                    <div
                        key={t.id}
                        className={cn(
                            "flex items-center gap-3 p-4 rounded-lg border shadow-lg bg-surface animate-in slide-in-from-right-5 fade-in duration-200",
                            styles[t.type]
                        )}
                    >
                        <Icon className="h-5 w-5 shrink-0" />
                        <p className="flex-1 text-sm font-medium text-text-main">{t.message}</p>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="text-text-muted hover:text-text-main transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
