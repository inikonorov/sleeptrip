const { Composer, Markup, Extra } = require('micro-bot');

const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

const bot = new Composer();

// массив расстояний до остановки
const distances = ['500', '1000'];

// телефон пользователя
let userPhone = '';

// выбранное пользователем расстояние
let choosedDistance = 0;

// координаты выбранного пользователем пункта назначения
let destinationPointCoords = {};

// координаты пользователя (live location)
let liveLocationCoords = {};

// флаг того, что посылается live location
let isLiveLocation = false;

// флаг того, что пользователю позвонили
let isCallCompleted = false;

// функция сброса значений переменных
const resetVariables = () => {
    isLiveLocation = false;
    isCallCompleted = false;
    liveLocationCoords = {};
    destinationPointCoords = {};
    choosedDistance = 0;
};

// функция расчета расстояния между двумя точками по координатам
const haversine = (liveLocationCoords, destinationPointCoords) => {
    // радиус земли
    const R = 6378.137;

    // разница между широтами координат в радианах
    const dLat = ((destinationPointCoords.latitude - liveLocationCoords.latitude) * Math.PI) / 180;

    // разница между долготами координат в радианах
    const dLon =
        ((destinationPointCoords.longitude - liveLocationCoords.longitude) * Math.PI) / 180;

    // расчет расстояния
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((liveLocationCoords.latitude * Math.PI) / 180) *
            Math.cos((destinationPointCoords.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
};

// ловим команду старт
bot.command('start', ctx => {
    // сбрасываем значения переменных
    resetVariables();

    return ctx.reply(
        'Могу ли я получить твой номер телефона?',
        Extra.markup(markup => {
            return markup.resize().keyboard([markup.contactRequestButton('Поделиться телефоном')]);
        })
    );
});

// ловим контакт
bot.on('contact', ctx => {
    // проверяем, что мы действительно поделились контактом
    if (ctx.update.message.from.id === ctx.update.message.contact.user_id) {
        userPhone = ctx.update.message.contact.phone_number;

        ctx.reply('Спасибо, что поделился телефоном! ', Markup.removeKeyboard().extra());

        ctx.replyWithMarkdown(
            'За какое количество метров до пункта назначения тебя необходимо будет разбудить?',
            Markup.keyboard([distances])
                .resize()
                .extra()
        );
    } else {
        ctx.reply('Ты отправил не свой номер телефона, попробуй еще раз!');
    }
});

// ловим вброс локации от пользователя
// нужно придумать более точный алгоритм различения location и live location
bot.on('location', ctx => {
    // если это live location, то
    if (isLiveLocation) {
        // переключаем флаг
        isLiveLocation = false;

        // выкидываем сообщение пользователю
        ctx.reply('Ты включил Live Location!');
    } else {
        // получаем координаты
        destinationPointCoords = ctx.update.message.location;

        // переключаем флаг
        isLiveLocation = true;

        // выкидываем сообщение пользователю
        ctx.reply('Прикрепи Live Location!');
    }
});

// ловим изменяемое сообщение
bot.on('edited_message', ctx => {
    // если изменяемое сообщение типа "live location"
    if (ctx.editedMessage.location && !isCallCompleted) {
        // координаты live location
        liveLocationCoords = ctx.editedMessage.location;

        // расстояние между live location и указанным пунктом назначения
        const distanceBetweenPoints = haversine(liveLocationCoords, destinationPointCoords);

        // если это расстояние меньше чем указанное пользователем, то будим пользователя
        if (distanceBetweenPoints < choosedDistance) {
            isCallCompleted = true;

            // выполняем звонок
            twilio.calls.create({
                url: 'http://demo.twilio.com/docs/voice.xml',
                to: userPhone,
                from: '+15102395065',
            });
        } else {
            isCallCompleted = false;

            ctx.reply(`Дистанция до остановки: ${distanceBetweenPoints}`);
        }
    }
});

// ловим одну из предложенных кнопок с указанием дистанции до остановки
bot.hears(distances, ctx => {
    // сохраняем выбранную дистанцию
    choosedDistance = ctx.update.message.text;

    ctx.reply(
        `Окей, разбужу тебя за ${choosedDistance} метров до остановки!`,
        Markup.removeKeyboard().extra()
    );
    ctx.reply('Прикрепи локацию, до которой ты едешь!');
});

// ловим команду /about
bot.command('about', ({ reply }) =>
    reply(
        'Привет! Меня зовут sleeptrip, и моя задача - не дать тебе проспать нужную автобусную остановку. Для того, чтобы воспользоваться моими функциями, введи название нужной тебе остановки. Если возникнут вопросы, пиши /help'
    )
);

// ловим команду /help
bot.help(ctx =>
    ctx.reply(
        'Принцип моей работы очень прост. Всё что тебе необходимо сделать - ввести название нужной тебе остановки, я разбужу тебя, если в транспорте тебя поглотит сон!'
    )
);

// Export bot handler
module.exports = bot;
