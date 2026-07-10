const prisma = require('../../../database/prisma.client');
const { placeRepository } = require('../../places/infrastructure/places.container');
const MessageRepository = require('./chat.repository');
const ChatService = require('../application/chat.service');

const messageRepository = new MessageRepository(prisma);
const chatService = new ChatService({ messageRepository, placeRepository });

module.exports = { messageRepository, chatService };
