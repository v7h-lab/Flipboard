/**
 * Unified Connection Service
 * 
 * Automatically selects the appropriate connection mode:
 * - Production: Uses PeerJS (WebRTC peer-to-peer)
 * - Development: Uses WebSocket relay through Vite dev server
 * 
 * Manual override available for testing PeerJS locally.
 */

import { relayService, RemoteCommand } from './relayService';
import { peerService } from './peerService';

export type ConnectionMode = 'websocket' | 'peerjs';
export type { RemoteCommand } from './relayService';

type StatusCallback = (status: string) => void;
type CommandCallback = (cmd: RemoteCommand) => void;

// Auto-detect environment
const isProduction = import.meta.env.PROD;
const defaultMode: ConnectionMode = isProduction ? 'peerjs' : 'websocket';

class ConnectionService {
    private mode: ConnectionMode = defaultMode;
    private onStatusCallback: StatusCallback | null = null;
    private onCommandCallback: CommandCallback | null = null;
    public status: string = 'disconnected';
    public roomId: string = '';

    constructor() {
        console.log(`[ConnectionService] Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
        console.log(`[ConnectionService] Default mode: ${defaultMode}`);
    }

    private log(msg: string) {
        console.log(`[ConnectionService:${this.mode}] ${msg}`);
    }

    public getMode(): ConnectionMode {
        return this.mode;
    }

    public isProduction(): boolean {
        return isProduction;
    }

    public setMode(mode: ConnectionMode) {
        this.log(`Setting mode to: ${mode}`);
        this.mode = mode;
        // Re-register callbacks with the new service
        if (this.onStatusCallback) {
            this.registerStatusCallback();
        }
        if (this.onCommandCallback) {
            this.registerCommandCallback();
        }
    }

    private registerStatusCallback() {
        if (!this.onStatusCallback) return;
        const cb = this.onStatusCallback;

        if (this.mode === 'websocket') {
            relayService.onStatus((s) => {
                this.status = s;
                cb(s);
            });
        } else {
            peerService.onStatus((s) => {
                this.status = s;
                cb(s);
            });
        }
    }

    private registerCommandCallback() {
        if (!this.onCommandCallback) return;

        if (this.mode === 'websocket') {
            relayService.onCommand(this.onCommandCallback);
        } else {
            peerService.onCommand(this.onCommandCallback);
        }
    }

    public onStatus(cb: StatusCallback) {
        this.onStatusCallback = cb;
        this.registerStatusCallback();
    }

    public onCommand(cb: CommandCallback) {
        this.onCommandCallback = cb;
        this.registerCommandCallback();
    }

    public async initHost(): Promise<string> {
        this.log('Initializing as HOST');

        if (this.mode === 'websocket') {
            this.roomId = await relayService.initHost();
        } else {
            this.roomId = await peerService.initHost();
        }

        return this.roomId;
    }

    public async connectToHost(roomId: string): Promise<void> {
        this.log(`Connecting to HOST: ${roomId}`);

        if (this.mode === 'websocket') {
            await relayService.connectToHost(roomId);
        } else {
            await peerService.connectToHost(roomId);
        }
    }

    public sendCommand(command: RemoteCommand) {
        this.log(`Sending: ${command.type}`);

        if (this.mode === 'websocket') {
            relayService.sendCommand(command);
        } else {
            peerService.sendCommand(command);
        }
    }

    public destroyAll() {
        // Destroy both services when switching modes
        relayService.destroy();
        peerService.destroy();
        this.status = 'disconnected';
    }
}

export const connectionService = new ConnectionService();
