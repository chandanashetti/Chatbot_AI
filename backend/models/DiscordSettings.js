const mongoose = require('mongoose');

const DiscordSettingsSchema = new mongoose.Schema({
  guildId: String, // null for global settings
  autoReply: { type: Boolean, default: true },
  useRAG: { type: Boolean, default: true },
  triggerWords: [{ type: String, default: ['bot', 'help', '?', 'question'] }],
  responseDelay: { type: Number, default: 1000 }, // milliseconds
  systemPrompt: { 
    type: String, 
    default: 'You are a helpful Discord bot assistant. Provide concise, friendly responses.'
  },
  isDefault: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('DiscordSettings', DiscordSettingsSchema);