import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
dotenv.config()

const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    port: process.env.PORT,
    secure: true,
    auth: {
        user: process.env.USER,
        pass: process.env.PASS,
    },
});

export const sendMail = (link) => {
    const styledEmailContent = `
    <h2>Новая заявка!</h2>
    <p><strong>Ссылка на просмотр:</strong> <a href="${link}">Просмотреть</a></p>
`

    const mailOptions = {
        from: '"Новая заявка" <n.socialmedia12@gmail.com>',
        to: process.env.RECEIVER,
        subject: 'Новая заявка!',
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