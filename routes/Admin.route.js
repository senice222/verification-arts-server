import {Router} from 'express'
import * as adminService from '../services/Admin.service.js'
import checkAdmin from "../utils/checkAdmin.js";


const AdminRoute = Router()

AdminRoute.post('/admin/create', adminService.createAdmin)
AdminRoute.post('/admin/login', adminService.login)
AdminRoute.get('/admin/me', checkAdmin, adminService.getMe)
AdminRoute.put('/admin/changePassword', checkAdmin, adminService.changeUserPassword)


export default AdminRoute