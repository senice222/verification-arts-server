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
            enum: ["В работе", "На уточнении", "Отклонена", "На рассмотрении", "Рассмотрена"],
            default: "На рассмотрении"
        },
        history: [],
        fileAct: {
            type: String,
            required: true,
        },
        fileExplain: {
            type: String,
            required: true
        },
        clarificationsAnswer: {
            type: {
                text: String,
                files: [String]
            },
            default: {}
        },
        comments: {
            type: String,
            default: ''
        },
        fileAnswer: {
            type: [String],
            default: []
        },
        clarifications: {
            type: Boolean,
            default: false
        },
        dateAnswer: {
            type: String,
            default: ""
        },
        owner: {
            type: Number,
            required: true
        }
    }
);

ApplicationSchema.plugin(AutoIncrement, { inc_field: 'normalId' })

export default mongoose.model('Application', ApplicationSchema);