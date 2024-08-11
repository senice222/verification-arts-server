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
const filePath = path.join(__dirname, '../../utils/Предоставление_информации_по_акту.docx');

const baseDirectory = join(__dirname, '..', '..', 'api', 'uploads');


if (!fs.existsSync(baseDirectory)) {
	fs.mkdirSync(baseDirectory, { recursive: true });
}

const ApplyApplication = new Scenes.WizardScene(
	'apply_first_application',
	async ctx => {
		ctx.wizard.state.deleteMessages = [];
		ctx.wizard.state.data = {};
		ctx.wizard.state.data.fileAct = [];
		ctx.wizard.state.data.fileExplain = [];
		ctx.wizard.state.data.additionalInformation = []

		const msg = await ctx.reply(
			`<b>⚙️ Введите полное название компании, от которой отправляется акт:</b> \n\n<i>Пример: ООО "Компания"</i>`,
			{
				reply_markup: cancelKeyboard.reply_markup,
				parse_mode: 'HTML',
			}
		);
		ctx.wizard.state.deleteMessages.push(msg.message_id);
		ctx.wizard.next();
	},
	async ctx => {
		if (ctx.updateType === 'message') {
			ctx.wizard.state.data['name'] = ctx.message.text;
			ctx.wizard.state.data['id'] = ctx.from.id
			const msg = await ctx.reply(
				`<b>⚙️ Введите ИНН компании, от которой отправляется акт:</b> \n\n<i>Пример: 7877675123</i>`,
				{
					reply_markup: cancelKeyboard.reply_markup,
					parse_mode: 'HTML',
				}
			);
			ctx.wizard.state.deleteMessages.push(msg.message_id);
			ctx.wizard.next();
		} else {
			await ctx.reply('Пожалуйста, введите название компании.');
		}

	},
	async ctx => {
		if (ctx.updateType === 'message') {
			ctx.wizard.state.data.accepted = true;
			ctx.wizard.state.data['inn'] = ctx.message.text;
			const msg = await ctx.reply(`<b>⚙️ Отправьте файл акта и ответ на него, если он есть.</b>\n\n<i>Пожалуйста, отправляйте по одному файлу за раз. Вы можете отправить несколько файлов.</i>`, {
				reply_markup: cancelKeyboard.reply_markup,
				parse_mode: "HTML"
			});

			ctx.wizard.state.deleteMessages.push(msg.message_id);
			ctx.wizard.next();
		}
	},
	async ctx => {
		if (ctx.updateType === 'callback_query') {
			if (ctx.update.callback_query.data === '?done_act') {
				const msg = await ctx.replyWithDocument({ source: filePath }, {
					caption: '<b>❗ Скачайте и заполните приложенный выше опросный лист.\n\n⚙️ Отправьте заполненный опросный лист, а также дополнительные документы, если они есть. Список дополнительных документов указан в конце документа.</b>\n\n<i>Пожалуйста, отправляйте по одному файлу за раз. Вы можете отправить несколько файлов.</i>',
					reply_markup: Markup.inlineKeyboard([
						Markup.button.callback('❌ Отменить', '?cancelScene')
					]).resize().reply_markup,
					parse_mode: 'HTML',
				});

				ctx.wizard.state.deleteMessages.push(msg.message_id);
				ctx.wizard.next();
			}
		} else if (ctx.message.document || ctx.message.photo) {
			console.log('acts')
			try {
				let fileUrl;

				if (ctx.message.document) {
					const file = ctx.message.document;
					fileUrl = await ctx.telegram.getFileLink(file.file_id);
				} else if (ctx.message.photo) {
					const file = ctx.message.photo[ctx.message.photo.length - 1];
					fileUrl = await ctx.telegram.getFileLink(file.file_id);
				}

				ctx.wizard.state.data.fileAct.push(fileUrl.href);

				if (ctx.wizard.state.data.fileAct.length === 1) {
					const msg = await ctx.reply(
						`Продолжайте отправлять файлы, если это необходимо. Как закончите, нажмите на кнопку “Готово” ниже.`,
						{
							reply_markup: {
								inline_keyboard: [
									[{ text: 'Готово', callback_data: '?done_act' }]
								],
							},
							parse_mode: 'HTML',
						}
					);
					ctx.wizard.state.deleteMessages.push(msg.message_id);
				}
			} catch (err) {
				console.error('Error during file download:', err);
				await ctx.reply('Произошла ошибка при сохранении файла. Попробуйте снова.');
			}
		} else if (ctx.message.text) {
			const msg = await ctx.reply('На этом этапе нельзя отправить текст. Пожалуйста, отправьте файл.');
			ctx.wizard.state.deleteMessages.push(msg.message_id);
		} else {
			await ctx.reply('Пожалуйста, отправьте файл.');
		}
	},
	async function (ctx) {
		if (ctx.updateType === 'callback_query') {
			if (ctx.update.callback_query.data === '?noExplanation') {
				try {
					ctx.wizard.state.data.owner = ctx.from.id;
					const user = await UserModel.findOne({ id: ctx.from.id });
					const { name, inn, fileAct, fileExplain, additionalInformation } = ctx.wizard.state.data;

					const application = new ApplicationModel({
						owner: ctx.from.id,
						name,
						inn,
						fileAct,
						fileExplain,
						additionalInformation
					});

					await application.save();
					user.applications.push(application._id);
					await user.save();

					// Отправка письма
					sendMail(application, `https://kvik.cc/application/${application._id}`, 'new');

					await ctx.reply(
						`<b>✅ Заявка №${application.normalId} создана и отправлена на рассмотрение!</b>\n<i>В ближайшее время мы сообщим\nВам время рассмотрения заявки</i>`,
						{
							reply_markup: Markup.inlineKeyboard([
								Markup.button.callback('Перейти к заявке', `?detailedApp_${application._id}`)
							]).resize().reply_markup,
							parse_mode: 'HTML',
						}
					);

					ctx.wizard.state.deleteMessages.forEach(item => ctx.deleteMessage(item));
					ctx.scene.leave();
				} catch (err) {
					console.error('Error during application creation:', err);
					const msg = await ctx.reply('<b>Произошла ошибка при создании заявки. Попробуйте снова.</b>', { parse_mode: 'HTML' });
					ctx.wizard.state.deleteMessages.push(msg.message_id);
				}
			}

		} else if (ctx.message.document || ctx.message.text) {
			try {
				console.log('explain')
				let data;
				if (ctx.message.document) {
					const file = ctx.message.document;
					const link = await ctx.telegram.getFileLink(file.file_id);
					data = link.href
				} else {
					data = ctx.message.text
				}
				console.log(data)
				ctx.wizard.state.data.fileExplain.push(data);

				if (ctx.wizard.state.data.fileExplain.length === 1) {
					const msg = await ctx.reply(
						`Продолжайте отправлять сообщения, если это необходимо.\nКак закончите, нажмите на кнопку “Готово” ниже.`,
						{
							reply_markup: Markup.inlineKeyboard([
								[Markup.button.callback("Готово", "?noExplanation")]
							]).resize().reply_markup
						}
					);
					ctx.wizard.state.deleteMessages.push(msg.message_id);
				}
			} catch (err) {
				console.error('Error during file download:', err);
				await ctx.reply('Произошла ошибка при сохранении файла. Попробуйте снова.');
			}
		} else if (ctx.message.photo) {
			await ctx.reply('Вы отправили изображение. Пожалуйста, отправьте файл.');
		} else {
			await ctx.reply('Пожалуйста, отправьте файл.');
		}
	}

)

ApplyApplication.on('message', async (ctx, next) => {
	ctx.wizard.state.deleteMessages.push(ctx.message.message_id)
	next()
})

ApplyApplication.action('?delete', async ctx => {
	ctx.deleteMessage(ctx.message.message_id)
})

ApplyApplication.action('?cancelScene', async ctx => {
	ctx.wizard.state.deleteMessages.forEach(item => ctx.deleteMessage(item))
	await ctx.scene.leave()
})

export default ApplyApplication
