import UserModel from "../../models/User.model.js"

const applyCallback = (bot) => {
    bot.action("?apply_application", async (ctx) => {
        const user = await UserModel.findOne({ id: ctx.from.id }).populate('applications')
        const isFirstApplication = user.applications.length
        if (!isFirstApplication) {
            return ctx.scene.enter("apply_first_application", {
                isFirst: isFirstApplication
            })
        } else {
            const inlineKeyboard = user.applications.map(application => [
                {
                    text: `ООО "${application.name}" – ИНН ${application.inn}`,
                    callback_data: `select_application_${application._id}` 
                }
            ])

            inlineKeyboard.push([
                {
                    text: "Ввести вручную",
                    callback_data: "?apply_first_application"
                }
            ])

            await ctx.reply("Выберите сохраненные данные\nкомпании или нажмите на “Ввести вручную”:", {
                reply_markup: {
                    inline_keyboard: inlineKeyboard
                }
            })
        }
    })
    bot.action(/select_application_(.+)/, async ctx => {
        const applicationId = ctx.match[1]
        ctx.scene.enter("apply_existing_application", { applicationId }) 
    })
    
    bot.action('?apply_first_application', async ctx => {
        ctx.scene.enter("apply_first_application") 
    })
}

export default applyCallback;