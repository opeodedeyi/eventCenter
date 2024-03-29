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
        enum: ["studio", "house", "field", "room",
                "restaurant", "school", "church", 
                "beach", "warehouse", "others", 
                "road", "rooftop"
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
        // enum: ["house party", "video shoot", 
        //         "photo shoot"
        //     ]
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
        },
        per: {
            type: String,
            required: false,
            default: 'day',
            enum: ["half-hour", "hour", 
                "day"
            ]
        }
    },
    amenities: [{
        type: String,
        required: false,
        // enum: ["electricity", "air conditioner", "wifi", "sound system",
        //         "kitchen", "changing room", "soundproof"
        //     ]
    }],
    accessibility: [{
        type: String,
        required: false,
        // enum: ["wheelchair accessible", "elevator", 
        //         "parking space", "natural light",
        //         "soundproof", "stairs"
        //     ]
    }],
    saved: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
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
