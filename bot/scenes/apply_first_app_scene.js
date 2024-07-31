import { Markup, Scenes } from "telegraf"
import { cancelKeyboard } from "./keyboard.js"
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseDirectory = join(__dirname, '..', '..', 'api', 'uploads');


if (!fs.existsSync(baseDirectory)) {
	fs.mkdirSync(baseDirectory, { recursive: true });
}

const ApplyApplication = new Scenes.WizardScene(
	'apply_first_application',
	async ctx => {
		ctx.wizard.state.deleteMessages = []
		ctx.wizard.state.data = {}

		ctx.reply(
			`<b>⚙️ Введите название компании, от которой отправляется акт</b>`,
			{
				reply_markup: cancelKeyboard.reply_markup,
				parse_mode: 'HTML',
			}
		).then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id))
		ctx.wizard.next()
	},
	async ctx => {
		if (ctx.updateType === 'message') {
			ctx.wizard.state.data['name'] = ctx.message.text
			ctx.reply(
				`<b>⚙️ Введите ИНН компании, от которой отправляется акт</b>`,
				{
					reply_markup: cancelKeyboard.reply_markup,
					parse_mode: 'HTML',
				}
			).then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id))
			ctx.wizard.next()
		}
	},
	async ctx => {
		if (ctx.updateType === 'message') {
			ctx.wizard.state.data['inn'] = ctx.message.text;
			await ctx.reply(
				'Памятка (файл + текст)',
				Markup.inlineKeyboard([
					Markup.button.callback('Ознакомлен', '?acknowledge')
				]).resize()
			).then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id));
			ctx.wizard.next()
		}
	},
	async ctx => {
		if (ctx.updateType === "callback_query") {
			if (ctx.update.callback_query.data === '?acknowledge') {
				ctx.wizard.state.data.accepted = true;
				await ctx.editMessageText('Вы ознакомились.');
				await ctx.reply(
					`<b>⚙️ Отправьте файл акта:</b>`,
					{
						reply_markup: cancelKeyboard.reply_markup,
						parse_mode: 'HTML',
					}
				).then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id));
				ctx.wizard.next();
			}
		}
	},
	async ctx => {
		if (ctx.message.document) {
			const file = ctx.message.document
			const fileMimeType = file.mime_type
			const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

			if (!allowedMimeTypes.includes(fileMimeType)) {
				ctx.reply('Пожалуйста, отправьте файл в формате PDF или Word (doc/docx).').then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id))
			} else {
				const fileLink = await ctx.telegram.getFileLink(file.file_id)
				const filePath = path.join(baseDirectory, `${Date.now()}-${file.file_name}`)

				const response = await axios({
					url: fileLink,
					responseType: 'stream',
				})

				response.data.pipe(fs.createWriteStream(filePath))

				response.data.on('end', async () => {
					ctx.wizard.state.data['fileAct'] = `${Date.now()}-${file.file_name}`
					await ctx.reply('Файл акта принят.').then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id))
					ctx.wizard.next()
				})

				response.data.on('error', async (err) => {
					console.error('Error downloading file:', err)
					ctx.reply('Произошла ошибка при сохранении файла. Попробуйте снова.').then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id))
				})
			}
		} else {
			ctx.reply('Пожалуйста, отправьте файл.').then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id))
		}
	},
	async ctx => {
		if (ctx.updateType === 'message') {
			await ctx.reply(
				`<b>⚙️ Отправьте файл с пояснениями:</b>`,
				{
					reply_markup: cancelKeyboard.reply_markup,
					parse_mode: 'HTML',
				}
			).then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id));
			ctx.wizard.next();
		}
	},
	async ctx => {
		console.log(123)
		if (ctx.message.document) {
			const file = ctx.message.document
			const fileMimeType = file.mime_type
			const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

			if (!allowedMimeTypes.includes(fileMimeType)) {
				ctx.reply(`<b>Пожалуйста, отправьте файл в формате PDF или Word (doc/docx).</b>`, { parse_mode: "HTML" }).then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id))
			} else {
				const fileLink = await ctx.telegram.getFileLink(file.file_id)
				const filePath = path.join(baseDirectory, `${Date.now()}-${file.file_name}`)

				const response = await axios({
					url: fileLink,
					responseType: 'stream',
				})

				response.data.pipe(fs.createWriteStream(filePath))

				response.data.on('end', async () => {
					ctx.wizard.state.data['fileExplain'] = `${Date.now()}-${file.file_name}`
					ctx.reply(`<b>Файл объяснений принят.</b>`, { parse_mode: 'HTML' }).then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id))
					ctx.wizard.next()
					return ctx.wizard.steps[ctx.wizard.cursor](ctx);
				})

				response.data.on('error', async (err) => {
					console.error('Error downloading file:', err)
					ctx.reply(`<b>Произошла ошибка при сохранении файла. Попробуйте снова.</b>`, { parse_mode: "HTML" }).then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id))
				})
			}
		} else {
			ctx.reply('Пожалуйста, отправьте файл.').then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id))
		}
	},
	async ctx => {

		await ctx.reply(
			`<b>Заявка №312371293 создана!\n
В ближайшее время мы сообщим Вам время рассмотрения заявки</b>`,
			{
				reply_markup: cancelKeyboard.reply_markup,
				parse_mode: 'HTML',
			}
		).then(msg => ctx.wizard.state.deleteMessages.push(msg.message_id));
		ctx.wizard.next();

	},
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
