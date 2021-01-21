const express = require('express')
require('./db/mongoose')
const app = express()
const userRouter = require('./routers/user')
const placeRouter = require('./routers/place')
const adminRouter = require('./routers/admin')
const port = process.env.PORT || 3000

app.use(express.json())
app.use(userRouter)
app.use(placeRouter)
app.use(adminRouter)

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
})
