import { BoardState } from '../constants';

export type RemoteCommand =
    | { type: 'UPDATE_MESSAGE'; payload: string }
    | { type: 'UPDATE_BOARD'; payload: BoardState }
    | { type: 'SET_THEME'; payload: 'dark' | 'light' }
    | { type: 'SET_SOUND'; payload: 'loud' | 'subtle' };

type StatusCallback = (status: string) => void;
type CommandCallback = (cmd: RemoteCommand) => void;

class RelayService {
    private ws: WebSocket | null = null;
    private onStatusCallback: StatusCallback | null = null;
    private onCommandCallback: CommandCallback | null = null;
    public status: string = 'disconnected';
    public roomId: string = '';
    public role: 'host' | 'remote' = 'host';

    private log(msg: string) {
        console.log(`[RelayService] ${msg}`);
    }

    private updateStatus(s: string) {
        this.log(`Status -> ${s}`);
        this.status = s;
        if (this.onStatusCallback) this.onStatusCallback(s);
    }

    public onStatus(cb: StatusCallback) {
        this.onStatusCallback = cb;
        cb(this.status);
    }

    public onCommand(cb: CommandCallback) {
        this.onCommandCallback = cb;
    }

    private getWsUrl(): string {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws-relay`;
    }

    public initHost(): Promise<string> {
        this.role = 'host';
        // Generate a simple room ID
        this.roomId = Math.random().toString(36).substring(2, 10);

        return new Promise((resolve, reject) => {
            this.updateStatus('connecting');
            this.log('Connecting to relay as HOST...');

            try {
                this.ws = new WebSocket(this.getWsUrl());
            } catch (e) {
                this.log('WebSocket creation failed: ' + e);
                this.updateStatus('error');
                reject(e);
                return;
            }

            this.ws.onopen = () => {
                this.log('WebSocket connected, registering as host...');
                this.ws!.send(JSON.stringify({
                    type: 'register',
                    role: 'host',
                    roomId: this.roomId
                }));
            };

            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    this.log('Received: ' + msg.type);

                    if (msg.type === 'registered') {
                        this.log('Host registered in room: ' + msg.roomId);
                        this.updateStatus('host_ready');
                        resolve(this.roomId);
                    }

                    if (msg.type === 'peer_joined') {
                        this.log('Remote joined!');
                        this.updateStatus('connected');
                    }

                    if (msg.type === 'peer_left') {
                        this.log('Remote left');
                        this.updateStatus('host_ready');
                    }

                    if (msg.type === 'command' && this.onCommandCallback) {
                        this.log('Command received: ' + msg.data.type);
                        this.onCommandCallback(msg.data as RemoteCommand);
                    }
                } catch (e) {
                    this.log('Message parse error: ' + e);
                }
            };

            this.ws.onerror = (e) => {
                this.log('WebSocket error');
                this.updateStatus('error');
                reject(e);
            };

            this.ws.onclose = () => {
                this.log('WebSocket closed');
                this.updateStatus('disconnected');
            };
        });
    }

    public connectToHost(roomId: string): Promise<void> {
        this.role = 'remote';
        this.roomId = roomId;

        return new Promise((resolve, reject) => {
            this.updateStatus('connecting');
            this.log('Connecting to relay as REMOTE...');

            try {
                this.ws = new WebSocket(this.getWsUrl());
            } catch (e) {
                this.log('WebSocket creation failed: ' + e);
                this.updateStatus('error');
                reject(e);
                return;
            }

            this.ws.onopen = () => {
                this.log('WebSocket connected, joining room: ' + roomId);
                this.ws!.send(JSON.stringify({
                    type: 'register',
                    role: 'remote',
                    roomId: roomId
                }));
            };

            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    this.log('Received: ' + msg.type);

                    if (msg.type === 'registered') {
                        this.log('Remote registered in room: ' + msg.roomId);
                        this.updateStatus('connected');
                        resolve();
                    }

                    if (msg.type === 'peer_left') {
                        this.log('Host left');
                        this.updateStatus('host_disconnected');
                    }

                    if (msg.type === 'command' && this.onCommandCallback) {
                        this.onCommandCallback(msg.data as RemoteCommand);
                    }
                } catch (e) {
                    this.log('Message parse error: ' + e);
                }
            };

            this.ws.onerror = (e) => {
                this.log('WebSocket error');
                this.updateStatus('error');
                reject(e);
            };

            this.ws.onclose = () => {
                this.log('WebSocket closed');
                this.updateStatus('disconnected');
            };
        });
    }

    public sendCommand(command: RemoteCommand) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'command',
                data: command
            }));
            this.log('Command sent: ' + command.type);
        } else {
            this.log('Cannot send - WebSocket not open');
        }
    }

    public destroy() {
        if (this.ws) this.ws.close();
        this.ws = null;
        this.status = 'disconnected';
    }
}

export const relayService = new RelayService();
