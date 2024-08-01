import { Markup } from "telegraf";

const startAction = (bot) => {
    bot.action("?start", async (ctx) => {
        return ctx.editMessageText("👋 Добро пожаловать!", {
            reply_markup: Markup.inlineKeyboard([
                [
                    Markup.button.callback("Подать заявку", "?apply_application")
                ],
                [
                    Markup.button.callback("Мои заявки", "?myApplications")
                ]
            ]).resize().reply_markup,
            parse_mode: "HTML"
        });
    })
}

export default startAction;