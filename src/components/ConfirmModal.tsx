import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void; // Corrigido para receber a função onCancel corretamente
    title: string;
    description: string;
}

export function ConfirmModal({ isOpen, onConfirm, onCancel, title, description }: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-center text-slate-800 mb-2">
                    {title}
                </h3>

                <p className="text-center text-slate-500 mb-8">
                    {description}
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onCancel}
                        className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="w-full py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
