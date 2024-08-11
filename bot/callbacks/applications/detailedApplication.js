import { Markup } from 'telegraf'
import ApplicationModel from '../../../models/Application.model.js'

const detailedApplication = (bot) => {
    bot.action([/\?detailedApp_(.+)/], async (ctx) => {
        const applicationId = ctx.match[1];
        try {
            const application = await ApplicationModel.findById(applicationId);
            if (!application) {
                await ctx.reply('Заявка не найдена.');
                return;
            }
            const subject = encodeURIComponent(`Вопрос по заявке №${application.normalId}`);
            
            let messageText = `<b>Заявка №${application.normalId}</b>\n<b>Статус: </b>${application.status}`;
            if (application.dateAnswer) {
                messageText += `\nБудет рассмотрена до: ${application.dateAnswer}`;
            }

            const validFiles = application.fileAnswer.filter(file => file.trim() !== '');
            if (application.comments) (
                messageText += `\n---\n<b>Ответ по заявке:</b>\n<b>Комментарии:</b> ${application.comments || 'Нет комментариев'}`
            )
            if (validFiles.length > 0) {
                validFiles.forEach((file, index) => {
                    messageText += `\nФайл ${index + 1}: <a href="https://kvik.cc/api/uploads/${file}">Скачать</a>\n`;
                });
                messageText += `----\nПри возникновении вопросов по заявке обращайтесь на почту adm01@uk-fp.ru. В теме письма укажите “Вопрос по заявке №${application.normalId}”.`
                await ctx.editMessageText(
                    messageText,
                    {
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('Вернуться назад', `?myApplications`)]
                        ]).resize().reply_markup,
                        parse_mode: 'HTML'
                    }
                );
            } else {
                messageText += `----\nПри возникновении вопросов по заявке обращайтесь на почту adm01@uk-fp.ru. В теме письма укажите “Вопрос по заявке №${application.normalId}”.`
                await ctx.editMessageText(messageText,
                    {
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('Вернуться назад', `?myApplications`)]
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