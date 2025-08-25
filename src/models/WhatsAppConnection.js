import mongoose from 'mongoose';

const whatsAppConnectionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'connecting', 'qr_ready', 'connected', 'failed', 'disconnected'],
        default: 'pending'
    },
    qrCode: {
        type: String,
        default: null
    },
    connectionId: {
        type: String,
        unique: true
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    errorMessage: {
        type: String,
        default: null
    },
    metadata: {
        deviceInfo: String,
        ipAddress: String,
        userAgent: String
    }
}, {
    timestamps: true
});

// Index for faster queries
whatsAppConnectionSchema.index({ userId: 1, status: 1 });
whatsAppConnectionSchema.index({ connectionId: 1 });

// Generate unique connection ID
whatsAppConnectionSchema.pre('save', function (next) {
    if (!this.connectionId) {
        this.connectionId = `wc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    next();
});

// Update last activity on status change
whatsAppConnectionSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        this.lastActivity = new Date();
    }
    next();
});

const WhatsAppConnection = mongoose.models.WhatsAppConnection || mongoose.model('WhatsAppConnection', whatsAppConnectionSchema);

export default WhatsAppConnection;
