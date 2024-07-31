import { Markup } from "telegraf"

export const cancelKeyboard = Markup.inlineKeyboard([
    [
        Markup.button.callback("❌ Отменить", "?cancelScene")
    ]
]).resize()

export const understand = Markup.inlineKeyboard([
    [
        Markup.button.callback('❌ Удалить сообщение', '?delete')
    ]
]).resize()