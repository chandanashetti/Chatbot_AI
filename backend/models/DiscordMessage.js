const mongoose = require('mongoose');

const DiscordMessageSchema = new mongoose.Schema({
  messageId: { type: String, unique: true, required: true },
  content: { type: String, required: true },
  author: {
    id: String,
    username: String,
    displayName: String,
    avatar: String
  },
  channel: {
    id: String,
    name: String,
    type: String
  },
  guild: {
    id: String,
    name: String,
    icon: String
  },
  timestamp: { type: Date, default: Date.now },
  replied: { type: Boolean, default: false },
  botReply: String,
  manualReply: { type: Boolean, default: false },
  aiGenerated: { type: Boolean, default: false },
  ragUsed: { type: Boolean, default: false },
  usage: {
    prompt_tokens: Number,
    completion_tokens: Number,
    total_tokens: Number
  },
  searchResults: [{
    chunk: {
      id: String,
      content: String,
      metadata: mongoose.Schema.Types.Mixed
    },
    score: Number,
    document: {
      id: String,
      name: String,
      type: String
    }
  }]
});

module.exports = mongoose.model('DiscordMessage', DiscordMessageSchema);