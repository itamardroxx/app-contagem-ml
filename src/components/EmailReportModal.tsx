import { X, Mail, FileText, Download, Send } from 'lucide-react';
import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PackageCount } from '../lib/supabase';

interface EmailReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: PackageCount[];
    selectedDate: string;
}

export function EmailReportModal({ isOpen, onClose, logs, selectedDate }: EmailReportModalProps) {
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState(`Relatório de Contagem - ${format(new Date(selectedDate), 'dd/MM/yyyy')}`);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const generatePDF = () => {
        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.text(`Relatório de Contagem - ${format(new Date(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 14, 22);

        // Metadata
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Total de Volumes: ${logs.length}`, 14, 30);
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36);

        // Tabela
        const tableColumn = ["Hora", "Chave da Nota Fiscal"];
        const tableRows = logs.map(log => [
            format(new Date(log.created_at), 'HH:mm:ss'),
            log.nfe_key
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 44,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 10, cellPadding: 3 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        return doc;
    };

    const handleSendEmail = () => {
        setIsGenerating(true);
        setTimeout(() => {
            try {
                // 1. Gera e baixa o PDF
                const doc = generatePDF();
                const fileName = `relatorio_contagem_${selectedDate}.pdf`;
                doc.save(fileName);

                // 2. Abre cliente de email (mailto não suporta anexo automático por segurança do navegador)
                const body = `Segue em anexo o relatório de contagem do dia ${format(new Date(selectedDate), 'dd/MM/yyyy')}.\n\nAtenciosamente,`;
                const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

                window.location.href = mailtoLink;

                // 3. Feedback visual
                alert(`O PDF "${fileName}" foi baixado.\nPor favor, anexe-o manualmente ao email que foi aberto.`);
                onClose();
            } catch (error) {
                console.error("Erro ao gerar relatório:", error);
                alert("Erro ao gerar o relatório PDF.");
            } finally {
                setIsGenerating(false);
            }
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                    <Mail className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-center text-slate-800 mb-2">
                    Enviar Relatório por Email
                </h3>

                <p className="text-center text-slate-500 mb-6 text-sm">
                    Informe o destinatário e o assunto. O PDF será gerado e baixado automaticamente para você anexar.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email do Destinatário</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="exemplo@empresa.com"
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assunto</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSendEmail}
                        disabled={!email || isGenerating}
                        className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <Download className="w-4 h-4 animate-bounce" />
                                Gerando...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Baixar e Enviar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
