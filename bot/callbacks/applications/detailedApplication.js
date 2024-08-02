import { Markup } from 'telegraf'
import ApplicationModel from '../../../models/Application.model.js'

const detailedApplication = (bot) => {
    bot.action([/\?detailedApp_(.+)/], async (ctx) => {
        const applicationId = ctx.match[1]
        try {
            const application = await ApplicationModel.findById(applicationId)
            if (!application) {
                await ctx.reply('Заявка не найдена.')
                return
            }

            let messageText = `Заявка №${application.normalId}\nСтатус: ${application.status}`

            if (application.fileAct) {
                messageText += `\nФайл акт: <a href="${application.fileAct}">Скачать акт</a>`
            }
            if (application.fileExplain) {
                messageText += `\nФайл пояснения: <a href="${application.fileExplain}">Скачать пояснения</a>`
            }

            if (application.fileAnswer.trim() !== '') {
                messageText += `\n---\nКомментарии: ${application.comments}\nФайл: ${application.fileAnswer}`

                await ctx.editMessageText(
                    messageText,
                    {
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('Скачать файл ответа', `download_file_${application._id}`)],
                            [Markup.button.callback('В меню заявок', `?myApplications`)]
                        ]).resize().reply_markup,
                        parse_mode: 'HTML'
                    }
                )
            } else {
                await ctx.editMessageText(messageText,
                    {
                        reply_markup: Markup.inlineKeyboard([
                            Markup.button.callback('Вернуться назад', `?myApplications`)
                        ]).resize().reply_markup,
                        parse_mode: 'HTML'
                    }
                )
            }
        } catch (error) {
            console.error('Error in detailedApplication:', error)
            await ctx.reply('Произошла ошибка при загрузке заявки. Пожалуйста, попробуйте снова.')
        }
    })
}

export default detailedApplication
