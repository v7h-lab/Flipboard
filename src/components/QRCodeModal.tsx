import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { connectionService, ConnectionMode } from '../services/connectionService';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    link: string;
    onModeChange: (mode: ConnectionMode) => void;
    currentMode: ConnectionMode;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, link, onModeChange, currentMode }) => {
    const [hostIp, setHostIp] = useState(window.location.hostname);
    const [urlPath, setUrlPath] = useState("");

    const isProduction = connectionService.isProduction();

    useEffect(() => {
        try {
            const url = new URL(link);
            setUrlPath(url.pathname + url.search);
            if (url.hostname !== 'localhost') {
                setHostIp(url.hostname);
            }
        } catch (e) {
            setUrlPath(link);
        }
    }, [link]);

    if (!isOpen) return null;

    // ESC key to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    // Add ESC listener when modal opens
    React.useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    // Add mode parameter to URL so remote knows which service to use
    const modeParam = `&mode=${currentMode}`;
    const fullQrUrl = `${protocol}//${hostIp}${port}${urlPath}${modeParam}`;

    const handleModeToggle = (mode: ConnectionMode) => {
        onModeChange(mode);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-[#1a1a1a] border border-[#333] w-full max-w-sm rounded-xl p-8 shadow-2xl flex flex-col items-center">
                <div className="flex justify-between items-center w-full mb-6">
                    <h2 className="text-white text-xl font-bold font-mono tracking-tighter">REMOTE PAIRING</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Connection Mode Toggle - Only show in development */}
                {!isProduction && (
                    <div className="w-full mb-6">
                        <label className="block text-gray-500 text-xs font-mono mb-2 uppercase tracking-wider">
                            Connection Mode (Dev Only)
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleModeToggle('websocket')}
                                className={`flex-1 py-2 px-3 rounded text-xs font-mono font-bold transition-all ${currentMode === 'websocket'
                                    ? 'bg-green-500 text-black'
                                    : 'bg-[#333] text-gray-400 hover:bg-[#444]'
                                    }`}
                            >
                                WebSocket
                                <span className="block text-[10px] font-normal opacity-70">Local WiFi</span>
                            </button>
                            <button
                                onClick={() => handleModeToggle('peerjs')}
                                className={`flex-1 py-2 px-3 rounded text-xs font-mono font-bold transition-all ${currentMode === 'peerjs'
                                    ? 'bg-blue-500 text-black'
                                    : 'bg-[#333] text-gray-400 hover:bg-[#444]'
                                    }`}
                            >
                                PeerJS
                                <span className="block text-[10px] font-normal opacity-70">Cellular/Prod</span>
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-600 mt-2 font-mono text-center">
                            {currentMode === 'websocket'
                                ? '✓ Use for local testing on same WiFi'
                                : '✓ Use for mobile data or production'}
                        </p>
                    </div>
                )}



                <div className="bg-white p-4 rounded-lg mb-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <QRCodeSVG value={fullQrUrl} size={200} level="H" />
                </div>

                {/* IP input - Only needed in development */}
                {!isProduction && (
                    <div className="w-full mb-6">
                        <label className="block text-gray-500 text-xs font-mono mb-2 uppercase tracking-wider">
                            Network IP
                        </label>
                        <input
                            type="text"
                            value={hostIp}
                            onChange={(e) => setHostIp(e.target.value)}
                            className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white font-mono text-center focus:border-white outline-none transition-colors"
                            placeholder="e.g. 192.168.1.5"
                        />
                        <p className="text-[10px] text-gray-600 mt-2 font-mono text-center leading-relaxed">
                            {currentMode === 'peerjs'
                                ? 'For PeerJS with cellular, this can be any reachable address'
                                : 'Use your local network IP (find in terminal after "Network:")'}
                        </p>
                    </div>
                )}

                <p className="text-gray-400 text-center text-xs font-mono">
                    Scan with mobile device to connect
                </p>
            </div>
        </div>
    );
};

export default QRCodeModal;
