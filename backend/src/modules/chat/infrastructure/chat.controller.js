const { chatService } = require('./chat.container');

async function sendMessage(req, res, next) {
  try {
    const message = await chatService.sendMessage({
      placeId: Number(req.params.id),
      userId: req.user.id,
      content: req.body.content,
    });
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

async function listMessages(req, res, next) {
  try {
    const afterId = req.query.after ? Number(req.query.after) : undefined;
    const messages = await chatService.listMessages({ placeId: Number(req.params.id), afterId });
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

module.exports = { sendMessage, listMessages };
