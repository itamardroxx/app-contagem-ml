import { useCallback, useRef } from 'react';

export function useSound() {
    const audioContextRef = useRef<AudioContext | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    const playTone = useCallback((frequency: number, type: OscillatorType, duration: number, startTime = 0) => {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);

        // Envelope simples para evitar cliques
        gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
    }, [getAudioContext]);

    const playSuccessSound = useCallback(() => {
        // Beep curto e agudo (ex: 1200Hz por 100ms)
        playTone(1200, 'sine', 0.1);
    }, [playTone]);

    const playErrorSound = useCallback(() => {
        // Beep grave/duplo
        playTone(150, 'sawtooth', 0.15); // Grave
        playTone(100, 'sawtooth', 0.15, 0.2); // Segundo tom levemente atrasado
    }, [playTone]);

    return { playSuccessSound, playErrorSound };
}
