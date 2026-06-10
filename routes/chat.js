const express = require('express');
const { protect } = require('../middleware/auth');
const { Message, Conversation } = require('../models/Chat');
const User = require('../models/User');

const router = express.Router();

// Get all conversations for logged-in user
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate('participants', 'name role')
    .sort('-lastMessageTime');
    
    // format for frontend
    const formatted = conversations.map(conv => {
      const otherUser = conv.participants.find(p => p._id.toString() !== req.user._id.toString());
      return {
        id: conv._id,
        otherUserId: otherUser._id,
        otherUserName: otherUser.name,
        otherUserRole: otherUser.role,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount.get(req.user._id.toString()) || 0
      };
    });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get or create conversation between two users
router.get('/conversation/:userId', protect, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, otherUserId] }
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, otherUserId],
        unreadCount: new Map()
      });
    }
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages for a conversation
router.get('/messages/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const messages = await Message.find({
      $or: [
        { sender: conversation.participants[0], receiver: conversation.participants[1] },
        { sender: conversation.participants[1], receiver: conversation.participants[0] }
      ]
    }).populate('sender receiver', 'name role').sort('createdAt');
    
    // Mark messages as read
    await Message.updateMany(
      { receiver: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    // reset unread count for this user in conversation
    conversation.unreadCount.set(req.user._id.toString(), 0);
    await conversation.save();
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send a message
router.post('/send', protect, async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    if (!receiverId || !message) {
      return res.status(400).json({ message: 'Receiver and message required' });
    }
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: 'User not found' });
    
    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, receiverId] }
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, receiverId],
        unreadCount: new Map()
      });
    }
    
    // Create message
    const newMsg = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      message,
      read: false
    });
    
    // Update conversation last message and unread count
    conversation.lastMessage = message;
    conversation.lastMessageTime = new Date();
    const currentUnread = conversation.unreadCount.get(receiverId) || 0;
    conversation.unreadCount.set(receiverId, currentUnread + 1);
    await conversation.save();
    
    const populatedMsg = await Message.findById(newMsg._id).populate('sender receiver', 'name role');
    
    // Emit socket event for real-time
    const io = req.app.get('io');
    io.to(receiverId.toString()).emit('new_message', populatedMsg);
    io.to(req.user._id.toString()).emit('message_sent', populatedMsg);
    
    res.status(201).json(populatedMsg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users that current user can chat with (based on role)
router.get('/users', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'vendor') {
      // vendor can only chat with admin and PMA
      filter = { role: { $in: ['admin', 'pma'] } };
    } else if (req.user.role === 'pma') {
      // PMA can chat with admin and vendors
      filter = { role: { $in: ['admin', 'vendor'] } };
    } else if (req.user.role === 'admin') {
      // admin can chat with everyone
      filter = {};
    }
    const users = await User.find(filter).select('name role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;