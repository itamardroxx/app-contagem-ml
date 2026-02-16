interface CounterDisplayProps {
    count: number;
}

export function CounterDisplay({ count }: CounterDisplayProps) {
    return (
        <div className="text-center py-10">
            <div className="text-9xl font-black text-[#102A43] tracking-tight leading-none tabular-nums">
                {count}
            </div>
            <div className="text-[#3E84DF] font-bold text-xl mt-4 uppercase tracking-wider">
                Pacotes Contados Hoje
            </div>
        </div>
    );
}
