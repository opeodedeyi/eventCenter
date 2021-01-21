const express = require('express')
const User = require('../models/user')
const { auth } = require('../middleware/auth')
const router = new express.Router()
const jwt = require('jsonwebtoken')
require('dotenv').config()
const { sendConfirmationEmail, sendPasswordResetEmail, reportUser } = require('../services/emailservice')
const { sendEmail } = require('../services/sendmail')
const { upload, s3 } = require('../middleware/aws')
const { v4: uuidv4 } = require('uuid')
const sharp = require('sharp');


// Signup a normal user -- 2
router.post('/api/signup', async (req, res) => {
    const user = new User(req.body)
    const userExists = await User.findOne({ email: req.body.email })

    if (userExists) {
        return res.status(500).send({ "message": "user already exists" })
    }

    try {
        await user.save()
        sendConfirmationEmail(user)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(500).send(e)
    }
})


// Request new verification email -- 3
router.post('/api/requestverification', async (req, res) => {
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        console.log("user");
        return res.status(401).send({ "message": "there is no such user, please signup" })
    }

    try {
        sendConfirmationEmail(user)
        res.status(201).send({ user, "message": "verification email has been sent" })
    } catch (e) {
        res.status(500).send(e)
    }
})


// Confirming an email -- 4
router.get('/api/confirmation/:token', async (req, res) => {
    try {
        token = req.params.token

        const verifyToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
        const user = await User.findById(verifyToken._id)

        if (user.isEmailConfirmed==true) {
            return res.status(200).send({"message": "Email address has already been verified"})
        }

        user.isEmailConfirmed=true
        await user.save()
        sendEmail(user, "Email Confirmed", "Your email has been successfully verified. You can now enjoy the full features of the website")
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send(e)
    }
})


// Signup an admin user with special previleges -- 5
router.post('/api/signupAdmin', async (req, res) => {
    const user = new User({
        ...req.body,
        isEmailConfirmed: true,
        isAdmin: true,
        hasSpecialPrevilege: true
    })
    const userExists = await User.findOne({ email: req.body.email })

    if (userExists) {
        return res.status(500).send({ "message": "user already exists" })
    }

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(500).send(e)
    }
})


// Reset password in case you forget a password -- 6
router.post('/api/resetpassword', async (req, res) => {
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        console.log("user");
        return res.status(401).send({ "message": "there is no such user, please signup" })
    }

    try {
        sendPasswordResetEmail(user)
        res.status(201).send({ user, "message": "password reset email sent" })
    } catch (e) {
        res.status(500).send(e)
    }
})


// Reset password change -- 7
router.post('/api/resetpassword/:token', async (req, res) => {
    try {
        token = req.params.token
        newpassword = req.body.password

        const verifyToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
        const user = await User.findById(verifyToken._id)

        if (!user) {
            return res.status(401).send({"message": "The token may have expired, please reapply for password reset"})
        }

        user.password=newpassword
        await user.save()
        sendEmail(user, "Password changed", "Your password has been successfully reset. If you did not request a password reset please contact us.")
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send(e)
    }
})


// Login a user -- 8
router.post('/api/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        if (!user.isActive) {
            return res.status(500).send({"message": "Your account has been deativated, please contact us if you have an issue"})
        }
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})


// Log out a user -- 9
router.post('/api/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})


// Logged Out of all of a user's devices -- 10
router.post('/api/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})


// Get logged in users profile -- 11
router.get('/api/me', auth, async (req, res) => {
    res.send(req.user)
})


// Edit logged in users password -- 12
router.patch('/api/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['password']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(404).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})


// set a display picture of the user -- 13
router.post('/api/me/avatar', auth, upload.single('image'), async (req, res) => {
    try {
        const photo = req.user.profilePhoto
        var list = photo.split("/")
        let key = list[list.length - 1]
        const buffer = await sharp(req.file.buffer)
                                .resize(250, 250, { 
                                    fit: "cover" 
                                })
                                .jpeg()
                                .withMetadata()
                                .toBuffer()
        
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${uuidv4()}.jpeg`,
            Body: buffer
        }
        var delparams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        };
        
        if (photo) {
            await s3.deleteObject(delparams).promise()
        }
        
        const data = await s3.upload(params).promise()
        req.user.profilePhoto = data.Location
        await req.user.save()
        res.send(req.user)
    } catch(error) {
        return res.status(500).send(error)
    }
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})


// Get all users in database -- 15
router.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({})
        res.send(users)
    } catch (e) {
        res.status(500).send()
    }
})


// Getting a specific user details -- 16
router.get('/api/users/:id', async (req, res) => {
    const _id = req.params.id

    try {
        const user = await User.findById(_id)
        if (!user) {
            return res.status(404).send()
        }
        res.send(user)
    } catch (e) {
        res.status(500).send()
    }
})


// Reporting a user
router.post('/api/users/:id/report', auth, async (req, res) => {
    const reporter = req.user
    const offender = await User.findById(req.params.id)

    try {
        reportUser(offender, reporter, req.body.message)
        res.send({"message": "The report has been sent successfully"})
    } catch (e) {
        res.status(500).send()
    }
})


module.exports = router
