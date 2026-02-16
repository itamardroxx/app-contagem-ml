import { Trash2, Box } from 'lucide-react';
import { type PackageCount } from '../lib/supabase';
import { format } from 'date-fns';

interface PackageListProps {
    packages: PackageCount[];
    onRemove: (id: string) => void;
}

export function PackageList({ packages, onRemove }: PackageListProps) {
    return (
        <div className="w-full max-w-2xl mx-auto mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <Box className="w-5 h-5" />
                        Histórico de Registros
                    </h3>
                    <span className="text-sm text-slate-400">
                        {packages.length > 0 ? 'Exibindo últimos 100' : 'Nenhum registro encontrado'}
                    </span>
                </div>

                <ul className="divide-y divide-slate-100">
                    {packages.map((pkg) => (
                        <li key={pkg.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors group">
                            <div className="flex flex-col">
                                <span className="font-mono text-slate-600 text-sm break-all font-medium">
                                    {pkg.nfe_key}
                                </span>
                                <span className="text-xs text-slate-400 mt-0.5">
                                    {format(new Date(pkg.created_at), 'HH:mm:ss')}
                                </span>
                            </div>

                            <button
                                onClick={() => onRemove(pkg.id)}
                                className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all"
                                title="Excluir registro"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
