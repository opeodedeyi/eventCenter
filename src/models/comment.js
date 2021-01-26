const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Project' || null,
    },
    reply: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Comment' || null,
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    likers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
})

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment
