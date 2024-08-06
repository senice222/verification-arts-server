import { Markup } from "telegraf"
import ApplicationModel from "../../../../models/Application.model.js"
import { sendMail } from "../../../../utils/sendMail.js";

const done = (bot) => {
    bot.action([/done_(.+)/], async (ctx) => {
        const applicationId = ctx.match[1];

        ctx.session.collectingClarifications = false;
        const clarifications = ctx.session.clarifications;

        try {
            const application = await ApplicationModel.findById(applicationId);
            if (!application) {
                return ctx.reply('Application not found');
            }
            
            const newClarifications = clarifications.reduce((acc, item) => {
                if (item.type === 'text') {
                    acc.text.push(item.content);
                } else if (item.type === 'document' || item.type === 'photo') {
                    acc.files.push(item.fileUrl.href);
                }
                return acc;
            }, { text: [], files: [] });

            const combinedClarifications = {
                text: newClarifications.text.filter(Boolean).join('\n'),
                files: newClarifications.files.filter(Boolean)
            };

            application.status = "На рассмотрении";
            application.clarificationsAnswer = combinedClarifications;
            sendMail(`Уточнения получены по заявке ${application.normalId}`, `http://localhost:5173/application/${application._id}`)
            await application.save();

            await ctx.reply(`Уточнения по заявке №${application.normalId} отправлены.`, {
                reply_markup: Markup.inlineKeyboard([
                    Markup.button.callback('Перейти к заявке', `?detailedApp_${applicationId}`)
                ]).resize().reply_markup
            });
        } catch (e) {
            console.log("Error:", e);
            ctx.reply('Произошла ошибка при обработке уточнений.');
        }

        ctx.session.clarifications = [];
    });
}
export default done