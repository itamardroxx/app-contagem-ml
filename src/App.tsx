import { useState } from 'react';
import { CounterDisplay } from './components/CounterDisplay';
import { ScannerInput } from './components/ScannerInput';
import { PackageList } from './components/PackageList';
import { ConfirmModal } from './components/ConfirmModal';
import { usePackageCount } from './hooks/usePackageCount';
import { HistoryView } from './components/HistoryView';
import { RotateCcw, Calendar } from 'lucide-react';

function App() {
  const {
    count,
    lastPackages,
    feedback,
    isLoading,
    addPackage,
    removePackage,
    finishDay
  } = usePackageCount();

  const [view, setView] = useState<'counter' | 'history'>('counter');
  const [modalType, setModalType] = useState<'delete' | 'finish' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleRemoveClick = (id: string) => {
    setSelectedId(id);
    setModalType('delete');
  };

  const handleConfirmAction = () => {
    if (modalType === 'delete' && selectedId) {
      removePackage(selectedId);
    } else if (modalType === 'finish') {
      finishDay();
    }
    setModalType(null);
    setSelectedId(null);
  };

  return (
    <div className="min-h-screen bg-[#F0F5FA] text-[#102A43] font-sans selection:bg-[#D6FC51] selection:text-[#102A43]">
      {view === 'history' ? (
        <HistoryView onBack={() => setView('counter')} />
      ) : (
        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col min-h-screen">

          {/* Header / Actions */}
          <div className="flex justify-end mb-4 relative z-50">
            <button
              onClick={() => {
                console.log("Navegando para histórico...");
                setView('history');
              }}
              className="text-sm bg-white text-[#3E84DF] px-4 py-2 rounded-lg border border-gray-200 hover:bg-[#F0F5FA] hover:text-[#0050B3] transition-colors flex items-center gap-2 shadow-sm font-semibold"
            >
              <Calendar className="w-4 h-4 text-[#3E84DF]" />
              Ver Histórico
            </button>
          </div>

          {/* Counter Section */}
          <main className="flex-1 flex flex-col items-center justify-center -mt-20">
            <CounterDisplay count={count} />

            <ScannerInput
              onScan={addPackage}
              isLoading={isLoading}
              feedback={feedback}
            />
          </main>


          {/* List Section */}
          <section className="mb-20">
            <PackageList
              packages={lastPackages}
              onRemove={handleRemoveClick}
            />
          </section>

          {/* Footer Actions */}
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg-up">
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => setModalType('finish')}
                className="w-full py-4 bg-[#001D4A] text-[#D6FC51] rounded-xl font-bold text-lg hover:bg-[#061D32] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <RotateCcw className="w-6 h-6" />
                FINALIZAR CONTAGEM DO DIA
              </button>
            </div>
          </div>

        </div>
      )}

      <ConfirmModal
        isOpen={!!modalType}
        onCancel={() => setModalType(null)}
        onConfirm={handleConfirmAction}
        title={modalType === 'delete' ? "Excluir Registro" : "Finalizar Contagem"}
        description={
          modalType === 'delete'
            ? "Tem certeza que deseja excluir este registro? A contagem será atualizada."
            : "Tem certeza que deseja finalizar a contagem de hoje? O contador será zerado e a lista limpa da tela."
        }
      />
    </div>
  );
}

export default App;
