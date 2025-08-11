import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending'],
    default: 'pending',
  },
  response: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message; 