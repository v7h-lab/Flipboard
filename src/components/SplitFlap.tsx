import React, { useState, useEffect, useRef } from 'react';
import { CHARACTER_SET, COLOR_MAP } from '../constants';
import { soundService } from '../services/soundService';

interface SplitFlapProps {
    targetChar: string;
    delay?: number;
    theme?: 'dark' | 'light';
}

const SplitFlap: React.FC<SplitFlapProps> = ({ targetChar, delay = 0, theme = 'dark' }) => {
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const normalizedTarget = CHARACTER_SET.includes(targetChar) ? targetChar : " ";
    const targetIndex = CHARACTER_SET.indexOf(normalizedTarget);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        const step = () => {
            setCurrentCharIndex((prev) => {
                if (prev === targetIndex) {
                    setIsAnimating(false);
                    return prev;
                }

                soundService.playClick(0.5 + Math.random() * 0.5);

                const next = (prev + 1) % CHARACTER_SET.length;
                setIsAnimating(true);
                timerRef.current = setTimeout(step, 50 + Math.random() * 20);
                return next;
            });
        };

        const initialTimer = setTimeout(() => {
            if (currentCharIndex !== targetIndex) {
                step();
            }
        }, delay);

        return () => {
            clearTimeout(initialTimer);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [targetIndex, delay]);

    const char = CHARACTER_SET[currentCharIndex];
    const nextChar = CHARACTER_SET[(currentCharIndex + 1) % CHARACTER_SET.length];

    // Colors
    const isColorBlock = COLOR_MAP[char] !== undefined;

    // Theme-based colors
    const defaultBg = theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#f0f0f0]';
    const getBg = (c: string) => COLOR_MAP[c] ? COLOR_MAP[c] : defaultBg;

    // Styles for the card halves
    // Top: Darkens towards bottom to simulate curve away from light
    const topGradient = isColorBlock ? '' : (theme === 'dark'
        ? 'bg-gradient-to-b from-[#2a2a2a] via-[#1e1e1e] to-[#121212]'
        : 'bg-gradient-to-b from-[#ffffff] via-[#f0f0f0] to-[#d9d9d9]');

    // Bottom: Lightens towards top to simulate curve catching light
    const bottomGradient = isColorBlock ? '' : (theme === 'dark'
        ? 'bg-gradient-to-b from-[#121212] via-[#1e1e1e] to-[#2a2a2a]'
        : 'bg-gradient-to-b from-[#d9d9d9] via-[#f0f0f0] to-[#ffffff]');

    const textColor = theme === 'dark' ? 'text-white' : 'text-black';
    const charStyle = `font-mono font-bold ${textColor} text-2xl sm:text-3xl lg:text-4xl leading-none select-none drop-shadow-md ${isColorBlock ? 'opacity-0' : ''}`;
    const cardBg = theme === 'dark' ? 'bg-[#111]' : 'bg-[#e0e0e0]'; // Behind the flap

    return (
        <div className={`w-full h-full ${cardBg} flex items-center justify-center overflow-hidden rounded-[2px] relative perspective-1000 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]`}>

            {/* Top Half (Current) */}
            <div className={`absolute top-0 w-full h-1/2 flex items-end justify-center overflow-hidden z-0 border-b ${theme === 'dark' ? 'border-black/50' : 'border-gray-400/50'} ${getBg(char)} ${topGradient}`}>
                <div className="absolute inset-0 bg-noise opacity-20"></div>
                <span className={`${charStyle} translate-y-1/2`}>{char}</span>
                <div className={`absolute inset-0 pointer-events-none ${theme === 'dark' ? 'bg-gradient-to-b from-white/5 to-black/40' : 'bg-gradient-to-b from-white/40 to-black/10'}`}></div>
            </div>

            {/* Bottom Half (Current) */}
            <div className={`absolute bottom-0 w-full h-1/2 flex items-start justify-center overflow-hidden z-0 ${getBg(char)} ${bottomGradient}`}>
                <div className="absolute inset-0 bg-noise opacity-20"></div>
                <span className={`${charStyle} -translate-y-1/2`}>{char}</span>
                <div className={`absolute inset-0 pointer-events-none ${theme === 'dark' ? 'bg-gradient-to-t from-black/60 to-transparent' : 'bg-gradient-to-t from-black/20 to-transparent'}`}></div>
            </div>

            {/* Animated Flap (Next) */}
            {isAnimating && (
                <div className={`absolute top-0 w-full h-1/2 flex items-end justify-center overflow-hidden z-20 origin-bottom animate-flip-down backface-hidden ${getBg(nextChar)} ${topGradient} border-b ${theme === 'dark' ? 'border-black/80' : 'border-gray-500/50'} shadow-md`}>
                    <div className="absolute inset-0 bg-noise opacity-20"></div>
                    <span className={`${charStyle} translate-y-1/2`}>{nextChar}</span>
                    {/* Dynamic lighting on flip */}
                    <div className={`absolute inset-0 pointer-events-none ${theme === 'dark' ? 'bg-gradient-to-b from-white/10 to-black/50' : 'bg-gradient-to-b from-white/30 to-black/10'}`}></div>
                </div>
            )}

            {/* Hinge Detail */}
            <div className={`absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 z-30 ${theme === 'dark' ? 'bg-black shadow-[0_1px_2px_rgba(255,255,255,0.1)]' : 'bg-gray-400 shadow-[0_1px_2px_rgba(255,255,255,0.5)]'}`}></div>

            {/* Side notches for mechanism */}
            <div className={`absolute top-1/2 -left-[1px] w-1 h-3 -translate-y-1/2 rounded-r z-30 ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#bbb]'}`}></div>
            <div className={`absolute top-1/2 -right-[1px] w-1 h-3 -translate-y-1/2 rounded-l z-30 ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#bbb]'}`}></div>
        </div>
    );
};

export default SplitFlap;
