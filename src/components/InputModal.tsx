import React, { useState } from 'react';
import { TOTAL_BITS } from '../constants';
import { soundService } from '../services/soundService';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (message: string) => void;
    currentMessage: string;
    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;
}

const InputModal: React.FC<InputModalProps> = ({ isOpen, onClose, onUpdate, currentMessage, theme, setTheme }) => {
    // Trim trailing spaces so the user has room to type without deleting spaces first
    const [text, setText] = useState(currentMessage.trimEnd());
    const [soundProfile, setSoundProfile] = useState<'loud' | 'subtle'>(soundService.getProfile());

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(text.padEnd(TOTAL_BITS, ' '));
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Limit to max bits
        const val = e.target.value;
        if (val.length <= TOTAL_BITS) {
            setText(val);
        }
    };

    const handleProfileChange = (profile: 'loud' | 'subtle') => {
        soundService.setProfile(profile);
        setSoundProfile(profile);
        soundService.playClick();
    };

    const handleThemeChange = (newTheme: 'dark' | 'light') => {
        setTheme(newTheme);
        soundService.playClick();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-[#1a1a1a] border border-[#333] w-full max-w-2xl rounded-xl p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-white text-2xl font-bold font-mono tracking-tighter">COMPOSE MESSAGE</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <textarea
                            className="w-full bg-black border border-[#333] rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xl uppercase tracking-widest leading-loose"
                            rows={6}
                            placeholder="TYPE YOUR MESSAGE HERE..."
                            value={text}
                            onChange={handleChange}
                            spellCheck={false}
                        />
                        <div className="flex justify-end mt-2">
                            <span className={`text-xs font-mono font-bold ${text.length === TOTAL_BITS ? 'text-red-500' : 'text-gray-500'}`}>
                                {text.length} / {TOTAL_BITS} CHARS
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-black/50 p-3 rounded-lg border border-[#333]">
                            <span className="text-gray-400 font-mono text-sm uppercase">Sound Profile</span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleProfileChange('subtle')}
                                    className={`px-4 py-2 rounded text-xs font-mono font-bold transition-all ${soundProfile === 'subtle'
                                        ? 'bg-white text-black shadow-lg scale-105'
                                        : 'text-gray-500 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    SUBTLE
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleProfileChange('loud')}
                                    className={`px-4 py-2 rounded text-xs font-mono font-bold transition-all ${soundProfile === 'loud'
                                        ? 'bg-yellow-500 text-black shadow-lg scale-105'
                                        : 'text-gray-500 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    LOUD
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-black/50 p-3 rounded-lg border border-[#333]">
                            <span className="text-gray-400 font-mono text-sm uppercase">Display Theme</span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleThemeChange('dark')}
                                    className={`px-4 py-2 rounded text-xs font-mono font-bold transition-all ${theme === 'dark'
                                        ? 'bg-white text-black shadow-lg scale-105'
                                        : 'text-gray-500 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    DARK
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleThemeChange('light')}
                                    className={`px-4 py-2 rounded text-xs font-mono font-bold transition-all ${theme === 'light'
                                        ? 'bg-white text-black shadow-lg scale-105'
                                        : 'text-gray-500 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    LIGHT
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setText("")}
                            className="px-6 py-4 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent font-mono"
                        >
                            CLEAR
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-white text-black font-black text-lg py-4 rounded-lg hover:bg-gray-200 transition-transform active:scale-[0.98] shadow-lg font-mono tracking-wider"
                        >
                            UPDATE BOARD
                        </button>
                    </div>
                </form>

                <p className="mt-6 text-center text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                    Supports standard alphanumerics and basic punctuation.
                </p>
            </div>
        </div>
    );
};

export default InputModal;
