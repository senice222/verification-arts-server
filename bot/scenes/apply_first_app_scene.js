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

const ApplyApplication = new Scenes.WizardScene(
	'apply_first_application',
	async ctx => {
		ctx.wizard.state.deleteMessages = [];
		ctx.wizard.state.data = {};

		const msg = await ctx.reply(
			`<b>⚙️ Введите название компании, от которой отправляется акт</b>`,
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
				`<b>⚙️ Введите ИНН компании, от которой отправляется акт</b>`,
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
		try {
			if (ctx.updateType === 'message') {
				ctx.wizard.state.data['inn'] = ctx.message.text;
				const fileMsg = await ctx.replyWithDocument({ source: filePath }, {
					caption: 'Памятка',
					reply_markup: Markup.inlineKeyboard([
						Markup.button.callback('Ознакомлен', '?acknowledge')
					]).resize().reply_markup
				});

				ctx.wizard.state.deleteMessages.push(fileMsg.message_id);
				ctx.wizard.next();
			} else {
				await ctx.reply('Пожалуйста, введите ИНН компании.');
			}
		} catch (error) {
			console.error('Error in step 3:', error);
		}
	},
	async ctx => {
		if (ctx.updateType === 'callback_query') {
			if (ctx.update.callback_query.data === '?acknowledge') {
				ctx.wizard.state.data.accepted = true;
				ctx.wizard.state.data.fileAct = [];
				const msg = await ctx.reply(
					`<b>⚙️ Отправьте файл акта (можете отправить несколько файлов или нажмите "Готово" для завершения):</b>`,
					{
						reply_markup: {
							inline_keyboard: [
								[{ text: 'Готово', callback_data: '?uploaded' }]
							],
						},
						parse_mode: 'HTML',
					}
				);
				ctx.wizard.state.deleteMessages.push(msg.message_id);
				ctx.wizard.next();
			}
		} else if (ctx.message && ctx.message.text) {
			await ctx.reply('Пожалуйста, отправьте файл.');
		}
	},
	async ctx => {
		if (ctx.updateType === 'callback_query') {
			if (ctx.update.callback_query.data === '?uploaded') {
				const msg = await ctx.reply(
					'<b>⚙️ Отправьте файл с пояснениями:</b>',
					{
						reply_markup: Markup.inlineKeyboard([
							[
								Markup.button.callback("У меня нет пояснений", "?noExplanation")
							],
							[
								Markup.button.callback("❌ Отменить", "?cancelScene")
							]
						]).resize().reply_markup,
						parse_mode: 'HTML',
					}
				);
				ctx.wizard.state.deleteMessages.push(msg.message_id);
				ctx.wizard.next();
			} else if (ctx.message.document) {
				const file = ctx.message.document;
				try {
					const fileUrl = await ctx.telegram.getFileLink(file.file_id);
					ctx.wizard.state.data.fileAct.push(fileUrl);

					const msg = await ctx.reply(
						`Файл успешно добавлен.`,
						{
							reply_markup: {
								inline_keyboard: [
									[{ text: 'Готово', callback_data: '?uploaded' }]
								],
							},
						}
					);
					ctx.wizard.state.deleteMessages.push(msg.message_id);
				} catch (err) {
					console.error('Error during file download:', err);
					await ctx.reply('Произошла ошибка при сохранении файла. Попробуйте снова.');
				}
			} else if (ctx.message.text) {
				const msg = await ctx.reply('Пожалуйста, отправьте файл.');
				ctx.wizard.state.deleteMessages.push(msg.message_id);
			} else if (ctx.message.photo) {
				await ctx.reply('Вы отправили изображение. Пожалуйста, отправьте файл.');
			} else {
				await ctx.reply('Пожалуйста, отправьте файл.');
			}
		}
	},
	async ctx => {
		if (ctx.updateType === 'callback_query') {
			if (ctx.update.callback_query.data === '?noExplanation') {
try {
				ctx.wizard.state.data.owner = ctx.from.id
				const user = await UserModel.findOne({ id: ctx.from.id })

				// Создание новой заявки с добавленными файлами акта и пояснений
				const application = new ApplicationModel({
					...ctx.wizard.state.data,
					fileExplanation: ctx.wizard.state.data.fileExplanation || [] // Используем массив пояснений, если он есть
				})

				await application.save()
				user.applications.push(application._id)
				await user.save()

				// Отправка письма
				sendMail(application, `https://kvik.cc/application/${application._id}`, 'new')

				await ctx.reply(
					`<b>Заявка №${application.normalId} создана!</b>\nВ ближайшее время мы сообщим\nВам время рассмотрения заявки`,
					{
						reply_markup: Markup.inlineKeyboard([
							Markup.button.callback('Перейти к заявке', `?detailedApp_${application._id}`)
						]).resize().reply_markup,
						parse_mode: 'HTML',
					}
				)

				// Удаление сообщений, которые были использованы в процессе создания заявки
				ctx.wizard.state.deleteMessages.forEach(item => ctx.deleteMessage(item))
				ctx.scene.leave()
			} catch (err) {
				console.error('Error during application creation:', err)
				const msg = await ctx.reply('<b>Произошла ошибка при создании заявки. Попробуйте снова.</b>', { parse_mode: 'HTML' });
				ctx.wizard.state.deleteMessages.push(msg.message_id);
			}
			}
		} else if (ctx.message.document) {
			const file = ctx.message.document
			try {
				const fileUrl = await ctx.telegram.getFileLink(file.file_id)
				if (!ctx.wizard.state.data.fileExplanation) {
					ctx.wizard.state.data.fileExplanation = [] // Инициализация массива пояснений, если его еще нет
				}
				ctx.wizard.state.data.fileExplanation.push(fileUrl) // Добавление файла в массив пояснений

				const msg = await ctx.reply(
					`Файл успешно добавлен. Вы можете отправить еще один файл или нажмите "Готово".`,
					{
						reply_markup: {
							inline_keyboard: [
								[{ text: 'Готово', callback_data: '?done' }]
							],
						},
						parse_mode: 'HTML',
					}
				);
				ctx.wizard.state.deleteMessages.push(msg.message_id);
			} catch (err) {
				console.error('Error during file processing:', err)
				const msg = await ctx.reply('<b>Произошла ошибка при сохранении файла. Попробуйте снова.</b>', { parse_mode: 'HTML' })
				ctx.wizard.state.deleteMessages.push(msg.message_id)
			}
		} else if (ctx.message.photo) {
			await ctx.reply('Пожалуйста, отправьте файл, а не картинку.');
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
