import { useState, useEffect } from 'react';
import { supabase, type PackageCount } from '../lib/supabase';
import { ArrowLeft, Calendar, FileText, Loader2, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConfirmModal } from './ConfirmModal';
import { generatePDF } from '../utils/generatePdf';

interface HistoryViewProps {
    onBack: () => void;
}

export function HistoryView({ onBack }: HistoryViewProps) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [logs, setLogs] = useState<PackageCount[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // Modal state
    const [modalType, setModalType] = useState<'deleteAll' | 'deleteOne' | null>(null);
    const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            // Buscando registros da data selecionada
            const { data, error, count } = await supabase
                .from('package_counts')
                .select('*', { count: 'exact' })
                .eq('date_only', selectedDate)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao buscar histórico:', error);
            } else {
                setLogs(data || []);
                setTotalCount(count || 0);
            }
        } catch (err) {
            console.error('Erro inesperado:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [selectedDate]);

    const handleDeleteOne = async () => {
        if (!selectedIdToDelete) return;

        try {
            const { error } = await supabase
                .from('package_counts')
                .delete()
                .eq('id', selectedIdToDelete);

            if (error) throw error;

            // Update local state
            setLogs(prev => prev.filter(p => p.id !== selectedIdToDelete));
            setTotalCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Erro ao excluir registro:', err);
            alert('Erro ao excluir registro.');
        } finally {
            setModalType(null);
            setSelectedIdToDelete(null);
        }
    };

    const handleDeleteAll = async () => {
        try {
            const { error } = await supabase
                .from('package_counts')
                .delete()
                .eq('date_only', selectedDate);

            if (error) throw error;

            // Update local state
            setLogs([]);
            setTotalCount(0);
        } catch (err) {
            console.error('Erro ao excluir lista:', err);
            alert('Erro ao excluir lista.');
        } finally {
            setModalType(null);
        }
    };

    const handleDownloadReport = () => {
        generatePDF(logs, selectedDate);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F0F5FA]">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-[#3E84DF] transition-colors font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Voltar
                    </button>
                    <h1 className="text-lg font-bold text-[#102A43] flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#3E84DF]" />
                        Histórico por Data
                    </h1>
                    <div className="w-20"></div> {/* Espaçador para centralizar título */}
                </div>
            </header>

            <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
                {/* Date Selection */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between mb-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#3E84DF]" />
                                Selecione a Data
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full text-lg p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5490DF] focus:border-[#5490DF] outline-none transition-all text-[#102A43]"
                            />
                        </div>

                        {logs.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDownloadReport}
                                    className="px-4 py-3 bg-[#E1E8EF] text-[#0050B3] hover:bg-[#D9E2EC] rounded-xl font-medium transition-colors flex items-center gap-2 border border-[#C3D8FF]"
                                >
                                    <Download className="w-4 h-4" />
                                    Baixar Relatório
                                </button>
                                <button
                                    onClick={() => setModalType('deleteAll')}
                                    className="px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors flex items-center gap-2 border border-red-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Excluir Lista do Dia ({totalCount})
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex items-center justify-between bg-[#F0F5FA] p-4 rounded-xl border border-[#E1E8EF]">
                        <span className="text-[#102A43] font-medium">Total de Registros</span>
                        <span className="text-3xl font-bold text-[#3E84DF]">{totalCount}</span>
                    </div>
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-[#3E84DF] animate-spin" />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-[#F0F5FA]">
                            <span className="text-sm font-medium text-slate-500">
                                Registros de {format(new Date(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </span>
                        </div>

                        {logs.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                Nenhum registro encontrado nesta data.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {logs.map((pkg) => (
                                    <li key={pkg.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-[#F0F5FA] transition-colors group">
                                        <span className="font-mono text-slate-600 text-sm break-all font-medium">
                                            {pkg.nfe_key}
                                        </span>
                                        <div className="flex items-center gap-3 mt-2 sm:mt-0">
                                            <span className="text-xs text-slate-400 font-medium bg-gray-50 px-2 py-1 rounded-full">
                                                {format(new Date(pkg.created_at), 'HH:mm:ss')}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setSelectedIdToDelete(pkg.id);
                                                    setModalType('deleteOne');
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                                                title="Excluir este registro"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </main>

            <ConfirmModal
                isOpen={!!modalType}
                onCancel={() => {
                    setModalType(null);
                    setSelectedIdToDelete(null);
                }}
                onConfirm={modalType === 'deleteAll' ? handleDeleteAll : handleDeleteOne}
                title={modalType === 'deleteAll' ? "Excluir Lista Completa" : "Excluir Registro"}
                description={
                    modalType === 'deleteAll'
                        ? `Tem certeza que deseja excluir TODOS os ${totalCount} registros do dia ${format(new Date(selectedDate), "dd/MM/yyyy")}? Esta ação não pode ser desfeita.`
                        : "Tem certeza que deseja excluir este registro específico? Esta ação não pode ser desfeita."
                }
            />
        </div>
    );
}
