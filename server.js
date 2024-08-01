import express from 'express'
import path from "path";
import bodyParser from 'body-parser';
import AdminRoute from './routes/Admin.route.js';

const startServer = (router) => {

    router.use(bodyParser.urlencoded({ extended: true }));

    const __dirname = path.resolve();
    router.use('/api', AdminRoute)
    router.use('/api/uploads', express.static(path.join(__dirname, 'api/uploads')));
}

export default startServer