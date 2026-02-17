// Ref para garantir acesso ao valor mais atual dentro do callback do realtime sem recriar listener
const sessionStartRef = useState(sessionStart)[0] && { current: sessionStart };
// Hack simplificado: na verdade precisamos de um useRef real que atualize

// CORREÇÃO REAL:
const sessionStartRef = React.useRef(sessionStart);

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
                // Porém, loadTodayCounts (função) também está presa no closure antigo se não recriarmos o listener
                // A melhor forma aqui é chamar a lógica de load passando o valor da ref

                // Como loadTodayCounts depende de sessionStart, ela muda sempre que sessionStart muda.
                // Isso faria o subscribe recriar.
                // O problema é o DELAY.

                // Solução: Força o load a usar o valor atual da REF se não for passado nada, 
                // mas loadTodayCounts usa state direto. 
                // Vamos simplificar: Ao receber evento, chamamos loadTodayCounts passando sessionStartRef.current

                loadTodayCounts(sessionStartRef.current);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}, [loadTodayCounts]); // loadTodayCounts recria quando sessionStart muda, recriando o listener. Isso é correto.

// ... (keep addPackage and removePackage same)

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

    // Atualiza estado local E a ref imediatamente para evitar race condition
    setSessionStart(now);
    sessionStartRef.current = now; // <--- CRITICAL FIX

    // Zera explicitamente e instantaneamente
    setCount(0);
    setLastPackages([]);
    playSuccessSound();

    // Força recarregamento imediato usando o NOVO horário
    // Mas como acabamos de zerar, talvez nem precise carregar nada se confiarmos no reset
    // Mantemos o load apenas para garantir consistência com o servidor
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
// trigger build
