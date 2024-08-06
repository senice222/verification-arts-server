import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema(
    {
        fio: {
            type: String,
            required: true
        },
        login: {
            type: String,
            required: true
        },
        access: [String],
        passwordHash: {
            type: String,
            required: true
        },
        comment: {
            type: String,
            default: '',
        }
    }
);

export default mongoose.model('Admin', AdminSchema);