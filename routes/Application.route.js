import {Router} from 'express'
import * as applicationService from '../services/Application.service.js'
import checkAdmin from "../utils/checkAdmin.js";


const ApplicationRoute = Router()

// checkAdmin


export default ApplicationRoute