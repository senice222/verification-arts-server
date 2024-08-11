import { Markup } from "telegraf";

const startAction = (bot) => {
    bot.action("?start", async (ctx) => {
        return ctx.editMessageText(`<b>👋🏻 Добро пожаловать, ${ctx.from.username}!</b> \nЗдесь вы можете подать заявку на консультацию по вопросам налоговой проверки.\nВыберите необходимый раздел:`, {
            reply_markup: Markup.inlineKeyboard([
                [
                    Markup.button.callback("Подать заявку", "?apply_application")
                ],
                [
                    Markup.button.callback("Мои заявки", "?myApplications")
                ],
                [
                    Markup.button.callback("Обратиться в поддержку", "?mdfg")
                ]
            ]).resize().reply_markup,
            parse_mode: "HTML"
        });
    })
}

export default startAction;