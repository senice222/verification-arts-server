import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema(
    {
        login: {
            type: String,
            required: true
        },
        role: {
            type: String,
            required: true
        },
        passwordHash: {
            type: String,
            required: true
        }
    }
);

export default mongoose.model('Admin', AdminSchema);