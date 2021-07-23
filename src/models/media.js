const mongoose = require('mongoose')

const mediaSchema = new mongoose.Schema({
    etag: {
        type: String,
        required: false,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    key: {
        type: String,
        required: true,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    place: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Place'
    }
}, {
    timestamps: true
})

const Media = mongoose.model('Media', mediaSchema)

module.exports = Media
