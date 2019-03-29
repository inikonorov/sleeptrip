const { Composer, Markup } = require('micro-bot');

const bot = new Composer();

bot.command('start', ctx =>
    ctx.replyWithMarkdown(
        'За какое кол-во метров тебя необходимо будет разбудить?',
        Markup.keyboard([['5️⃣0️⃣0️⃣ Метров', '1️⃣0️⃣0️⃣0️⃣ Метров']])
            .resize()
            .extra()
    )
);

bot.hears('5️⃣0️⃣0️⃣ Метров', ctx => ctx.reply('500 метров. Понял, принял'));
bot.hears('1️⃣0️⃣0️⃣0️⃣ Метров', ctx => ctx.reply('1000 метров. Понял, принял'));

bot.command('about', ({ reply }) =>
    reply(
        'Привет! Меня зовут sleeptrip, и моя задача - не дать тебе проспать нужную автобусную остановку. Для того, чтобы воспользоваться моими функциями, введи название нужной тебе остановки. Если возникнут вопросы, пиши /help'
    )
);
bot.help(ctx =>
    ctx.reply(
        'Принцип моей работы очень прост. Всё что тебе необходимо сделать - ввести название нужной тебе остановки, я разбужу тебя, если в транспорте тебя поглотит сон!'
    )
);
bot.on('sticker', ({ reply }) => reply('👍'));
// Export bot handler
module.exports = bot;
