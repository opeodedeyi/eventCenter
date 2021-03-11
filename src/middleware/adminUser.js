const jwt = require('jsonwebtoken')
const User = require('../models/user')
require('dotenv').config()

const adminUser = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if (!user  || user.isAdmin==false) {
            throw new Error()
        }

        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).send({ error: 'you need to authenticate or be an admin user to do this' })
    }
}

module.exports = adminUser
