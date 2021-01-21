const mongoose = require('mongoose')

const mediaSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
})

const Media = mongoose.model('Media', mediaSchema)

module.exports = Media
