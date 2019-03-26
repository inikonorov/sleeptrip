const { Composer } = require('micro-bot');

const bot = new Composer();

bot.start(ctx => ctx.reply('Welcome1'));
bot.help(ctx => ctx.reply('Help message'));
bot.hears('hi', ({ reply }) => reply('Hello'));
bot.on('sticker', ({ reply }) => reply('👍'));

// Export bot handler
module.exports = bot;
