import mongoose from 'mongoose';

const webhookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const Webhook = mongoose.models.Webhook || mongoose.model('Webhook', webhookSchema);

export default Webhook; 