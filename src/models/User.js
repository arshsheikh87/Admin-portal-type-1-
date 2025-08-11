import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  apiKey: {
    type: String,
    default: null,
  },
  apiKeyGeneratedAt: {
    type: Date,
    default: null,
  },
  credits: {
    type: Number,
    default: 10,
    min: 0,
  },
}, {
  timestamps: true,
});

// Generate API key method
userSchema.methods.generateApiKey = function() {
  const apiKey = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  this.apiKey = apiKey;
  this.apiKeyGeneratedAt = new Date();
  return apiKey;
};

// Check if user has enough credits
userSchema.methods.hasEnoughCredits = function(requiredCredits = 1) {
  return this.credits >= requiredCredits;
};

// Consume credits (deduct credits)
userSchema.methods.consumeCredits = function(amount = 1) {
  if (this.credits >= amount) {
    this.credits -= amount;
    return true;
  }
  return false;
};

// Add credits
userSchema.methods.addCredits = function(amount = 1) {
  this.credits += amount;
  return this.credits;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 