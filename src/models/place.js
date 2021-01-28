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
    typeof: {
        type: String,
        required: true,
        enum: ["studio", "hall", 
                "house", "mansion",
                "field", "room",
                "restaurant", "school",
                "church", "beach", "warehouse"
            ]
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
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
    rooms: {
        type: Number,
        required: false,
        trim: true
    },
    toilet: {
        type: Number,
        required: false,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        trim: true
    },
    amenities: [{
        type: String,
        required: false,
        enum: ["electricity", "air conditioning", 
                "wifi", "Bathrooms", "Sound System", 
                "Private Entrance", "Sink", 
                "Kitchen", "Large table", 
                "Green Screen", "TV", "Stage", 
                "changing room", "makeup room",
                "lounge"
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
    unavailabledate: [{
        type: Date,
        required: false
    }],
    isOpen: {
        type: Boolean,
        required: false,
        default: true
    },
    phonenumber: {
        type: Number,
        required: true,
        trim: true
    },
    media: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
        required: false,
    }],
}, {
    timestamps: true
})

placeSchema.index({ location: 'text' });


const Place = mongoose.model('Place', placeSchema)

module.exports = Place
