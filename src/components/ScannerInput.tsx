import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';

interface ScannerInputProps {
    onScan: (key: string) => void;
    isLoading: boolean;
    feedback: 'success' | 'error' | 'duplicate' | 'invalid' | null;
}

export function ScannerInput({ onScan, isLoading, feedback }: ScannerInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState('');

    const focusInput = () => {
        setTimeout(() => inputRef.current?.focus(), 10);
    };

    // Mantém foco sempre
    useEffect(() => {
        const handleBlur = () => {
            if (!isLoading) focusInput();
        };

        const currentInput = inputRef.current;
        if (currentInput) {
            currentInput.addEventListener('blur', handleBlur);
            focusInput();
        }

        const handleWindowClick = (e: MouseEvent | globalThis.MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'BUTTON' ||
                target.closest('button') ||
                target.tagName === 'A' ||
                target.closest('a') ||
                target.tagName === 'INPUT'
            ) {
                return;
            }

            if (!isLoading) focusInput();
        }
        window.addEventListener('click', handleWindowClick);

        return () => {
            if (currentInput) {
                currentInput.removeEventListener('blur', handleBlur);
            }
            window.removeEventListener('click', handleWindowClick);
        };
    }, [isLoading]);

    useEffect(() => {
        if (!isLoading) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isLoading, feedback]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.replace(/[^0-9]/g, '');
        setValue(newValue);

        if (newValue.length === 44) {
            onScan(newValue);
            setValue('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (value.trim()) {
                onScan(value);
                setValue('');
            }
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto my-8 relative">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className={clsx(
                    "w-full text-center text-2xl font-mono tracking-widest p-4 rounded-lg border-4 transition-colors outline-none",
                    "placeholder:text-gray-300 text-[#102A43] bg-white shadow-sm",
                    {
                        "border-gray-200 focus:border-[#3E84DF] focus:shadow-lg focus:shadow-[#3E84DF]/20": !feedback,
                        "border-[#D6FC51] bg-[#F7FECC] text-[#102A43]": feedback === 'success',
                        "border-red-500 bg-red-50 text-red-600": feedback === 'error' || feedback === 'duplicate' || feedback === 'invalid',
                    }
                )}
                placeholder="Leia ou digite a chave da NF-e"
                autoFocus
            />

            {feedback === 'duplicate' && (
                <div className="absolute top-full left-0 w-full text-center mt-2 text-red-600 font-bold text-xl animate-pulse">
                    CHAVE JÁ REGISTRADA
                </div>
            )}

            {feedback === 'invalid' && (
                <div className="absolute top-full left-0 w-full text-center mt-2 text-red-600 font-bold text-xl animate-pulse">
                    CÓDIGO INVÁLIDO (44 Dígitos Necessários)
                </div>
            )}

            {isLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    ...
                </div>
            )}
        </div>
    );
}
