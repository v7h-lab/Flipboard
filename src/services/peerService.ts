import Peer, { DataConnection } from 'peerjs';

export type RemoteCommand =
    | { type: 'UPDATE_MESSAGE'; payload: string }
    | { type: 'SET_THEME'; payload: 'dark' | 'light' }
    | { type: 'SET_SOUND'; payload: 'default' | 'mechanical' };

// Explicit STUN/TURN config for better NAT traversal
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

class PeerService {
    private peer: Peer | null = null;
    private conn: DataConnection | null = null;
    private onDataCallback: ((data: RemoteCommand) => void) | null = null;
    private onStatusCallback: ((status: string) => void) | null = null;
    public status: string = 'disconnected';
    public targetHostId: string = '';

    private log(msg: string) {
        console.log(`[PeerService] ${msg}`);
    }

    private updateStatus(s: string) {
        this.log(`Status -> ${s}`);
        this.status = s;
        if (this.onStatusCallback) this.onStatusCallback(s);
    }

    public onStatus(cb: (status: string) => void) {
        this.onStatusCallback = cb;
        cb(this.status);
    }

    // Initialize as HOST
    public initHost(): Promise<string> {
        if (this.peer) {
            this.log("Host already initialized: " + this.peer.id);
            if (this.peer.id) this.updateStatus('host_ready');
            return Promise.resolve(this.peer.id || '');
        }

        return new Promise((resolve, reject) => {
            this.updateStatus('initializing_host');
            this.log('Creating HOST peer with ICE config...');

            this.peer = new Peer({
                config: ICE_SERVERS,
                debug: 3 // Maximum debug logging
            });

            this.peer.on('open', (id) => {
                this.log('HOST open with ID: ' + id);
                this.updateStatus('host_ready:' + id.substring(0, 8));
                resolve(id);
            });

            this.peer.on('connection', (conn) => {
                this.log('INCOMING connection from: ' + conn.peer);
                this.conn = conn;
                this.setupConnectionHandlers();

                if (conn.open) {
                    this.log('Connection already open on receive');
                    this.updateStatus('connected');
                } else {
                    conn.on('open', () => {
                        this.log('Host: DataConnection now open');
                        this.updateStatus('connected');
                    });
                }
            });

            this.peer.on('error', (err) => {
                this.log('Peer error: ' + err.type + ' - ' + err.message);
                this.updateStatus('error:' + err.type);
                reject(err);
            });

            this.peer.on('disconnected', () => {
                this.log('Peer disconnected from server');
            });
        });
    }

    // Initialize as REMOTE and connect to Host
    public connectToHost(hostId: string): Promise<void> {
        if (this.peer) {
            this.log("Already processing connection");
            return Promise.resolve();
        }

        this.targetHostId = hostId;

        return new Promise((resolve, reject) => {
            this.updateStatus('init_remote');
            this.log('Creating REMOTE peer with ICE config...');
            this.log('Target HOST ID: ' + hostId);

            this.peer = new Peer({
                config: ICE_SERVERS,
                debug: 3
            });

            this.peer.on('open', (myId) => {
                if (!this.peer) return;

                this.log(`REMOTE peer opened: ${myId}`);
                this.log(`Now connecting to HOST: ${hostId}`);
                this.updateStatus('connecting:' + hostId.substring(0, 8));

                this.conn = this.peer.connect(hostId, {
                    reliable: true,
                    serialization: 'json'
                });

                this.log('DataConnection created, waiting for open...');

                const timeout = setTimeout(() => {
                    if (this.status.startsWith('connecting')) {
                        this.log('TIMEOUT - host ID may be wrong or unreachable');
                        this.updateStatus('timeout:check_host_id');
                    }
                }, 10000);

                this.conn.on('open', () => {
                    clearTimeout(timeout);
                    this.log('SUCCESS - connected to host!');
                    this.updateStatus('connected');
                    resolve();
                });

                this.conn.on('error', (err) => {
                    clearTimeout(timeout);
                    this.log('DataConnection error: ' + String(err));
                    this.updateStatus('conn_error');
                    reject(err);
                });

                this.conn.on('close', () => {
                    this.log('DataConnection closed');
                    this.updateStatus('disconnected');
                });
            });

            this.peer.on('error', (err) => {
                this.log('Peer error: ' + err.type + ' - ' + err.message);
                // Check for specific error types
                if (err.type === 'peer-unavailable') {
                    this.updateStatus('host_not_found');
                } else {
                    this.updateStatus('peer_error:' + err.type);
                }
                reject(err);
            });

            this.peer.on('disconnected', () => {
                this.log('Peer disconnected from signaling server');
            });
        });
    }

    public sendCommand(command: RemoteCommand) {
        this.log('sendCommand: ' + command.type);
        if (this.conn && this.conn.open) {
            this.conn.send(command);
            this.log('Sent OK');
        } else {
            this.log('FAILED - connection not open');
        }
    }

    public onCommand(callback: (data: RemoteCommand) => void) {
        this.onDataCallback = callback;
    }

    private setupConnectionHandlers() {
        if (!this.conn) return;

        this.conn.on('data', (data) => {
            this.log('Received: ' + JSON.stringify(data));
            if (this.onDataCallback) {
                this.onDataCallback(data as RemoteCommand);
            }
        });

        this.conn.on('close', () => {
            this.log("Connection closed");
            this.updateStatus('disconnected');
        });

        this.conn.on('error', (err) => {
            this.log("Connection error: " + String(err));
            this.updateStatus('error');
        });
    }

    public destroy() {
        if (this.conn) this.conn.close();
        if (this.peer) this.peer.destroy();
        this.peer = null;
        this.conn = null;
        this.status = 'disconnected';
    }
}

export const peerService = new PeerService();
