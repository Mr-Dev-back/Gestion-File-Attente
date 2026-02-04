import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../atoms/ui/button';
import { cn } from '../../../lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className={cn(
                "relative bg-surface rounded-xl shadow-2xl border border-border w-full mx-4 animate-in zoom-in-95 fade-in duration-200",
                sizeMap[size]
            )}>
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        <h3 className="text-lg font-semibold text-text-main">{title}</h3>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    variant = 'primary'
}: ConfirmModalProps) {
    const variantStyles = {
        danger: 'bg-danger hover:bg-danger/90 text-white',
        warning: 'bg-warning hover:bg-warning/90 text-black',
        primary: 'bg-primary hover:bg-primary/90 text-white',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <p className="text-text-muted mb-6">{message}</p>
            <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                    {cancelText}
                </Button>
                <Button
                    className={cn("flex-1", variantStyles[variant])}
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                >
                    {confirmText}
                </Button>
            </div>
        </Modal>
    );
}
