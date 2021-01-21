const mongoose = require('mongoose')

const placeSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        }
    },
    idealfor: [{
        type: String,
        required: false,
        enum: ["reception", "production", 
                "meeting", "performance",
                "dinner", "wedding",
                "party", "conference"
            ]
    }],
    maxguest: {
        type: Number,
        required: true,
        trim: true
    },
    size: {
        type: Number,
        required: false,
        trim: true
    },
    amenities: [{
        type: String,
        required: false,
        enum: ["electricity", "air conditioning", 
                "wifi", "Bathrooms", "Sound System", 
                "Private Entrance", "Sink", 
                "Kitchen", "Large table", 
                "Green Screen", "TV", 
                "Stage"
            ]
    }],
    accessibility: [{
        type: String,
        required: false,
        enum: ["Wheelchair accessible", "Elevator", 
                "On-site parking", "Parking near by",
                "Stairs"
            ]
    }],
    rules: {
        type: String,
        required: false,
        trim: true
    },
    unavailableDate: [{
        type: Date,
        required: false
    }],
    isOpen: {
        type: Boolean,
        required: false,
        default: true
    },
    // image related start
    thumbnail: {
        type: String,
        required: false,
        trim: true
    },
    media: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
        required: false,
    }],
    // image related end
}, {
    timestamps: true
})


const Place = mongoose.model('Place', placeSchema)

module.exports = Place
