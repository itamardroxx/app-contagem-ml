import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PackageCount } from '../lib/supabase';

export const generatePDF = (logs: PackageCount[], selectedDate: string) => {
    try {
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

        // Salvar Arquivo
        const fileName = `relatorio_contagem_${selectedDate}.pdf`;
        doc.save(fileName);
        return true;
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        return false;
    }
};
