import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';

const AutoIncrement = mongooseSequence(mongoose);

const ApplicationSchema = new mongoose.Schema(
    {
        normalId: {
            type: Number,
            // required: true,
            unique: true
        },
        name: {
            type: String,
            required: true
        },
        inn: {
            type: String,
            required: true
        },
        accepted: {
            type: Boolean,
            required: true,
            default: true
        },
        status: {
            type: String,
            required: true,
            enum: ["В работе", "На уточнении", "Отклонена", "На рассмотрении"],
            default: "На рассмотрении"
        },
        fileAct: {
            type: String,
            required: true,
        },
        fileExplain: {
            type: String,
            required: true
        },
        comments: {
            type: String,
            default: ''
        },
        fileAnswer: {
            type: String,
            default: ''
        },
        clarifications: {
            type: Boolean,
            default: false
        }
    }
);

ApplicationSchema.plugin(AutoIncrement, { inc_field: 'normalId' })

export default mongoose.model('Application', ApplicationSchema);