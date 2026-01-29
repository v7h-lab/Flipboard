import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    link: string; // Base link from parent (likely just the path/query)
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, link }) => {
    // Default to current hostname, but allow user to override
    const [hostIp, setHostIp] = useState(window.location.hostname);

    // Extract the part of the link that isn't the origin
    // link passed from App.tsx was full URL, let's parse it
    const [urlPath, setUrlPath] = useState("");

    useEffect(() => {
        try {
            const url = new URL(link);
            setUrlPath(url.pathname + url.search);
            // If the link provided has a different hostname (e.g. from logic), use it, otherwise default to current
            if (url.hostname !== 'localhost') {
                setHostIp(url.hostname);
            }
        } catch (e) {
            // If link isn't a full URL, just use it as path
            setUrlPath(link);
        }
    }, [link]);

    if (!isOpen) return null;

    // Construct the final QR URL using the manual IP
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    const fullQrUrl = `${protocol}//${hostIp}${port}${urlPath}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="bg-[#1a1a1a] border border-[#333] w-full max-w-sm rounded-xl p-8 shadow-2xl flex flex-col items-center">
                <div className="flex justify-between items-center w-full mb-6">
                    <h2 className="text-white text-xl font-bold font-mono tracking-tighter">REMOTE PAIRING</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="bg-white p-4 rounded-lg mb-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <QRCodeSVG value={fullQrUrl} size={200} level="H" />
                </div>

                <div className="w-full mb-6">
                    <label className="block text-gray-500 text-xs font-mono mb-2 uppercase tracking-wider">
                        Step 1: Verify Network IP
                    </label>
                    <input
                        type="text"
                        value={hostIp}
                        onChange={(e) => setHostIp(e.target.value)}
                        className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white font-mono text-center focus:border-white outline-none transition-colors"
                        placeholder="e.g. 192.168.1.5"
                    />
                    <p className="text-[10px] text-gray-600 mt-2 font-mono text-center leading-relaxed">
                        Replace 'localhost' with your computer's Network IP address found in the terminal (look for <span className="text-white">Network:</span> after starting the app).
                    </p>
                </div>

                <p className="text-gray-400 text-center text-xs font-mono">
                    Step 2: Scan with mobile device
                </p>
            </div>
        </div>
    );
};

export default QRCodeModal;
