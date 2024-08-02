import { Markup } from "telegraf"
import ApplicationModel from "../../../../models/Application.model.js"


const done = (bot) => {
    bot.action([/done_(.+)/], async (ctx) => {
        const applicationId = ctx.match[1]

        ctx.session.collectingClarifications = false

        const clarifications = ctx.session.clarifications

        try {
            const application = await ApplicationModel.findById(applicationId)
            if (!application) {
                return ctx.reply('Application not found')
            }
            const result = clarifications.reduce((acc, item) => {
                if (item.type === 'text') {
                    acc.text.push(item.content)
                } else if (item.type === 'document' || item.type === 'photo') {
                    acc.files.push(item.fileUrl.href)
                }
                return acc
            }, { text: [], files: [] })
            
            const textAnswer = result.text.join('\n')
            const obj = {
                text: textAnswer,
                files: result.files
            }
        
            application.clarificationsAnswer = obj
            await application.save()

            await ctx.reply(`Уточнения по заявке №${application.normalId} отправлены.`, {
                reply_markup: Markup.inlineKeyboard([
                    Markup.button.callback('Перейти к заявке', `?detailedApp_${applicationId}`)
                ]).resize().reply_markup
            })
        } catch (error) {
            console.error('Error saving clarifications:', error)
            await ctx.reply('Error saving clarifications')
        }

        ctx.session.clarifications = []
    })
}
export default done