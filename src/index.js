const express = require('express')
require('./db/mongoose')
require('dotenv').config()
var cors = require('cors')
const app = express()

const userRouter = require('./routers/user')
const placeRouter = require('./routers/place')
const adminRouter = require('./routers/admin')
const commentRouter = require('./routers/comment')

const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(userRouter)
app.use(placeRouter)
app.use(adminRouter)
app.use(commentRouter)

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
})
