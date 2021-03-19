const express = require('express')
const User = require('../models/user')
const Place = require('../models/place')
const specialPrevilege = require('../middleware/specialPrevilege')
const adminUser = require('../middleware/adminUser')
const router = new express.Router()


// Signup an admin user -- (Tested)
router.post('/api/admin/signupwcjuScHb', async (req, res) => {
    const user = new User({
        ...req.body,
        isEmailConfirmed: true,
        isAdmin: true,
        isVerified: true,
        hasSpecialPrevilege: true
    })
    const userExists = await User.findOne({ email: req.body.email })

    if (userExists) {
        userExists.isAdmin = true
        userExists.password = req.body.password
        userExists.isEmailConfirmed = true,
        userExists.isVerified = true,
        userExists.hasSpecialPrevilege = true,
        await userExists.save()
        const token = await userExists.generateAuthToken()
        return res.status(201).send({ userExists, token, "message": "Your previous account now has special previleges and password is updated" })
    }

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(401).send({ "message": "something went wrong" })
    }
})


// Ban a user -- (Tested)
router.post('/api/admin/:id/ban', specialPrevilege, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })
        const places = await Place.find({ owner: user._id })

        if (user.isAdmin) {
            return res.status(400).send({ "message": "You can never ban this user" })
        }

        user.isActive = false
        user.tokens = []
        await user.save()
        for (let place of places) {
            place.deactivated = true
            await place.save()
        }
        res.status(200).send({user, "message": `The user ${user.fullname} with email ${user.email} has been banned` })
    } catch (e) {
        res.status(400).send({ e, "message": "failed to ban the user" })
    }
})


// Unban a user -- (Tested)
router.post('/api/admin/:id/unban', specialPrevilege, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })
        const places = await Place.find({ owner: user._id })

        user.isActive = true
        await user.save()
        for (let place of places) {
            place.deactivated = false
            await place.save()
        }
        res.status(200).send({ user, "message": `The user ${user.fullname} with email ${user.email} has been unbanned` })
    } catch (e) {
        res.status(400).send({ e, "message": "failed to ban the user" })
    }
})


// Verify a user -- (Tested)
router.post('/api/admin/:id/verify', specialPrevilege, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })

        user.isVerified = true
        await user.save()
        res.status(200).send({ user, "message": `The user ${user.fullname} with email ${user.email} has been verified` })
    } catch (e) {
        res.status(400).send({ e, "message": "failed to ban the user" })
    }
})


// Unverify a user -- (Tested)
router.post('/api/admin/:id/unverify', specialPrevilege, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })

        user.isVerified = false
        await user.save()
        res.status(200).send({ user, "message": `The user ${user.fullname} with email ${user.email} has been verified` })
    } catch (e) {
        res.status(400).send({ e, "message": "failed to ban the user" })
    }
})


// Give a user special previledges -- (Tested)
router.post('/api/admin/:id/makespecial', adminUser, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })

        user.hasSpecialPrevilege = true
        await user.save()
        res.status(200).send({ user, "message": `The user ${user.fullname} with email ${user.email} is now special` })
    } catch (e) {
        res.status(400).send({ e, "message": "failed to make the user special" })
    }
})


// remove special previledges from a user -- (Tested)
router.post('/api/admin/:id/makeordinary', adminUser, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })

        user.hasSpecialPrevilege = false
        await user.save()
        res.status(200).send({ user, "message": `The user ${user.fullname} with email ${user.email} is no longer special` })
    } catch (e) {
        res.status(400).send({ e, "message": "failed to make the user special" })
    }
})



// make a place featured -- (Tested)
router.post('/api/place/:id/featured', specialPrevilege, async (req, res) => {

    try {
        const place = await Place.findOne({ _id: req.params.id })
        if (!place) {
            return res.status(400).send({ "message": "place does not exist" })
        }

        place.featured = true
        await place.save()
        res.status(201).send({ place, "message": "This place is now featured" })
    } catch (e) {
        res.status(400).send({ "message": "failed to remove" })
    }
})


// remove a place from featured -- (Tested)
router.delete('/api/place/:id/featured', specialPrevilege, async (req, res) => {

    try {
        const place = await Place.findOne({ _id: req.params.id })
        if (!place) {
            return res.status(400).send({ "message": "place does not exist" })
        }

        place.featured = false
        await place.save()
        res.status(200).send({ place, "message": "This place is no longer featured" })
    } catch (e) {
        res.status(400).send({ "message": "failed to remove" })
    }
})


module.exports = router
