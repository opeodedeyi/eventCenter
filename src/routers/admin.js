const express = require('express')
const User = require('../models/user')
const Place = require('../models/place')
const specialPrevilege = require('../middleware/specialPrevilege')
const router = new express.Router()


router.post('/api/admin/:id/deactivate', specialPrevilege, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })
        const places = await Place.find({ owner: user._id })

        user.isActive = false
        user.tokens = []
        await user.save()
        for (let place of places) {
            place.isOpen = false
            await place.save()
        }
        res.status(200).send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/api/admin/:id/activate', specialPrevilege, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })
        const places = await Place.find({ owner: user._id })

        user.isActive = true
        await user.save()
        for (let place of places) {
            place.isOpen = true
            await place.save()
        }
        res.status(200).send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})


module.exports = router
