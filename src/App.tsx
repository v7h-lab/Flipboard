import React, { useState, useEffect, useRef } from 'react';
import { COLS, TOTAL_BITS, BoardState, stringToBoard, boardToString, createEmptyBoard } from './constants';
import SplitFlap from './components/SplitFlap';
import InputModal from './components/InputModal';
import QRCodeModal from './components/QRCodeModal';
import RemoteControl from './components/RemoteControl';
import { soundService } from './services/soundService';
import { connectionService, RemoteCommand, ConnectionMode } from './services/connectionService';
import { generateArtsyClockBoard } from './data/templates';

const App: React.FC = () => {
    const [isRemoteMode, setIsRemoteMode] = useState(false);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [connectionMode, setConnectionMode] = useState<ConnectionMode>('websocket');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const remoteParam = params.get('remote');
        const modeParam = params.get('mode') as ConnectionMode | null;

        if (remoteParam) {
            // Remote mode - just set up the mode, connection will be handled by RemoteControl
            setIsRemoteMode(true);
            if (modeParam === 'peerjs' || modeParam === 'websocket') {
                connectionService.setMode(modeParam);
                setConnectionMode(modeParam);
            }
            // Don't call connectToHost here - RemoteControl will do it after mounting
        } else {
            // Host mode - initialize with default mode
            connectionService.setMode(connectionMode);
            connectionService.initHost().then(id => {
                setRoomId(id);
            });
        }
    }, []);

    const handleModeChange = async (mode: ConnectionMode) => {
        // Destroy all connections before switching modes
        connectionService.destroyAll();
        connectionService.setMode(mode);
        setConnectionMode(mode);

        const id = await connectionService.initHost();
        setRoomId(id);
    };

    if (isRemoteMode) {
        return <RemoteControl mode={connectionMode} />;
    }

    return <HostApp roomId={roomId} connectionMode={connectionMode} onModeChange={handleModeChange} />;
};

interface HostAppProps {
    roomId: string | null;
    connectionMode: ConnectionMode;
    onModeChange: (mode: ConnectionMode) => void;
}

const HostApp: React.FC<HostAppProps> = ({ roomId, connectionMode, onModeChange }) => {
    const [message, setMessage] = useState<string>("".padEnd(TOTAL_BITS, " "));
    const [board, setBoard] = useState<BoardState>(createEmptyBoard());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [isClockRunning, setIsClockRunning] = useState(false);
    const liveClockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [lastLog, setLastLog] = useState<string>("Waiting...");
    const [relayStatus, setRelayStatus] = useState<string>("Initializing...");

    const WELCOME_MSG = "DIGITAL FLIPBOARD     READY TO FLIP         TYPE TO START...      ".padEnd(TOTAL_BITS, " ");

    const handleUpdate = (newMsg: string) => {
        handleStopLiveClock();
        const msg = newMsg.toUpperCase();
        setMessage(msg);
        setBoard(stringToBoard(msg));
    };

    const handleBoardUpdate = (newBoard: BoardState) => {
        handleStopLiveClock();
        setBoard(newBoard);
        setMessage(boardToString(newBoard));
    };

    const handleStopLiveClock = () => {
        if (liveClockIntervalRef.current) {
            clearInterval(liveClockIntervalRef.current);
            liveClockIntervalRef.current = null;
        }
        setIsClockRunning(false);
    };

    const handleStartLiveClock = (generator: () => BoardState) => {
        // Stop any existing clock
        handleStopLiveClock();

        // Start clock mode - update every second
        setHasStarted(true);
        setIsClockRunning(true);
        const clockBoard = generator();
        setBoard(clockBoard);
        setMessage(boardToString(clockBoard));

        const interval = setInterval(() => {
            const newBoard = generator();
            setBoard(newBoard);
            setMessage(boardToString(newBoard));
        }, 1000);

        liveClockIntervalRef.current = interval;
    };

    useEffect(() => {
        connectionService.onCommand((cmd: RemoteCommand) => {
            const logIdx = new Date().toLocaleTimeString();
            setLastLog(`[${logIdx}] ${cmd.type}`);

            // Stop live clock when receiving any update from remote
            if (cmd.type === 'UPDATE_MESSAGE' || cmd.type === 'UPDATE_BOARD') {
                handleStopLiveClock();
            }

            if (cmd.type === 'UPDATE_MESSAGE') handleUpdate(cmd.payload);
            if (cmd.type === 'UPDATE_BOARD') setBoard(cmd.payload);
            if (cmd.type === 'SET_THEME') {
                setTheme(cmd.payload);
                soundService.playClick();
            }
            if (cmd.type === 'SET_SOUND') {
                soundService.setProfile(cmd.payload);
                soundService.playClick();
            }
            if (cmd.type === 'START_LIVE_CLOCK') {
                // Start live clock with the specified theme
                const clockTheme = cmd.payload;
                handleStartLiveClock(() => generateArtsyClockBoard(clockTheme));
            }
            if (cmd.type === 'STOP_LIVE_CLOCK') {
                handleStopLiveClock();
            }
        });

        connectionService.onStatus((s) => {
            setRelayStatus(s);
        });

        // Listen for fullscreen changes (ESC exits fullscreen automatically via browser)
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    };

    const handleStart = async () => {
        await soundService.init();
        setHasStarted(true);
        setTimeout(() => {
            setMessage(WELCOME_MSG);
        }, 500);
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

    const qrLink = `${window.location.protocol}//${window.location.host}?remote=${roomId}`;

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 md:p-12 relative overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#111]' : 'bg-[#e0e0e0]'}`}>
            <div className={`absolute inset-0 pointer-events-none z-0 opacity-80 ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)]' : 'bg-[radial-gradient(circle_at_center,_transparent_0%,_#ccc_100%)]'}`}></div>

            {/* Debug Overlay - Development Only, Hidden in Fullscreen */}
            {!connectionService.isProduction() && !isFullscreen && (
                <div className="fixed bottom-4 left-4 z-50 bg-black/80 border border-gray-800 p-2 rounded text-[10px] font-mono text-gray-400 pointer-events-none text-left max-w-xs">
                    <p>MODE: <span className={connectionMode === 'peerjs' ? 'text-blue-400' : 'text-green-400'}>{connectionMode.toUpperCase()}</span></p>
                    <p>ROOM: <span className="text-white">{roomId || 'Generating...'}</span></p>
                    <p>STATUS: <span className={relayStatus === 'connected' ? 'text-green-400' : 'text-yellow-400'}>{relayStatus}</span></p>
                    <p className="border-t border-gray-800 mt-1 pt-1 break-words">LOG: {lastLog}</p>
                </div>
            )}

            {/* Main Board Container */}
            <div className={`relative z-10 p-3 md:p-6 rounded-lg shadow-2xl border transition-colors duration-500 ${theme === 'dark' ? 'bg-[#080808] border-[#222]' : 'bg-[#f0f0f0] border-[#ccc]'}`}>
                <div className={`absolute top-2 left-2 w-2 h-2 rounded-full shadow-inner ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#d1d1d1]'}`}></div>
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full shadow-inner ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#d1d1d1]'}`}></div>
                <div className={`absolute bottom-2 left-2 w-2 h-2 rounded-full shadow-inner ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#d1d1d1]'}`}></div>
                <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full shadow-inner ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#d1d1d1]'}`}></div>

                <div
                    className={`grid gap-[1px] md:gap-[2px] border transition-colors duration-500 ${theme === 'dark' ? 'bg-black border-black/50' : 'bg-[#ccc] border-gray-400'}`}
                    style={{
                        gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                        width: 'min(95vw, 1200px)',
                    }}
                >
                    {board.map((row, rowIdx) =>
                        row.map((cell, colIdx) => {
                            const i = rowIdx * COLS + colIdx;
                            return (
                                <div key={i} className="aspect-[4/6] relative">
                                    <SplitFlap
                                        targetChar={cell.char || " "}
                                        color={cell.color}
                                        delay={(colIdx) * 50 + (rowIdx * 20)}
                                        theme={theme}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Controls - Hidden in fullscreen */}
            {!isFullscreen && (
                <div className="fixed bottom-8 z-20 flex gap-4">
                    <button
                        onClick={() => setIsQRModalOpen(true)}
                        className={`p-3 rounded-full font-mono font-bold tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2 ${theme === 'dark' ? 'bg-[#222] text-white hover:bg-[#333]' : 'bg-white text-black hover:bg-gray-200'}`}
                        title="Connect Remote"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        <span className="hidden md:inline">REMOTE</span>
                    </button>
                    {isClockRunning ? (
                        <button
                            onClick={handleStopLiveClock}
                            className="px-8 py-3 rounded-full font-mono font-bold tracking-wider shadow-lg active:scale-95 transition-all bg-red-600 text-white hover:bg-red-500 animate-pulse"
                        >
                            ⏹ STOP CLOCK
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className={`px-8 py-3 rounded-full font-mono font-bold tracking-wider shadow-lg active:scale-95 transition-all ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                        >
                            COMPOSE MESSAGE
                        </button>
                    )}
                    <button
                        onClick={toggleFullscreen}
                        className={`p-3 rounded-full font-mono font-bold tracking-wider shadow-lg active:scale-95 transition-all ${theme === 'dark' ? 'bg-[#222] text-white hover:bg-[#333]' : 'bg-white text-black hover:bg-gray-200'}`}
                        title="Fullscreen"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    </button>
                </div>
            )}

            <InputModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={(msg) => { handleStopLiveClock(); handleUpdate(msg); }}
                onBoardUpdate={(b) => { handleStopLiveClock(); handleBoardUpdate(b); }}
                onStartLiveClock={handleStartLiveClock}
                currentMessage={message}
                currentBoard={board}
                theme={theme}
                setTheme={setTheme}
            />

            <QRCodeModal
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                link={qrLink}
                onModeChange={onModeChange}
                currentMode={connectionMode}
            />

            {/* Version Text - Hidden in Fullscreen */}
            {!isFullscreen && (
                <div className={`absolute top-4 right-4 font-mono text-xs tracking-widest pointer-events-none transition-colors duration-500 ${theme === 'dark' ? 'text-white/20' : 'text-black/20'}`}>
                    V.1.0 // ONLINE
                </div>
            )}
        </div>
    );
};

export default App;
