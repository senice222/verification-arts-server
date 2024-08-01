import jwt from "jsonwebtoken";
import AdminModel from "../models/Admin.model.js";

const checkAdmin = async (req, res, next) => {
    const token = (req.headers.authorization || "").replace(/Bearer\s?/, "");
    console.log(req.headers.authorization)
    if (!token) {
        return res.status(403).json({
            message: "Нет доступа, 1",
        });
    }
    try {
        const { _id } = jwt.verify(token, "JKzbagGASvas912<<<Zkjf");
        const admin = await AdminModel.findById(_id)

        if (!admin) {
            return res.status(403).json({
                message: "Нет доступа, 3",
            });
        }
        req.userId = _id;
        req.role = admin.role
        next();
    } catch (err) {
        console.log(err)

        return res.status(403).json({
            message: "Нет доступа, 2",
        });
    }
};
export default checkAdmin;