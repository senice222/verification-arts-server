import AdminModel from "../models/Admin.model.js";
import bcrypt, {genSalt, hash} from "bcrypt";
import jwt from "jsonwebtoken";

export const createAdmin = async (req, res) => {
    const {login, password, role} = req.body
    try {
        const mbAdmin = await AdminModel.findOne({login})

        if (mbAdmin) {
            return res.status(500).json({message: "Такой логин уже зарегистрирован"})
        }
        const salt = await genSalt(10);
        const hashedPassword = await hash(password, salt);
        const doc = new AdminModel({
            login: login,
            passwordHash: hashedPassword,
            role: role
        })

        const admin = await doc.save()
        const token = jwt.sign(
            {
                _id: admin._id
            },
            `JKzbagGASvas912<<<Zkjf`,
            {
                expiresIn: '15d'
            }
        )
        res.status(200).json({token, admin})
    } catch (e) {
        res.status(500).json({message: 'Ошибка создания админа'})
        console.log(e)
    }
}



export const login = async (req, res) => {
    const {login, password} = req.body
    try {
        const admin = await AdminModel.findOne({login,})

        if (!admin) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            })
        }
        console.log(admin.passwordHash, password)
        const isValidPass = await bcrypt.compare(password, admin.passwordHash)

        if (!isValidPass) {
            return res.status(404).json({
                message: 'Неверный логин или пароль'
            })
        }

        const token = jwt.sign(
            {
                _id: admin._id
            },
            `JKzbagGASvas912<<<Zkjf`,
            {
                expiresIn: '15d'
            }
        )

        res.status(200).json({token, admin})


    } catch (e) {
        console.log(e)
        res.status(500).json({
            message: 'Не удалось войти',
        });
    }
}

export const getMe = async (req, res) => {
    const user = await AdminModel.findById(req.userId)
    if (!user) {
        return res.status(404).json({
            message: 'Пользователь не найден',
        })
    }

    const {passwordHash, ...userData} = user._doc

    res.json(userData)
}
export const changeUserPassword = async (req, res) => {
    const {oldPassword, newPassword} = req.body
    const {userId} = req

    try {
        const user = await AdminModel.findById(userId)

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            })
        }
        console.log(oldPassword, user.passwordHash )
        const isValidPass = await bcrypt.compare(oldPassword, user.passwordHash)

        if (!isValidPass) {
            return res.status(404).json({
                message: 'Неверный пароль'
            })
        }


        const salt = await genSalt(10);
        const hashedPassword = await hash(newPassword, salt);
        user.passwordHash = hashedPassword

        await user.save()

        res.json({success : true})
    } catch (e) {
        console.log(e)
        res.status(500).json({
            message: 'Не удалось создать продукт',
        });
    }
}
