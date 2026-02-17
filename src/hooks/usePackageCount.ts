import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, type PackageCount } from '../lib/supabase';
import { useSound } from './useSound';

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

    // Ref para garantir acesso ao valor mais atual dentro do callback do realtime
    const sessionStartRef = useRef(sessionStart);

    useEffect(() => {
        sessionStartRef.current = sessionStart;
    }, [sessionStart]);

    const loadTodayCounts = useCallback(async (overrideSessionStart?: string) => {
        // Busca contagem total DO LOTE ATUAL (visual)
        const currentStart = overrideSessionStart || sessionStart;

        const { count: total, error: countError } = await supabase
            .from('package_counts')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', currentStart);

        if (countError) console.error('Erro ao buscar contagem:', countError);
        else setCount(total || 0);

        // Busca chaves para a lista (apenas do lote atual)
        const { data, error: listError } = await supabase
            .from('package_counts')
            .select('*')
            .gte('created_at', currentStart)
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
                    // CRÍTICO: Usa a REF para pegar o horário mais atual, senão usa o horário antigo do closure
                    loadTodayCounts(sessionStartRef.current);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadTodayCounts]);

    const addPackage = async (key: string) => {
        // Validação: Se menor que 44 ou vazio
        if (!key) return;

        if (key.length !== 44) {
            setFeedback('invalid');
            playErrorSound();
            setTimeout(() => setFeedback(null), 2000);
            return;
        }

        setIsLoading(true);

        // OPTIMISTIC UPDATE
        const tempId = Math.random().toString(36).substr(2, 9);
        const tempPackage: PackageCount = {
            id: tempId,
            nfe_key: key,
            created_at: new Date().toISOString(),
            date_only: new Date().toISOString().split('T')[0]
        };

        setFeedback('success');
        playSuccessSound();
        setCount(prev => prev + 1);
        setLastPackages(prev => [tempPackage, ...prev]);

        try {
            const { data, error } = await supabase
                .from('package_counts')
                .insert([{ nfe_key: key }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique violation
                    setFeedback('duplicate');
                    playErrorSound();
                    setLastPackages(prev => prev.filter(p => p.id !== tempId));
                    setCount(prev => prev - 1);
                } else {
                    console.error('Erro ao salvar:', error);
                    setFeedback('error');
                    playErrorSound();
                    setLastPackages(prev => prev.filter(p => p.id !== tempId));
                    setCount(prev => prev - 1);
                }
            } else {
                if (data) {
                    setLastPackages(prev => prev.map(p => p.id === tempId ? data : p));
                }
                loadTodayCounts();
            }
        } catch (err: any) {
            console.error('Erro inesperado:', err);
            setFeedback('error');
            playErrorSound();
            setLastPackages(prev => prev.filter(p => p.id !== tempId));
            setCount(prev => prev - 1);
        } finally {
            setIsLoading(false);
            setTimeout(() => setFeedback(null), 2000);
        }
    };

    const removePackage = async (id: string) => {
        console.log("Tentando remover pacote com ID:", id);
        const { error, count: deletedCount } = await supabase
            .from('package_counts')
            .delete({ count: 'exact' })
            .eq('id', id);

        if (error) {
            console.error('Erro ao excluir:', error);
            playErrorSound();
        } else {
            console.log("Pacote removido com sucesso, linhas deletadas:", deletedCount);
            setLastPackages(prev => prev.filter(p => p.id !== id));
            setCount(prev => Math.max(0, prev - 1));
            playSuccessSound();
        }
    };

    const finishDay = async () => {
        const now = new Date().toISOString();
        localStorage.setItem('session_start', now);

        // Atualiza estado local E a ref imediatamente para evitar race condition
        setSessionStart(now);
        sessionStartRef.current = now;

        setCount(0);
        setLastPackages([]);
        playSuccessSound();

        loadTodayCounts(now);
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
