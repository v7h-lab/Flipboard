import React, { useState, useEffect } from 'react';
import { connectionService, ConnectionMode } from '../services/connectionService';
import { TOTAL_BITS, BoardState, boardToString, createEmptyBoard } from '../constants';
import GridEditor from './GridEditor';
import TemplateLibrary from './TemplateLibrary';

interface RemoteControlProps {
    mode: ConnectionMode;
}

type Tab = 'quick' | 'grid' | 'templates';

const RemoteControl: React.FC<RemoteControlProps> = ({ mode }) => {
    const [activeTab, setActiveTab] = useState<Tab>('quick');
    const [text, setText] = useState("");
    const [board, setBoard] = useState<BoardState>(createEmptyBoard());
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [sound, setSound] = useState<'loud' | 'subtle'>('subtle');
    const [status, setStatus] = useState("connecting");
    const [logs, setLogs] = useState<string[]>([]);

    const isProduction = connectionService.isProduction();

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
    };

    useEffect(() => {
        addLog(`Mode: ${mode.toUpperCase()}`);
        addLog("Initializing Remote...");

        connectionService.onStatus((s) => {
            setStatus(s);
            addLog(`Status: ${s}`);
        });

        const params = new URLSearchParams(window.location.search);
        const roomId = params.get('remote');
        addLog(`Room: ${roomId || 'MISSING'}`);

        const connectToRoom = () => {
            if (roomId) {
                addLog("Connecting to host...");
                connectionService.connectToHost(roomId).catch((err) => {
                    addLog(`Connection error: ${err.message || err}`);
                });
            }
        };

        connectToRoom();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const currentStatus = connectionService.status;
                if (currentStatus !== 'connected' && currentStatus !== 'connecting') {
                    addLog("Tab visible - reconnecting...");
                    connectionService.destroyAll();
                    setTimeout(connectToRoom, 500);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [mode]);

    const handleQuickSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (status !== 'connected') {
            addLog("Cannot send: Not connected");
            return;
        }
        addLog(`Sending: ${text}`);
        connectionService.sendCommand({ type: 'UPDATE_MESSAGE', payload: text.padEnd(TOTAL_BITS, ' ') });
        setText("");
    };

    const handleBoardSend = () => {
        if (status !== 'connected') {
            addLog("Cannot send: Not connected");
            return;
        }
        addLog("Sending board...");
        connectionService.sendCommand({ type: 'UPDATE_BOARD', payload: board });
    };

    const handleBoardChange = (newBoard: BoardState) => {
        setBoard(newBoard);
    };

    const handleTemplateSelect = (templateBoard: BoardState) => {
        setBoard(templateBoard);
        setText(boardToString(templateBoard).trimEnd());
        addLog("Template loaded");
    };

    const handleTheme = (t: 'dark' | 'light') => {
        if (status !== 'connected') return;
        setTheme(t);
        connectionService.sendCommand({ type: 'SET_THEME', payload: t });
        addLog(`Theme: ${t}`);
    };

    const handleSound = (s: 'loud' | 'subtle') => {
        if (status !== 'connected') return;
        setSound(s);
        connectionService.sendCommand({ type: 'SET_SOUND', payload: s });
        addLog(`Sound: ${s}`);
    };

    const isDisabled = status !== 'connected';

    return (
        <div className="min-h-screen bg-black text-white p-4 font-mono flex flex-col items-center">
            <h1 className="text-xl font-bold mb-3 tracking-widest text-[#333]">FLIP.REMOTE</h1>

            {/* Mode Badge - Development Only */}
            {!isProduction && (
                <div className={`mb-3 px-3 py-1 rounded text-[10px] font-bold tracking-wider ${mode === 'peerjs' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-green-500/20 text-green-400 border border-green-500/50'
                    }`}>
                    {mode === 'peerjs' ? '🔗 PEERJS MODE' : '📡 WEBSOCKET MODE'}
                </div>
            )}

            {/* Status Indicator */}
            <div className={`mb-4 px-4 py-2 rounded-full text-xs font-bold tracking-wider flex items-center gap-2 ${status === 'connected' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                status === 'error' || status.includes('error') ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                }`}>
                <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                STATUS: {status.toUpperCase()}
            </div>

            {/* Tab Bar */}
            <div className="w-full max-w-md flex gap-1 mb-4">
                {(['quick', 'grid', 'templates'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-xs font-bold rounded-t-lg transition-all ${activeTab === tab
                            ? 'bg-[#1a1a1a] text-yellow-400 border-t border-x border-[#333]'
                            : 'bg-[#0a0a0a] text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {tab === 'quick' ? '⚡ QUICK' : tab === 'grid' ? '🔲 GRID' : '📋 TEMPLATES'}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className={`w-full max-w-md bg-[#1a1a1a] border border-[#333] rounded-b-lg rounded-tr-lg p-4 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>

                {/* Quick Text Tab */}
                {activeTab === 'quick' && (
                    <form onSubmit={handleQuickSend} className="space-y-4">
                        <textarea
                            className="w-full bg-black border border-[#333] rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-lg uppercase tracking-widest leading-loose"
                            rows={4}
                            placeholder="ENTER MESSAGE..."
                            value={text}
                            onChange={(e) => {
                                if (e.target.value.length <= TOTAL_BITS) setText(e.target.value);
                            }}
                            disabled={isDisabled}
                        />
                        <div className="flex justify-between items-center">
                            <span className={`text-xs ${text.length === TOTAL_BITS ? 'text-red-500' : 'text-gray-500'}`}>
                                {text.length} / {TOTAL_BITS}
                            </span>
                            <button
                                type="submit"
                                disabled={isDisabled}
                                className="bg-white text-black font-black py-3 px-6 rounded-lg active:scale-95 transition-all"
                            >
                                SEND
                            </button>
                        </div>
                    </form>
                )}

                {/* Grid Editor Tab */}
                {activeTab === 'grid' && (
                    <div className="space-y-4">
                        <div className="overflow-x-auto -mx-2 px-2">
                            <GridEditor
                                board={board}
                                onChange={handleBoardChange}
                                theme="dark"
                                compact={true}
                            />
                        </div>
                        <button
                            onClick={handleBoardSend}
                            disabled={isDisabled}
                            className="w-full bg-white text-black font-black py-3 rounded-lg active:scale-95 transition-all"
                        >
                            SEND TO BOARD
                        </button>
                    </div>
                )}

                {/* Templates Tab */}
                {activeTab === 'templates' && (
                    <div className="space-y-4">
                        <TemplateLibrary
                            onSelect={handleTemplateSelect}
                            currentBoard={board}
                            onSaveCustom={() => addLog("Template saved")}
                            theme="dark"
                        />
                        <button
                            onClick={handleBoardSend}
                            disabled={isDisabled}
                            className="w-full bg-white text-black font-black py-3 rounded-lg active:scale-95 transition-all"
                        >
                            SEND TEMPLATE
                        </button>
                    </div>
                )}
            </div>

            {/* Settings */}
            <div className={`w-full max-w-md mt-6 space-y-3 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between bg-[#111] p-3 rounded-lg border border-[#333]">
                    <span className="text-gray-400 text-xs">THEME</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleTheme('dark')} className={`px-3 py-1 rounded text-xs font-bold ${theme === 'dark' ? 'bg-white text-black' : 'text-gray-500'}`}>DARK</button>
                        <button onClick={() => handleTheme('light')} className={`px-3 py-1 rounded text-xs font-bold ${theme === 'light' ? 'bg-white text-black' : 'text-gray-500'}`}>LIGHT</button>
                    </div>
                </div>

                <div className="flex items-center justify-between bg-[#111] p-3 rounded-lg border border-[#333]">
                    <span className="text-gray-400 text-xs">SOUND</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleSound('subtle')} className={`px-3 py-1 rounded text-xs font-bold ${sound === 'subtle' ? 'bg-white text-black' : 'text-gray-500'}`}>SUBTLE</button>
                        <button onClick={() => handleSound('loud')} className={`px-3 py-1 rounded text-xs font-bold ${sound === 'loud' ? 'bg-yellow-500 text-black' : 'text-gray-500'}`}>LOUD</button>
                    </div>
                </div>
            </div>

            {/* DEBUG LOGS - Development Only */}
            {!isProduction && (
                <div className="w-full max-w-md mt-6 p-3 bg-[#0a0a0a] border border-[#222] rounded-lg font-mono text-[10px] text-gray-500 whitespace-pre-wrap h-24 overflow-y-auto">
                    {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
            )}
        </div>
    );
};

export default RemoteControl;
