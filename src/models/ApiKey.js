import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const apiKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: () => 'sk_' + nanoid(32)
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    default: 'API Key'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: null
  },
  permissions: {
    type: [String],
    default: ['read', 'write']
  }
}, {
  timestamps: true
});

// Index for efficient queries
apiKeySchema.index({ userId: 1, isActive: 1 });
apiKeySchema.index({ key: 1 });

// Generate a new API key
apiKeySchema.statics.generateKey = function() {
  try {
    return 'sk_' + nanoid(32);
  } catch (error) {
    console.error('Error generating nanoid:', error);
    // Fallback to a different method if nanoid fails
    return 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};

// Create API key for user
apiKeySchema.statics.createForUser = async function(userId, name = 'API Key') {
  try {
    console.log('Creating API key for user:', userId, 'with name:', name);
    
    const key = this.generateKey();
    console.log('Generated key:', key.substring(0, 10) + '...');
    
    const apiKey = new this({
      userId,
      name,
      key: key
    });
    
    const savedApiKey = await apiKey.save();
    console.log('API key saved successfully:', savedApiKey._id);
    
    return savedApiKey;
  } catch (error) {
    console.error('Error creating API key:', error);
    throw error;
  }
};

// Find active keys for user
apiKeySchema.statics.findActiveByUser = function(userId) {
  return this.find({ userId, isActive: true }).sort({ createdAt: -1 });
};

// Validate API key
apiKeySchema.statics.validateKey = async function(key) {
  const apiKey = await this.findOne({ key, isActive: true });
  if (apiKey) {
    apiKey.lastUsed = new Date();
    await apiKey.save();
  }
  return apiKey;
};

const ApiKey = mongoose.models.ApiKey || mongoose.model('ApiKey', apiKeySchema);

export default ApiKey; 