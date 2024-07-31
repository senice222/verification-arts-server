import {Telegraf, Scenes, session} from 'telegraf'
import dotenv from 'dotenv'
import startCommand from './bot/commands/start.js';
import startAction from './bot/callbacks/apply_application.js';
import applyCallback from './bot/callbacks/apply_application.js';
import ApplyApplication from './bot/scenes/apply_first_app_scene.js';
import is_registered from './bot/middleware/is_registered.js';

dotenv.config();

const initBot = (app) => {
    const bot = new Telegraf(process.env.TOKEN);

	bot.use(session())

	const Stage = new Scenes.Stage([ 
        ApplyApplication
    ], { ttl: 10 })

	// middlewares
	bot.use(Stage.middleware())
    is_registered(bot)

    // api

	// commands
    startCommand(bot)

	// callbacks    
    startAction(bot)
    applyCallback(bot)


    bot.launch().then(() => {
        console.log('Bot is running');
    }).catch(err => {
        console.error('Failed to launch bot:', err);
    });
}

export default initBot