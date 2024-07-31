import { Markup } from "telegraf";

const startAction = (bot) => {
    bot.action("?start", async (ctx) => {
        return ctx.reply("👋 Добро пожаловать!", {
            reply_markup: Markup.inlineKeyboard([
                [
                    Markup.button.callback("Подать заявку", "?apply_application")
                ],
                [
                    Markup.button.callback("Мои заявки", "?my_applications")
                ]
            ]).resize().reply_markup,
            parse_mode: "HTML"
        });
    })
}

export default startAction;