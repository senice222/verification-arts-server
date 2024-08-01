import { Markup, Scenes } from "telegraf"
import { cancelKeyboard } from "./keyboard.js"
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import UserModel from "../../models/User.model.js"
import ApplicationModel from "../../models/Application.model.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
				const msg = await ctx.reply(
					'Памятка (файл + текст)',
					Markup.inlineKeyboard([
						Markup.button.callback('Ознакомлен', '?acknowledge')
					]).resize()
				);
				ctx.wizard.state.deleteMessages.push(msg.message_id);
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
				await ctx.editMessageText('Вы ознакомились.');
				const msg = await ctx.reply(
					`<b>⚙️ Отправьте файл акта:</b>`,
					{
						reply_markup: cancelKeyboard.reply_markup,
						parse_mode: 'HTML',
					}
				)
				ctx.wizard.state.deleteMessages.push(msg.message_id);
				ctx.wizard.next();
			}
		} else if (ctx.message && ctx.message.text) {
			await ctx.reply('Пожалуйста, отправьте файл.');
		}
	},
	async ctx => {
		if (ctx.message && ctx.message.document) {
			const file = ctx.message.document;
			const fileMimeType = file.mime_type;
			const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

			if (!allowedMimeTypes.includes(fileMimeType)) {
				await ctx.reply('Пожалуйста, отправьте файл в формате PDF или Word (doc/docx).');
			} else {
				const fileLink = await ctx.telegram.getFileLink(file.file_id);
				const filePath = path.join(baseDirectory, `${Date.now()}-${file.file_name}`);

				try {
					const response = await axios({
						url: fileLink,
						responseType: 'stream',
					});

					response.data.pipe(fs.createWriteStream(filePath));

					response.data.on('end', async () => {
						ctx.wizard.state.data.fileAct = `${Date.now()}-${file.file_name}`;
						const msg = await ctx.reply(
							`<b>⚙️ Отправьте файл с пояснениями:</b>`,
							{
								reply_markup: cancelKeyboard.reply_markup,
								parse_mode: 'HTML',
							}
						)
						ctx.wizard.state.deleteMessages.push(msg.message_id);
						ctx.wizard.next();
					});

					response.data.on('error', async (err) => {
						console.error('Error downloading file:', err);
						await ctx.reply('Произошла ошибка при сохранении файла. Попробуйте снова.');
					});
				} catch (err) {
					console.error('Error during file download:', err);
					await ctx.reply('Произошла ошибка при сохранении файла. Попробуйте снова.');
				}
			}
		} else if (ctx.message && ctx.message.text) {
			const msg = await ctx.reply('Пожалуйста, отправьте файл.');
			ctx.wizard.state.deleteMessages.push(msg.message_id);
		}
	},
	async ctx => {
		if (ctx.message.document) {
			const file = ctx.message.document
			const fileMimeType = file.mime_type
			const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

			if (!allowedMimeTypes.includes(fileMimeType)) {
				const msg = await ctx.reply(`<b>Пожалуйста, отправьте файл в формате PDF или Word (doc/docx).</b>`, { parse_mode: "HTML" })
				ctx.wizard.state.deleteMessages.push(msg.message_id);
			} else {
				const fileLink = await ctx.telegram.getFileLink(file.file_id)
				const filePath = path.join(baseDirectory, `${Date.now()}-${file.file_name}`)

				try {
					const response = await axios({
						url: fileLink,
						responseType: 'stream',
					})

					response.data.pipe(fs.createWriteStream(filePath))

					response.data.on('end', async () => {

						ctx.wizard.state.data.fileExplain = `${Date.now()}-${file.file_name}`
						const user = await UserModel.findOne({ id: ctx.from.id })
						const application = new ApplicationModel(ctx.wizard.state.data)
						await application.save()
						user.applications.push(application._id)
						await user.save()
						await ctx.reply(
							`<b>Заявка №${application.normalId} создана!</b>\nВ ближайшее время мы сообщим\nВам время рассмотрения заявки`,
							{
								reply_markup: Markup.inlineKeyboard([
									Markup.button.callback('Перейти к заявке', `?application_${application._id}`)
								]).resize().reply_markup,
								parse_mode: 'HTML',
							}
						)

						ctx.wizard.state.deleteMessages.forEach(item => ctx.deleteMessage(item))
						ctx.scene.leave()
					})

					response.data.on('error', async (err) => {
						console.error('Error downloading file:', err)
						const msg = await ctx.reply(`<b>Произошла ошибка при сохранении файла. Попробуйте снова.</b>`, { parse_mode: "HTML" })
						ctx.wizard.state.deleteMessages.push(msg.message_id);
					})
				} catch (err) {
					console.error('Error during file download:', err)
					const msg = await ctx.reply(`<b>Произошла ошибка при сохранении файла. Попробуйте снова.</b>`, { parse_mode: "HTML" })
					ctx.wizard.state.deleteMessages.push(msg.message_id);
				}
			}
		} else {
			await ctx.reply('Пожалуйста, отправьте файл.')
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
