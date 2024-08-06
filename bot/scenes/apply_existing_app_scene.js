import { Markup, Scenes } from "telegraf"
import { cancelKeyboard } from "./keyboard.js"
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import UserModel from "../../models/User.model.js"
import ApplicationModel from "../../models/Application.model.js"
import { sendMail } from "../../utils/sendMail.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const filePath = path.join(__dirname, '../../utils/ПАМЯТКА.docx');

const baseDirectory = join(__dirname, '..', '..', 'api', 'uploads');

if (!fs.existsSync(baseDirectory)) {
    fs.mkdirSync(baseDirectory, { recursive: true });
}

const ApplyExistingApplication = new Scenes.WizardScene(
    'apply_existing_application',
    async ctx => {
        ctx.wizard.state.deleteMessages = [];
        ctx.wizard.state.data = {};

        try {
            const fileMsg = await ctx.replyWithDocument({ source: filePath }, {
                caption: 'Памятка',
                reply_markup: Markup.inlineKeyboard([
                    Markup.button.callback('Ознакомлен', '?acknowledge')
                ]).resize().reply_markup
            });

            ctx.wizard.state.deleteMessages.push(fileMsg.message_id);
            ctx.wizard.next();
        }
        catch (error) {
            console.error('Error in step 3:', error);
        }
    },
    async ctx => {
        const { applicationId } = ctx.scene.state;
        try {
            if (ctx.updateType === 'callback_query') {
                if (ctx.update.callback_query.data === '?acknowledge') {
                    const application = await ApplicationModel.findById(applicationId);
                    if (!application) {
                        await ctx.reply('Заявка не найдена. Пожалуйста, попробуйте снова.');
                        return ctx.scene.leave();
                    }

                    const msg = await ctx.reply(
                        `<b>⚙️ Отправьте файл акта для компании ${application.name}\n(ИНН ${application.inn}):</b>`,
                        {
                            reply_markup: cancelKeyboard.reply_markup,
                            parse_mode: 'HTML',
                        }
                    );
                    ctx.wizard.state.deleteMessages.push(msg.message_id);
                    ctx.wizard.next();
                }
            }
        } catch (error) {
            console.error('Error in step 1:', error);
            await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте снова.');
            ctx.scene.leave();
        }
    },
    async ctx => {
        if (ctx.message.document) {
            const file = ctx.message.document;

            try {
                const fileUrl = await ctx.telegram.getFileLink(file.file_id);
                ctx.wizard.state.data.fileAct = fileUrl
                const msg = await ctx.reply(
                    '<b>⚙️ Отправьте файл с пояснениями:</b>',
                    {
                        reply_markup: cancelKeyboard.reply_markup,
                        parse_mode: 'HTML',
                    }
                );
                ctx.wizard.state.deleteMessages.push(msg.message_id);
                ctx.wizard.next();
            } catch (err) {
                console.error('Error during file download:', err);
                await ctx.reply('Произошла ошибка при сохранении файла. Попробуйте снова.');
            }
        } else if (ctx.message.photo) {
            const msg = await ctx.reply('Пожалуйста, отправьте файл, а не картинку.');
            ctx.wizard.state.deleteMessages.push(msg.message_id);
        } else {
            const msg = await ctx.reply('Пожалуйста, отправьте файл.');
            ctx.wizard.state.deleteMessages.push(msg.message_id);
        }
    },
    async ctx => {
        if (ctx.message.document) {
            const file = ctx.message.document;

            try {
                const fileUrl = await ctx.telegram.getFileLink(file.file_id)
                ctx.wizard.state.data.fileExplain = fileUrl
                ctx.wizard.state.data.owner = ctx.from.id
                const user = await UserModel.findOne({ id: ctx.from.id })
                const application = await ApplicationModel.findById(ctx.scene.state.applicationId);
                if (!application) {
                    await ctx.reply('Заявка не найдена. Пожалуйста, попробуйте снова.');
                    return ctx.scene.leave();
                }

                const body = {
                    owner: ctx.from.id,
                    name: application.name,
                    inn: application.inn,
                    fileAct: ctx.wizard.state.data.fileAct,
                    fileExplain: ctx.wizard.state.data.fileExplain
                }
                const doc = new ApplicationModel(body)
                await doc.save()
                user.applications.push(application._id)
                await user.save()
                sendMail('Новая заявка!', `http://localhost:5173/application/${doc._id}`)
                await ctx.reply(
                    `<b>Заявка №${doc.normalId} создана!</b>\nВ ближайшее время мы сообщим\nВам время рассмотрения заявки`,
                    {
                        reply_markup: Markup.inlineKeyboard([
                            Markup.button.callback('Перейти к заявке', `?detailedApp_${doc._id}`)
                        ]).resize().reply_markup,
                        parse_mode: 'HTML',
                    }
                )

                ctx.wizard.state.deleteMessages.forEach(item => ctx.deleteMessage(item))
                ctx.scene.leave()
            } catch (err) {
                console.error('Error during file processing:', err);
                const msg = await ctx.reply('<b>Произошла ошибка при сохранении файла. Попробуйте снова.</b>', { parse_mode: 'HTML' });
                ctx.wizard.state.deleteMessages.push(msg.message_id);
            }
        } else if (ctx.message.photo) {
            const msg = await ctx.reply('Пожалуйста, отправьте файл, а не картинку.');
            ctx.wizard.state.deleteMessages.push(msg.message_id);

        } else {
            const msg = await ctx.reply('Пожалуйста, отправьте файл.');
            ctx.wizard.state.deleteMessages.push(msg.message_id);
        }
    }
)

ApplyExistingApplication.on('message', async (ctx, next) => {
    ctx.wizard.state.deleteMessages.push(ctx.message.message_id);
    next();
})

ApplyExistingApplication.action('?delete', async ctx => {
    ctx.deleteMessage(ctx.message.message_id);
})

ApplyExistingApplication.action('?cancelScene', async ctx => {
    ctx.wizard.state.deleteMessages.forEach(item => ctx.deleteMessage(item));
    await ctx.scene.leave();
})

export default ApplyExistingApplication;
