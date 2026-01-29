import React, { useState } from 'react';
import { COLS, TOTAL_BITS } from './constants';
import SplitFlap from './components/SplitFlap';
import InputModal from './components/InputModal';
import { soundService } from './services/soundService';

const App: React.FC = () => {
    const [message, setMessage] = useState<string>("".padEnd(TOTAL_BITS, " "));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Initial Welcome Message
    const WELCOME_MSG = "DIGITAL FLIPBOARD     READY TO FLIP         TYPE TO START...      ".padEnd(TOTAL_BITS, " ");

    const handleStart = async () => {
        // Initialize audio context on first user interaction
        await soundService.init();
        setHasStarted(true);
        // Slight delay to let the "click" sound logic prep
        setTimeout(() => {
            setMessage(WELCOME_MSG);
        }, 500);
    };

    const handleUpdate = (newMsg: string) => {
        // Force uppercase as flipboards are typically mono-case
        setMessage(newMsg.toUpperCase());
    };

    if (!hasStarted) {
        return (
            <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
                <div className="text-center space-y-8 animate-fade-in p-8">
                    <h1 className="text-white text-4xl md:text-6xl font-black tracking-tighter mb-4">DIGITAL FLIPBOARD</h1>
                    <p className="text-gray-500 font-mono text-sm tracking-[0.3em] uppercase mb-12">Virtual Mechanical Display</p>

                    <button
                        onClick={handleStart}
                        className="group relative inline-flex h-16 w-64 items-center justify-center overflow-hidden rounded-full bg-white font-medium text-black transition-all duration-300 hover:w-72 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-white/30 active:scale-95"
                    >
                        <span className="relative font-mono font-bold tracking-widest">INITIALIZE SYSTEM</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 md:p-12 relative overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#111]' : 'bg-[#e0e0e0]'}`}>
            {/* Background Aesthetics */}
            <div className={`absolute inset-0 pointer-events-none z-0 opacity-80 ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)]' : 'bg-[radial-gradient(circle_at_center,_transparent_0%,_#ccc_100%)]'}`}></div>

            {/* Main Board Container */}
            <div className={`relative z-10 p-3 md:p-6 rounded-lg shadow-2xl border transition-colors duration-500 ${theme === 'dark' ? 'bg-[#080808] border-[#222]' : 'bg-[#f0f0f0] border-[#ccc]'}`}>
                {/* Subtle frame screws */}
                <div className={`absolute top-2 left-2 w-2 h-2 rounded-full shadow-inner ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#d1d1d1]'}`}></div>
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full shadow-inner ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#d1d1d1]'}`}></div>
                <div className={`absolute bottom-2 left-2 w-2 h-2 rounded-full shadow-inner ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#d1d1d1]'}`}></div>
                <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full shadow-inner ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#d1d1d1]'}`}></div>

                {/* Helper overlay for screen size warning if too small could be added here */}

                <div
                    className={`grid gap-[1px] md:gap-[2px] border transition-colors duration-500 ${theme === 'dark' ? 'bg-black border-black/50' : 'bg-[#ccc] border-gray-400'}`}
                    style={{
                        gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                        // Force a consistent aspect ratio per cell roughly matching Vestaboard
                        width: 'min(95vw, 1200px)',
                    }}
                >
                    {Array.from({ length: TOTAL_BITS }).map((_, i) => (
                        <div key={i} className="aspect-[4/6] relative">
                            <SplitFlap
                                targetChar={message[i] || " "}
                                // Stagger the delay based on column to create the "screen wipe" effect
                                delay={(i % COLS) * 50 + (Math.floor(i / COLS) * 20)}
                                theme={theme}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="fixed bottom-8 z-20 flex gap-4">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={`px-8 py-3 rounded-full font-mono font-bold tracking-wider shadow-lg active:scale-95 transition-all ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                    COMPOSE MESSAGE
                </button>
            </div>

            <InputModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={handleUpdate}
                currentMessage={message}
                theme={theme}
                setTheme={setTheme}
            />

            <div className={`absolute top-4 right-4 font-mono text-xs tracking-widest pointer-events-none transition-colors duration-500 ${theme === 'dark' ? 'text-white/20' : 'text-black/20'}`}>
                V.1.0 // ONLINE
            </div>
        </div>
    );
};

export default App;
