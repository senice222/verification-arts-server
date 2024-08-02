import { format } from 'date-fns'
import ApplicationModel from '../../models/Application.model.js';
import { Markup } from 'telegraf';
import multer from "multer";
import path, {dirname} from "path";
import fs from 'fs'
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const uploadDirectory = path.join(__dirname, '../../api/uploads')

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true })
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) 
    }
})
const upload = multer({ storage: storage })

export const setDateToAnswer = (app, bot) => {
    app.post("/api/application/set-date/:id", async (req, res) => {
        const { id } = req.params
        const { _id, date } = req.body;

        try {
            const application = await ApplicationModel.findById(_id)
            if (!application) {
                res.status(404).json("Application not found")
            }
            const formattedDate = format(new Date(date), 'dd.MM.yyyy')
            await bot.telegram.sendMessage(id, `Заявка №${application.normalId} будет рассмотрена до ${formattedDate}.`,
                {
                    reply_markup: Markup.inlineKeyboard([
                        Markup.button.callback('Перейти к заявке', `?detailedApp_${application._id}`)
                    ]).resize().reply_markup
                }
            );

            res.status(200).send('Message sent successfully');
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send('Failed to send message');
        }
    });
};

export const reviewedApplication = (app, bot) => {
    app.put("/api/application/reviewed/:id", upload.single('file'), async (req, res) => {
        const { id } = req.params
        const { _id, status, comments } = req.body;
        const fileAnswer = req.file.originalname
        
        try {
            const updateData = { status, fileAnswer }
            if (comments) {
                updateData.comments = comments
            }

            const application = await ApplicationModel.findByIdAndUpdate(
                _id,
                { $set: updateData },
                { new: true }
            )

            if (!application) {
                return res.status(404).json({ message: 'Application not found' })
            }

            await bot.telegram.sendMessage(id, `Заявка №${application.normalId} ${status}!\nПерейдите на страницу заявки,\nчтобы увидеть ответ.`,
                {
                    reply_markup: Markup.inlineKeyboard([
                        Markup.button.callback('Перейти к заявке', `?detailedApp_${application._id}`)
                    ]).resize().reply_markup
                }
            );

            res.status(200).send('Message sent successfully');
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send('Failed to send message');
        }
    });
};

export const getClarifications = (app, bot) => {
    app.post("/api/application/get-clarifications/:id", async (req, res) => {
        const { id } = req.params
        const { _id, text } = req.body;
        try {
            const application = await ApplicationModel.findById(_id)
            if (!application) {
                res.status(404).json("Application not found")
            }
            // application.clarifications = true
            await bot.telegram.sendMessage(id, `По заявке №${application.normalId} требуются\nуточнения:\n---\n${text}`,
                {
                    reply_markup: Markup.inlineKeyboard([
                        Markup.button.callback('Отправить уточнение', `clarify_${application._id}`)
                    ]).resize().reply_markup
                }
            );

            res.status(200).send('Message sent successfully');
        } catch(e) {
            console.log("clarifications:", e)
        }
    })
}