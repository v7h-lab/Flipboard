import { WebSocketServer, WebSocket } from 'ws';
import type { Plugin, ViteDevServer } from 'vite';

interface Client {
    ws: WebSocket;
    role: 'host' | 'remote';
    roomId: string;
}

export function webSocketRelayPlugin(): Plugin {
    const clients: Map<string, Client[]> = new Map();

    return {
        name: 'ws-relay-plugin',
        configureServer(server: ViteDevServer) {
            const wss = new WebSocketServer({ noServer: true });

            server.httpServer?.on('upgrade', (request, socket, head) => {
                if (request.url?.startsWith('/ws-relay')) {
                    wss.handleUpgrade(request, socket, head, (ws) => {
                        wss.emit('connection', ws, request);
                    });
                }
            });

            wss.on('connection', (ws, request) => {
                console.log('[WS-Relay] New connection');

                let clientInfo: Client | null = null;

                ws.on('message', (data) => {
                    try {
                        const msg = JSON.parse(data.toString());
                        console.log('[WS-Relay] Message:', msg.type);

                        if (msg.type === 'register') {
                            const { role, roomId } = msg;
                            clientInfo = { ws, role, roomId };

                            if (!clients.has(roomId)) {
                                clients.set(roomId, []);
                            }
                            clients.get(roomId)!.push(clientInfo);

                            ws.send(JSON.stringify({ type: 'registered', role, roomId }));
                            console.log(`[WS-Relay] ${role} registered to room ${roomId}`);

                            // Notify other clients in the room
                            const roomClients = clients.get(roomId)!;
                            roomClients.forEach(c => {
                                if (c.ws !== ws && c.ws.readyState === WebSocket.OPEN) {
                                    c.ws.send(JSON.stringify({ type: 'peer_joined', role }));
                                }
                            });
                        }

                        if (msg.type === 'command' && clientInfo) {
                            // Relay command to other clients in the room
                            const roomClients = clients.get(clientInfo.roomId) || [];
                            roomClients.forEach(c => {
                                if (c.ws !== ws && c.ws.readyState === WebSocket.OPEN) {
                                    c.ws.send(JSON.stringify({ type: 'command', data: msg.data }));
                                }
                            });
                        }
                    } catch (e) {
                        console.error('[WS-Relay] Parse error:', e);
                    }
                });

                ws.on('close', () => {
                    if (clientInfo) {
                        const roomClients = clients.get(clientInfo.roomId);
                        if (roomClients) {
                            const idx = roomClients.indexOf(clientInfo);
                            if (idx !== -1) roomClients.splice(idx, 1);

                            // Notify remaining clients
                            roomClients.forEach(c => {
                                if (c.ws.readyState === WebSocket.OPEN) {
                                    c.ws.send(JSON.stringify({ type: 'peer_left', role: clientInfo!.role }));
                                }
                            });
                        }
                    }
                    console.log('[WS-Relay] Connection closed');
                });
            });

            console.log('[WS-Relay] WebSocket relay ready on /ws-relay');
        }
    };
}
