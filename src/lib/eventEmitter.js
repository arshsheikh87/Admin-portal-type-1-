import { EventEmitter } from 'events';

class WhatsAppEventEmitter extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100); // Allow many listeners
    }

    // Emit WhatsApp connect event
    emitWhatsAppConnect(userId, connectionId) {
        this.emit('whatsapp:connect', { userId, connectionId });
    }

    // Emit WhatsApp disconnect event
    emitWhatsAppDisconnect(userId) {
        this.emit('whatsapp:disconnect', { userId });
    }

    // Listen for WhatsApp connect events
    onWhatsAppConnect(callback) {
        this.on('whatsapp:connect', callback);
    }

    // Listen for WhatsApp disconnect events
    onWhatsAppDisconnect(callback) {
        this.on('whatsapp:disconnect', callback);
    }

    // Remove all listeners
    removeAllListeners() {
        this.removeAllListeners('whatsapp:connect');
        this.removeAllListeners('whatsapp:disconnect');
    }
}

// Create singleton instance
const whatsAppEventEmitter = new WhatsAppEventEmitter();

export default whatsAppEventEmitter;
