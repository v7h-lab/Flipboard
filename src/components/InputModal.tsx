import React, { useState } from 'react';
import { TOTAL_BITS, BoardState, stringToBoard, boardToString } from '../constants';
import { soundService } from '../services/soundService';
import GridEditor from './GridEditor';
import TemplateLibrary from './TemplateLibrary';
import { geminiService } from '../services/geminiService';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (message: string) => void;
    onBoardUpdate?: (board: BoardState) => void;
    onStartLiveClock?: (generator: () => BoardState) => void; // For live clock mode
    onStartLiveQuote?: (keyword: string) => void; // For live quote mode
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
    onStartLiveClock,
    onStartLiveQuote,
    currentMessage,
    currentBoard,
    theme,
    setTheme
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('text');
    const [text, setText] = useState(currentMessage.trimEnd());
    const [board, setBoard] = useState<BoardState>(currentBoard || stringToBoard(currentMessage));
    const [soundProfile, setSoundProfile] = useState<'loud' | 'subtle'>(soundService.getProfile());
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [showAiPrompt, setShowAiPrompt] = useState(false);
    const [showGridAiPrompt, setShowGridAiPrompt] = useState(false);
    const [gridAiPrompt, setGridAiPrompt] = useState('');

    // Live Data State
    const [showLivePrompt, setShowLivePrompt] = useState(false);
    const [liveTopic, setLiveTopic] = useState<string>('General');
    const [liveQuery, setLiveQuery] = useState('');
    const [liveMode, setLiveMode] = useState<'dashboard' | 'quote'>('dashboard');

    // ESC key to close modal - must be before early return (rules of hooks)
    React.useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

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

    const handleTemplateSelect = (templateBoard: BoardState, templateId?: string) => {
        console.log("[InputModal] Template selected:", templateId);
        if (templateId === 'live-quote' || templateId === 'live-quote-ref') {
            // Handled by handleSelectGemini
            return;
        }
        setBoard(templateBoard);
        setText(boardToString(templateBoard).trimEnd());
        soundService.playClick();
    };

    const handleLiveTemplate = (generator: () => BoardState) => {
        if (onStartLiveClock) {
            onStartLiveClock(generator);
            onClose();
        } else {
            const clockBoard = generator();
            setBoard(clockBoard);
            setText(boardToString(clockBoard).trimEnd());
        }
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

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;

        setIsGenerating(true);
        try {
            // Prompt engineering for the grid
            const systemPrompt = `You are writing for a mechanical split-flap display.
            Grid Size: 6 rows x 22 columns.
            Max Length: STRICTLY 132 characters.
            
            Your Task: Write a message based on the user's request.
            
            CRITICAL CONSTRAINTS:
            1. TOTAL LENGTH MUST BE <= 132 CHARACTERS.
            2. IF THE MESSAGE IS TOO LONG, SUMMARIZE IT.
            3. Use ONLY A-Z, 0-9, and (!@#$()[]+-&;:'",.?/).
            4. Format for 22-char width (add newlines if needed, but keep total under 132).
            5. Center vertically/horizontally if it improves aesthetics.
            
            User Request: "${aiPrompt}"`;

            const generatedText = await geminiService.generateText(systemPrompt);

            // Post-processing
            const cleanText = generatedText.toUpperCase().slice(0, TOTAL_BITS);

            setText(cleanText);
            setBoard(stringToBoard(cleanText.padEnd(TOTAL_BITS, ' ')));
            setShowAiPrompt(false);
            setAiPrompt('');
            soundService.playClick();
        } catch (error: any) {
            console.error(error);
            const msg = error.message || '';
            if (msg.includes('429') || msg.includes('Quota')) {
                alert(`⚠️ Rate Limit Hit on ${geminiService.getModelName()}! Wait 60s.`);
            } else if (msg.includes('503')) {
                alert("⚠️ Service Overloaded.");
            } else {
                alert(`Error: ${msg.slice(0, 50)}...`);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGridAiGenerate = async () => {
        if (!gridAiPrompt.trim()) return;

        setIsGenerating(true);
        try {
            const newBoard = await geminiService.generateBoard(gridAiPrompt);
            if (newBoard && Array.isArray(newBoard)) {
                setBoard(newBoard);
                setText(boardToString(newBoard).trimEnd());
                setShowGridAiPrompt(false);
                setGridAiPrompt('');
                soundService.playClick();
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.message || '';
            if (msg.includes('429') || msg.includes('Quota')) {
                alert(`⚠️ Rate Limit Hit on ${geminiService.getModelName()}! Wait 60s. (Free Tier)`);
            } else if (msg.includes('404')) {
                alert(`⚠️ Model Not Found: ${geminiService.getModelName()}`);
            } else {
                alert(`Failed: ${msg.slice(0, 60)}...`);
            }
        } finally {
            setIsGenerating(false);
        }
    };



    const handleSelectGemini = (id: string) => {
        if (id === 'live-dashboard') {
            setLiveMode('dashboard');
            setLiveTopic('General');
            setLiveQuery('');
            setShowLivePrompt(true);
        } else if (id === 'live-quote' || id === 'live-quote-ref') {
            setLiveMode('quote');
            setLiveTopic('General'); // Not used for quote directly but good reset
            setLiveQuery('');
            setShowLivePrompt(true);
        }
    };

    const handleLiveGenerate = async () => {
        if (!liveQuery.trim()) return;

        // Branch for Quote Mode
        if (liveMode === 'quote') {
            if (onStartLiveQuote) {
                onStartLiveQuote(liveQuery);
                onClose();
                setShowLivePrompt(false);
                setLiveQuery('');
            }
            return;
        }

        // Default: Dashboard Mode
        setIsGenerating(true);
        soundService.playClick();

        try {
            const newBoard = await geminiService.generateLiveContent(liveTopic, liveQuery);
            if (newBoard && Array.isArray(newBoard)) {
                setBoard(newBoard);
                setText(boardToString(newBoard).trimEnd());
                setShowLivePrompt(false);
                setLiveQuery('');
                soundService.playClick();
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.message || '';
            if (msg.includes('429') || msg.includes('Quota')) {
                alert(`⚠️ API Rate Limit Hit (${geminiService.getModelName()}).\nPlease wait ~1 minute before trying again.`);
            } else {
                alert(`Failed: ${msg.slice(0, 60)}...`);
            }
        } finally {
            setIsGenerating(false);
        }
    };



    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={(e) => {
                // Close when clicking on backdrop (not on modal content)
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
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

                            {/* AI Smart Compose Trigger */}
                            {/* <div className="flex gap-2">
                                {!showAiPrompt ? (
                                    <button
                                        onClick={() => setShowAiPrompt(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-xs font-bold font-mono text-white hover:opacity-90 transition-opacity"
                                    >
                                        ✨ AI SMART COMPOSE
                                    </button>
                                ) : (
                                    <div className="flex-1 flex gap-2 animate-fade-in">
                                        <input
                                            type="text"
                                            placeholder="Ex: 'Morning motivation', 'Welcome for John'"
                                            className="flex-1 bg-black/50 border border-blue-500/50 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleAiGenerate}
                                            disabled={isGenerating}
                                            className="px-4 py-2 bg-blue-600 rounded text-xs font-bold font-mono text-white disabled:opacity-50"
                                        >
                                            {isGenerating ? 'GEN...' : 'GO'}
                                        </button>
                                        <button
                                            onClick={() => setShowAiPrompt(false)}
                                            className="px-2 text-gray-500 hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div> */}

                        </div>
                    )}

                    {activeTab === 'grid' && (
                        <div className="overflow-x-auto">
                            {/* AI Grid Designer Trigger */}
                            {/* <div className="flex gap-2 mb-4">
                                {!showGridAiPrompt ? (
                                    <button
                                        onClick={() => setShowGridAiPrompt(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg text-xs font-bold font-mono text-white hover:opacity-90 transition-opacity w-full justify-center"
                                    >
                                        🎨 AI DESIGNER
                                    </button>
                                ) : (
                                    <div className="flex-1 flex gap-2 animate-fade-in mb-4">
                                        <input
                                            type="text"
                                            placeholder="Ex: 'Pixel art heart', 'Sunset gradient', 'Pacman'"
                                            className="flex-1 bg-black/50 border border-pink-500/50 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-pink-500"
                                            value={gridAiPrompt}
                                            onChange={(e) => setGridAiPrompt(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleGridAiGenerate()}
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleGridAiGenerate}
                                            disabled={isGenerating}
                                            className="px-4 py-2 bg-pink-600 rounded text-xs font-bold font-mono text-white disabled:opacity-50"
                                        >
                                            {isGenerating ? 'GEN...' : 'GO'}
                                        </button>
                                        <button
                                            onClick={() => setShowGridAiPrompt(false)}
                                            className="px-2 text-gray-500 hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div> */}
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
                            onSelectLive={handleLiveTemplate}
                            onSelectGemini={handleSelectGemini}
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
            {/* Live Data Input Modal */}
            {
                showLivePrompt && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
                        <div className="bg-[#222] border border-[#444] rounded-xl p-6 w-full max-w-sm shadow-2xl">
                            <h3 className="text-xl font-bold font-mono text-white mb-4">
                                LIVE DASHBOARD
                            </h3>
                            <p className="text-gray-400 text-xs font-mono mb-2">
                                Enter any topic or list (e.g. "NYC LDN TYO", "AAPL GOOG", "Premier League Scores")
                            </p>
                            <input
                                type="text"
                                value={liveQuery}
                                onChange={(e) => setLiveQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLiveGenerate()}
                                className="w-full bg-black border border-gray-600 rounded px-3 py-2 text-white font-mono mb-4 focus:border-yellow-500 outline-none"
                                placeholder="Data query..."
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowLivePrompt(false)}
                                    className="flex-1 py-2 bg-gray-700 text-gray-300 rounded font-mono text-sm hover:bg-gray-600"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleLiveGenerate}
                                    disabled={isGenerating || !liveQuery.trim()}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded font-mono text-sm font-bold hover:bg-blue-500 disabled:opacity-50"
                                >
                                    {isGenerating ? 'GEN...' : 'GO'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default InputModal;
