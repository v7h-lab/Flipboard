import React, { useState, useEffect } from 'react';
import { connectionService, ConnectionMode } from '../services/connectionService';
import { TOTAL_BITS } from '../constants';

interface RemoteControlProps {
    mode: ConnectionMode;
}

const RemoteControl: React.FC<RemoteControlProps> = ({ mode }) => {
    const [text, setText] = useState("");
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [sound, setSound] = useState<'default' | 'mechanical'>('default');
    const [status, setStatus] = useState("connecting");
    const [logs, setLogs] = useState<string[]>([]);

    const isProduction = connectionService.isProduction();

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
    };

    useEffect(() => {
        addLog(`Mode: ${mode.toUpperCase()}`);
        addLog("Initializing Remote...");

        // Register callbacks first
        connectionService.onStatus((s) => {
            setStatus(s);
            addLog(`Status: ${s}`);
        });

        // Get room ID from URL and connect
        const params = new URLSearchParams(window.location.search);
        const roomId = params.get('remote');
        addLog(`Room: ${roomId || 'MISSING'}`);

        if (roomId) {
            addLog("Connecting to host...");
            connectionService.connectToHost(roomId).catch((err) => {
                addLog(`Connection error: ${err.message || err}`);
            });
        }
    }, [mode]);

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();

        if (status !== 'connected') {
            addLog("Cannot send: Not connected");
            return;
        }

        addLog(`Sending: ${text}`);
        connectionService.sendCommand({ type: 'UPDATE_MESSAGE', payload: text.padEnd(TOTAL_BITS, ' ') });
        setText("");
    };

    const handleTheme = (t: 'dark' | 'light') => {
        if (status !== 'connected') return;
        setTheme(t);
        connectionService.sendCommand({ type: 'SET_THEME', payload: t });
        addLog(`Theme: ${t}`);
    };

    const handleSound = (s: 'default' | 'mechanical') => {
        if (status !== 'connected') return;
        setSound(s);
        connectionService.sendCommand({ type: 'SET_SOUND', payload: s });
        addLog(`Sound: ${s}`);
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 font-mono flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4 tracking-widest text-[#333]">FLIP.REMOTE</h1>

            {/* Mode Badge */}
            <div className={`mb-4 px-3 py-1 rounded text-[10px] font-bold tracking-wider ${mode === 'peerjs' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-green-500/20 text-green-400 border border-green-500/50'
                }`}>
                {mode === 'peerjs' ? '🔗 PEERJS MODE' : '📡 WEBSOCKET MODE'}
            </div>

            {/* Status Indicator */}
            <div className={`mb-8 px-4 py-2 rounded-full text-xs font-bold tracking-wider flex items-center gap-2 ${status === 'connected' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                status === 'error' || status.includes('error') ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                }`}>
                <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                STATUS: {status.toUpperCase()}
            </div>

            <form onSubmit={handleUpdate} className="w-full max-w-md space-y-6">
                <div>
                    <textarea
                        className="w-full bg-[#111] border border-[#333] rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-xl uppercase tracking-widest leading-loose"
                        rows={4}
                        placeholder="ENTER MESSAGE..."
                        value={text}
                        onChange={(e) => {
                            if (e.target.value.length <= TOTAL_BITS) setText(e.target.value);
                        }}
                        disabled={status !== 'connected'}
                    />
                    <div className="flex justify-end mt-2">
                        <span className={`text-xs ${text.length === TOTAL_BITS ? 'text-red-500' : 'text-gray-500'}`}>
                            {text.length} / {TOTAL_BITS}
                        </span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={status !== 'connected'}
                    className={`w-full font-black text-lg py-4 rounded-lg active:scale-95 transition-all ${status === 'connected'
                        ? 'bg-white text-black'
                        : 'bg-[#333] text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {status === 'connected' ? 'SEND TO BOARD' : 'CONNECTING...'}
                </button>
            </form>

            <div className="w-full max-w-md mt-12 space-y-4">
                <div className={`flex items-center justify-between bg-[#111] p-4 rounded-lg border border-[#333] ${status !== 'connected' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <span className="text-gray-400 text-sm">THEME</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleTheme('dark')} className={`px-3 py-1 rounded text-xs font-bold ${theme === 'dark' ? 'bg-white text-black' : 'text-gray-500'}`}>DARK</button>
                        <button onClick={() => handleTheme('light')} className={`px-3 py-1 rounded text-xs font-bold ${theme === 'light' ? 'bg-white text-black' : 'text-gray-500'}`}>LIGHT</button>
                    </div>
                </div>

                <div className={`flex items-center justify-between bg-[#111] p-4 rounded-lg border border-[#333] ${status !== 'connected' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <span className="text-gray-400 text-sm">SOUND</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleSound('default')} className={`px-3 py-1 rounded text-xs font-bold ${sound === 'default' ? 'bg-white text-black' : 'text-gray-500'}`}>DEF</button>
                        <button onClick={() => handleSound('mechanical')} className={`px-3 py-1 rounded text-xs font-bold ${sound === 'mechanical' ? 'bg-yellow-500 text-black' : 'text-gray-500'}`}>MECH</button>
                    </div>
                </div>
            </div>

            {/* DEBUG LOGS - Development Only */}
            {!isProduction && (
                <div className="w-full max-w-md mt-8 p-4 bg-[#0a0a0a] border border-[#222] rounded-lg font-mono text-[10px] text-gray-500 whitespace-pre-wrap h-32 overflow-y-auto">
                    {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
            )}
        </div>
    );
};

export default RemoteControl;
