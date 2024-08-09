import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
dotenv.config()

const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    port: process.env.PORT,
    secure: false,
    auth: {
        user: process.env.USER,
        pass: process.env.PASS,
    },
});

export const sendMail = (application, link, type) => {
    const subject = type === 'clarification'
        ? `Поступили уточнения по заявке №${application.normalId}`
        : `Поступила новая заявка №${application.normalId}`

    const bodyText = type === 'clarification'
        ? `Поступили уточнения по заявке №${application.normalId}:`
        : `Поступила новая заявка №${application.normalId}:`

    const styledEmailContent = `
    <p><strong>${bodyText}</strong></p>
    <p>Компания: ${application.name}</p>
    <p>ИНН: ${application.inn}</p>
    <p>Для просмотра ${type === 'clarification' ? 'уточнений и ответа' : 'заявки и ответа'} на заявку перейдите в админ панель: <a href="${link}">ОТКРЫТЬ</a></p>
`

    const mailOptions = {
        from: '"Ответ на акты" <n.socialmedia12@gmail.com>',
        to: process.env.RECEIVER,
        subject,
        html: styledEmailContent
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error)
        } else {
            console.log('Email sent successfully')
        }
    })
}