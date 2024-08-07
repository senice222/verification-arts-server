import { Markup } from 'telegraf'
import ApplicationModel from '../../../models/Application.model.js'
import iconv from 'iconv-lite'

const detailedApplication = (bot) => {
    bot.action([/\?detailedApp_(.+)/], async (ctx) => {
        const applicationId = ctx.match[1];
        try {
            const application = await ApplicationModel.findById(applicationId);
            if (!application) {
                await ctx.reply('Заявка не найдена.');
                return;
            }

            let messageText = `<b>Заявка №${application.normalId}</b>\nСтатус: ${application.status}\n-\n<b>Приложенные файлы:</b>`;
            if (application.dateAnswer) {
                messageText += `\nДата ответа: ${application.dateAnswer}`;
            }
            if (application.fileAct) {
                messageText += `\nАкт: <a href="${application.fileAct}">скачать</a>`;
            }
            if (application.fileExplain) {
                messageText += `\nПояснения: <a href="${application.fileExplain}">скачать</a>`;
            }

            const validFiles = application.fileAnswer.filter(file => file.trim() !== '');
            if (application.comments) (
                messageText += `\n---\n<b>Ответ по заявке:</b>\nКомментарии: ${application.comments || 'Нет комментариев'}`
            )
            if (validFiles.length > 0) {
                messageText += `\nФайлы:`;
                validFiles.forEach(file => {
                    messageText += `\n<a href="https://expample.com/${file}">Скачать ${file}</a>`;
                });

                await ctx.editMessageText(
                    messageText,
                    {
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('В меню заявок', `?myApplications`)]
                        ]).resize().reply_markup,
                        parse_mode: 'HTML'
                    }
                );
            } else {
                await ctx.editMessageText(messageText,
                    {
                        reply_markup: Markup.inlineKeyboard([
                            Markup.button.callback('Вернуться назад', `?myApplications`)
                        ]).resize().reply_markup,
                        parse_mode: 'HTML'
                    }
                );
            }
        } catch (error) {
            console.error('Error in detailedApplication:', error);
            await ctx.reply('Произошла ошибка при загрузке заявки. Пожалуйста, попробуйте снова.');
        }
    });
};




export default detailedApplication