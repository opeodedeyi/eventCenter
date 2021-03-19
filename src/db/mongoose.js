const mongoose = require('mongoose')
require('dotenv').config()

const URI = process.env.MONGODB_ATLAS_URI

mongoose.connect(URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})
