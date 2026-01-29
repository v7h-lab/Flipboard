import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { webSocketRelayPlugin } from './vite-ws-relay-plugin'

export default defineConfig({
    plugins: [react(), webSocketRelayPlugin()],
})
