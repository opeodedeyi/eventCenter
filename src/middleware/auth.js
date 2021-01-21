const jwt = require('jsonwebtoken')
const User = require('../models/user')
require('dotenv').config()


const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if (!user) {
            throw new Error()
        }

        req.token = token
        req.user = user
        next()
    } catch (e) {
        console.log(e);
        res.status(401).send({ error: 'Please authenticate' })
    }
}


const isVerified = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if (!user) {
            throw new Error()
        } 
        else if (user.isEmailConfirmed==false) {
            return res.status(400).send({ error: 'You need to verify your email' })
        }

        req.token = token
        req.user = user
        next()
    } catch (e) {
        console.log(e);
        res.status(401).send({ error: 'Please authenticate' })
    }
}


module.exports = {
    auth,
    isVerified
};
