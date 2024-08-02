import startServer from "./server.js"
import mongoose from "mongoose"
import dotenv from 'dotenv'
import initBot from "./bot.js"
import express from "express";
import cors from "cors";

dotenv.config()
mongoose.connect
    (`${process.env.MONGO_URI}`,)
    .then(() => {
        const router = express()

        router.use(express.json())
        router.use(cors())

        startServer(router)
        // initBot(router)

        router.listen(4000, () => {
            console.log('Server OK')
        })
    })
    .catch((e) => console.log('DB err', e))

process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('Closed connection with MongoDB successfully');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    } finally {
        process.exit();
    }
});

