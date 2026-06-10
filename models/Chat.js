const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  readAt: Date,
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // soft delete for individuals
}, { timestamps: true });

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: String },
  lastMessageTime: Date,
  unreadCount: { type: Map, of: Number }, // userId -> unread count
}, { timestamps: true });

module.exports = {
  Message: mongoose.model('Message', messageSchema),
  Conversation: mongoose.model('Conversation', conversationSchema)
};