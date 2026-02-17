import { useState, useEffect, useCallback } from 'react';
import { supabase, type PackageCount } from '../lib/supabase';
import { useSound } from './useSound';
// import { startOfDay, endOfDay, format } from 'date-fns'; // Removed due to import issues

export function usePackageCount() {
    const [count, setCount] = useState(0);
    const [lastPackages, setLastPackages] = useState<PackageCount[]>([]);
    const [feedback, setFeedback] = useState<'success' | 'error' | 'duplicate' | 'invalid' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { playSuccessSound, playErrorSound } = useSound();

    // Estado para controlar o "início da sessão" visual
    const [sessionStart, setSessionStart] = useState<string>(() => {
        // Default: inicio do dia atual
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return localStorage.getItem('session_start') || startOfDay.toISOString();
    });

    const loadTodayCounts = useCallback(async () => {
        // Busca contagem total DO LOTE ATUAL (visual)
        // Se quisermos contagem total do dia independente do reset, mantemos a query original para um "totalDayCount" separado
        // Mas o usuário quer "zerar". Então vamos filtrar pela sessionStart.

        const { count: total, error: countError } = await supabase
            .from('package_counts')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', sessionStart);

        if (countError) console.error('Erro ao buscar contagem:', countError);
        else setCount(total || 0);

        // Busca chaves para a lista (apenas do lote atual)
        const { data, error: listError } = await supabase
            .from('package_counts')
            .select('*')
            .gte('created_at', sessionStart)
            .order('created_at', { ascending: false })
            .limit(100);

        if (listError) console.error('Erro ao buscar lista:', listError);
        else setLastPackages(data || []);
    }, [sessionStart]);

    useEffect(() => {
        loadTodayCounts();

        // Inscrever em mudanças em tempo real (opcional, mas bom pra consistência)
        const channel = supabase
            .channel('package_counts_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'package_counts',
                },
                () => {
                    loadTodayCounts();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadTodayCounts]);

    const addPackage = async (key: string) => {
        // Validação: Se menor que 44 ou vazio (mas vamos ignorar vazio se for evento de blur/enter extra)
        if (!key) return;

        if (key.length !== 44) {
            setFeedback('invalid');
            playErrorSound();
            // Limpa feedback após 2s
            setTimeout(() => setFeedback(null), 2000);
            return;
        }

        setIsLoading(true);

        // OPTIMISTIC UPDATE: Atualiza interface antes de confirmar no banco
        const tempId = Math.random().toString(36).substr(2, 9);
        // ... (rest of logic)
        const tempPackage: PackageCount = {
            id: tempId,
            nfe_key: key,
            created_at: new Date().toISOString(),
            date_only: new Date().toISOString().split('T')[0]
        };

        // Atualiza estados locais imediatamente
        setFeedback('success');
        playSuccessSound();
        setCount(prev => prev + 1);
        setLastPackages(prev => [tempPackage, ...prev]);

        try {
            // Tenta inserir no banco
            const { data, error } = await supabase
                .from('package_counts')
                .insert([{ nfe_key: key }])
                .select()
                .single();

            if (error) {
                // REVERT: Se deu erro, desfaz alterações locais
                if (error.code === '23505') { // Unique violation
                    setFeedback('duplicate');
                    playErrorSound();
                    // Remove item duplicado da lista e decrementa
                    setLastPackages(prev => prev.filter(p => p.id !== tempId));
                    setCount(prev => prev - 1);
                } else {
                    console.error('Erro ao salvar:', error);
                    // alert(`Erro ao salvar no banco: ${error.message} (Código: ${error.code})`); // REMOVIDO
                    setFeedback('error');
                    playErrorSound();
                    setLastPackages(prev => prev.filter(p => p.id !== tempId));
                    setCount(prev => prev - 1);
                }
            } else {
                // SUCCESS: Substitui item temporário pelo real do banco
                if (data) {
                    setLastPackages(prev => prev.map(p => p.id === tempId ? data : p));
                }
                // Garante consistência atualizando contagem total
                loadTodayCounts();
            }
        } catch (err: any) {
            console.error('Erro inesperado:', err);
            alert(`Erro inesperado de rede/cliente: ${err.message || JSON.stringify(err)}`); // DEBUG EXPLICITO
            setFeedback('error');
            playErrorSound();
            // Revert em caso de erro crítico
            setLastPackages(prev => prev.filter(p => p.id !== tempId));
            setCount(prev => prev - 1);
        } finally {
            setIsLoading(false);
            setTimeout(() => setFeedback(null), 2000);
        }
    };

    const removePackage = async (id: string) => {
        console.log("Tentando remover pacote com ID:", id);
        const { error, count: deletedCount } = await supabase // Capture count for debug
            .from('package_counts')
            .delete({ count: 'exact' }) // Request count of deleted rows
            .eq('id', id); // Use .eq explicitamente

        if (error) {
            console.error('Erro ao excluir:', error);
            playErrorSound();
        } else {
            console.log("Pacote removido com sucesso, linhas deletadas:", deletedCount);
            // Se deletou, remove logicamente da lista local para feedback imediato
            setLastPackages(prev => prev.filter(p => p.id !== id));
            setCount(prev => Math.max(0, prev - 1)); // Decrementa contador localmente
            // Recalcula contagem se necessário (ou deixa o realtime/reload lidar)
            // loadTodayCounts(); // Opcional, mas reativa a carga completa
            playSuccessSound();
        }
    };

    const finishDay = async () => {
        // "Finalizar dia" agora reseta a visualização definindo um novo marco de início
        const now = new Date().toISOString();
        localStorage.setItem('session_start', now);
        setSessionStart(now);

        // Zera explicitamente
        setCount(0);
        setLastPackages([]);
        playSuccessSound();

        // Força recarregamento para garantir que nada "antigo" apareça por delay de estado
        setTimeout(() => {
            loadTodayCounts();
        }, 100);
    };

    return {
        count,
        lastPackages,
        feedback,
        isLoading,
        addPackage,
        removePackage,
        finishDay,
        loadTodayCounts
    };
}
