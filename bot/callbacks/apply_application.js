import UserModel from "../../models/User.model.js"

const applyCallback = (bot) => {
    bot.action("?apply_application", async (ctx) => {
        const user = await UserModel.findOne({id: ctx.from.id})
        const isFirstApplication = user.applications.length
        if (!isFirstApplication) {
            return ctx.scene.enter("apply_first_application", {
                isFirst: isFirstApplication
            })
        } else {
            return ctx.reply("Выберите сохраненные данные компании или нажмите на “Ввести вручную”:")
        }
    })
}

export default applyCallback;