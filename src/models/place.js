const mongoose = require('mongoose')

const placeSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: false,
        maxlength: 50,
        trim: true
    },
    typeof: {
        type: String,
        required: true,
        enum: ["studio", "hall", 
                "house", "mansion",
                "field", "room",
                "restaurant", "school",
                "church", "beach", "warehouse",
                "others", "road", "rooftop"
            ]
    },
    description: {
        type: String,
        required: false,
        maxlength: 500,
        trim: true
    },
    location: {
        country: {
            type: String,
            required: true
        },
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
        zip: {
            type: String,
            required: false
        }
    },
    time: {
        alwaysopen: {
            type: Boolean,
            required: true,
            default: false
        },
        open: {
            type: String
        },
        close: {
            type: String
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
        required: false,
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
        currency: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        }
    },
    amenities: [{
        type: String,
        required: false,
        enum: ["electricity", "a/c", 
                "wifi", "sound system", 
                "private entrance", 
                "kitchen", "large table", "tv",
                "green screen", "stage", 
                "changing room", "makeup room",
                "lounge", "soundproof"
            ]
    }],
    accessibility: [{
        type: String,
        required: false,
        enum: ["wheelchair", "elevator", 
                "on-site parking", "parking near by",
                "stairs"
            ]
    }],
    rules: {
        type: String,
        required: false,
        maxlength: 500,
        trim: true
    },
    unavailabledate: [{
        type: Date,
        required: false
    }],
    deactivated: {
        type: Boolean,
        required: false,
        default: false
    },
    img: {
        type: Boolean,
        required: false,
        default: false
    },
    featured: {
        type: Boolean,
        required: false,
        default: false
    },
    phone: {
        code: {
            type: String,
            required: true
        },
        number: {
            type: String,
            required: true,
        }
    },
}, {
    timestamps: true
})

placeSchema.index( { "location.country": "text", "location.street": "text", "location.city": "text", "location.state": "text", "location.zip": "text" } )

const Place = mongoose.model('Place', placeSchema)

module.exports = Place
