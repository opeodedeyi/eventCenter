const mongoose = require('mongoose');
require('dotenv').config();


const environment = process.env.NODE_ENV

if (environment==="prod") {
    const URI = process.env.MONGODB_ATLAS_URI_PROD
    mongoose.connect(URI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    })
} else {
    const URI = process.env.MONGODB_ATLAS_URI
    mongoose.connect(URI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    })
}

