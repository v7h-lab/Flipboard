import React, { useState } from 'react';
import { TOTAL_BITS, BoardState, stringToBoard, boardToString } from '../constants';
import { soundService } from '../services/soundService';
import GridEditor from './GridEditor';
import TemplateLibrary from './TemplateLibrary';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (message: string) => void;
    onBoardUpdate?: (board: BoardState) => void;
    currentMessage: string;
    currentBoard?: BoardState;
    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;
}

type Tab = 'text' | 'grid' | 'templates';

const InputModal: React.FC<InputModalProps> = ({
    isOpen,
    onClose,
    onUpdate,
    onBoardUpdate,
    currentMessage,
    currentBoard,
    theme,
    setTheme
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('text');
    const [text, setText] = useState(currentMessage.trimEnd());
    const [board, setBoard] = useState<BoardState>(currentBoard || stringToBoard(currentMessage));
    const [soundProfile, setSoundProfile] = useState<'loud' | 'subtle'>(soundService.getProfile());

    if (!isOpen) return null;

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (activeTab === 'grid' || activeTab === 'templates') {
            if (onBoardUpdate) {
                onBoardUpdate(board);
            } else {
                onUpdate(boardToString(board));
            }
        } else {
            onUpdate(text.padEnd(TOTAL_BITS, ' '));
        }
        onClose();
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        if (val.length <= TOTAL_BITS) {
            setText(val);
            setBoard(stringToBoard(val.toUpperCase().padEnd(TOTAL_BITS, ' ')));
        }
    };

    const handleBoardChange = (newBoard: BoardState) => {
        setBoard(newBoard);
        setText(boardToString(newBoard).trimEnd());
    };

    const handleTemplateSelect = (templateBoard: BoardState) => {
        setBoard(templateBoard);
        setText(boardToString(templateBoard).trimEnd());
        soundService.playClick();
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

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        soundService.playClick();
    };

    const handleClear = () => {
        setText('');
        setBoard(stringToBoard(''));
        soundService.playClick();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-[#1a1a1a] border border-[#333] w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 pb-4 border-b border-[#333]">
                    <h2 className="text-white text-2xl font-bold font-mono tracking-tighter">COMPOSE MESSAGE</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 px-6 py-3 border-b border-[#333] bg-black/30">
                    {(['text', 'grid', 'templates'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-mono font-bold transition-all ${activeTab === tab
                                ? 'bg-yellow-500 text-black'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'text' && (
                        <div className="space-y-4">
                            <textarea
                                className="w-full bg-black border border-[#333] rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xl uppercase tracking-widest leading-loose"
                                rows={6}
                                placeholder="TYPE YOUR MESSAGE HERE..."
                                value={text}
                                onChange={handleTextChange}
                                spellCheck={false}
                            />
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-mono text-gray-500">
                                    Tip: Use the GRID tab for precise cell placement
                                </span>
                                <span className={`text-xs font-mono font-bold ${text.length >= TOTAL_BITS ? 'text-red-500' : 'text-gray-500'}`}>
                                    {text.length} / {TOTAL_BITS} CHARS
                                </span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'grid' && (
                        <div className="overflow-x-auto">
                            <GridEditor
                                board={board}
                                onChange={handleBoardChange}
                                theme="dark"
                            />
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <TemplateLibrary
                            onSelect={handleTemplateSelect}
                            currentBoard={board}
                            onSaveCustom={(_name, _b) => {
                                // Template is saved internally by TemplateLibrary
                                soundService.playClick();
                            }}
                            theme="dark"
                        />
                    )}
                </div>

                {/* Settings */}
                <div className="px-6 py-4 border-t border-[#333] bg-black/30 space-y-3">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-mono text-xs uppercase">Sound:</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleProfileChange('subtle')}
                                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${soundProfile === 'subtle'
                                        ? 'bg-white text-black'
                                        : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    SUBTLE
                                </button>
                                <button
                                    onClick={() => handleProfileChange('loud')}
                                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${soundProfile === 'loud'
                                        ? 'bg-yellow-500 text-black'
                                        : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    LOUD
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-mono text-xs uppercase">Theme:</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleThemeChange('dark')}
                                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${theme === 'dark'
                                        ? 'bg-white text-black'
                                        : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    DARK
                                </button>
                                <button
                                    onClick={() => handleThemeChange('light')}
                                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${theme === 'light'
                                        ? 'bg-white text-black'
                                        : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    LIGHT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 p-6 pt-4 border-t border-[#333]">
                    <button
                        type="button"
                        onClick={handleClear}
                        className="px-6 py-4 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent font-mono"
                    >
                        CLEAR
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        className="flex-1 bg-white text-black font-black text-lg py-4 rounded-lg hover:bg-gray-200 transition-transform active:scale-[0.98] shadow-lg font-mono tracking-wider"
                    >
                        UPDATE BOARD
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InputModal;
