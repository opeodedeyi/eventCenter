const express = require('express')
const Place = require('../models/place')
const Media = require('../models/media')
const { isVerified } = require('../middleware/auth')
const { upload, s3 } = require('../middleware/aws')
const { v4: uuidv4 } = require('uuid')
const sharp = require('sharp');
const router = new express.Router()
require('dotenv').config()


//  Create an event place
router.post('/api/place', isVerified, upload.array('images', 15), async (req, res) => {
    const files = req.files.map(file => file.buffer)
    const place = new Place({
        ...req.body,
        owner: req.user._id,
        isOpen: true,
    })

    try {
        for (let file of files) {
            const buffer = await sharp(file)
                                .jpeg()
                                .withMetadata()
                                .toBuffer()
        
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `${uuidv4()}.jpeg`,
                Body: buffer
            }
    
            const data = await s3.upload(params).promise()

            const med = new Media({
                url: data.Location,
                owner: req.user._id
            })

            await med.save()

            place.media.addToSet(med.id)
        }

        await place.save()
        res.status(201).send(place)
    } catch (e) {
        console.log("failed", e);
        res.status(500).send(e)
    }
})


// get all places
router.get('/api/place', async (req, res) => {
    const match = {
        isOpen: true
    }
    const sort = {}

    if (req.query.idealfor) {
        match.idealfor = req.query.idealfor
    } if (req.query.amenities) {
        match.amenities = req.query.amenities
    } if (req.query.availabledate) {
        match.availabledate = { "$ne": req.query.availabledate }
    } if (req.query.typeof) {
        match.typeof = req.query.typeof
    } if (req.query.search) {
        match.$text = {$search: req.query.search}
        sort.score = {$meta: "textScore"}
    }

    console.log(match,`, ${sort}`);

    const noOnPage = parseInt(req.query.limit) || 10
    const pageNo = (parseInt(req.query.page)-1)*parseInt(req.query.limit)

    try {
        const place = await Place.find(match, sort)
        .select('-media')
        .limit(noOnPage)
        .skip(pageNo)
        .sort(sort)

        res.status(200).send(place)
    } catch (e) {
        res.status(500).send()
    }
})


// get a single place
router.get('/api/place/:id', async (req, res) => {
    try {
        const place = await Place.findById(req.params.id).populate('media')
        res.status(200).send(place)
    } catch (e) {
        res.status(401).send()
    }
})


// get all logged in user's place
router.get('/api/myplaces', isVerified, async (req, res) => {
    try {
        const id = req.user._id
        const place = await Place.find({owner: id})
        res.status(200).send(place)
    } catch (e) {
        res.status(401).send()
    }
})


// get all of a user's place
router.get('/api/:id/places', async (req, res) => {
    // filtering, sorting and pagination to be done here
    try {
        const place = await Place.find({owner: req.params.id})
        res.status(200).send(place)
    } catch (e) {
        res.status(400).send()
    }
})


// updating
// Edit a place
router.patch('/api/place/:id', isVerified, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["title", "description", "maxguest", "size", "isOpen", "rules", "rooms", "toilet", "price", "phonenumber", "location", "typeof"]
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(404).send({ error: 'Invalid updates!' })
    }

    try {
        const place = await Place.findOne({ _id: req.params.id, owner: req.user._id })

        if (!place) {
            return res.status(404).send()
        }

        updates.forEach((update) => place[update] = req.body[update])
        await place.save()
        res.send(place)
    } catch (e) {
        res.status(400).send(e)
    }
})


//  Add a photo
router.patch('/api/place/:id/photo', isVerified, upload.array('images', 15), async (req, res) => {
    const files = req.files.map(file => file.buffer)
    const place = await Place.findOne({ _id: req.params.id, owner: req.user._id })

    const placelen = place.media.length
    const postlen = files.length

    if (placelen+postlen>15) {
        return res.status(500).send({"message": `You cannot have more than a total of 15 photos, add ${15-placelen} more`})
    }

    try {
        for (let file of files) {
            const buffer = await sharp(file)
                                .jpeg()
                                .withMetadata()
                                .toBuffer()
        
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `${uuidv4()}.jpeg`,
                Body: buffer
            }
    
            const data = await s3.upload(params).promise()

            const med = new Media({
                url: data.Location,
                owner: req.user._id
            })

            await med.save()

            place.media.addToSet(med.id)
        }

        await place.save()
        res.status(201).send(place)
    } catch (e) {
        console.log("failed", e);
        res.status(500).send(e)
    }
})


// delete a place
router.delete('/api/place/:id', isVerified, async (req, res) => {
    const _id = req.params.id

    try {
        const place = await Place.findOne({ _id, owner: req.user._id })
        photos = place.media

        for (let pho of photos) {
            photoId = pho
            p = await Media.findById(photoId)
            const photo = p.url
            var list = photo.split("/")
            let key = list[list.length - 1]

            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key
            }

            await s3.deleteObject(params).promise()
            await p.remove()
        }
        await Place.findOneAndDelete({ _id, owner: req.user._id })
        res.status(204).send()
    } catch (e) {
        res.status(500).send()
    }
})


// delete a place's photo
router.delete('/api/photo/:id', isVerified, async (req, res) => {
    const _id = req.params.id

    try {
        // Here we: -delete photo from s3
        //          -delete media where photo is
        //          -remove the photo from array in the place
        p = await Media.findOne({_id, owner: req.user._id})
        const photo = p.url
        var list = photo.split("/")
        let key = list[list.length - 1]

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        }

        await s3.deleteObject(params).promise()
        await p.remove()

        place = await Place.findOne({ media:_id, owner: req.user._id })
        place.media = place.media.filter((objid) => {
            return objid != _id
        })
        place.save()
        res.status(204).send(place)
    } catch (e) {
        res.status(500).send()
    }
})


// add to objects that are array
router.patch('/api/place/:id/list', isVerified, async (req, res) => {
    // [addideal, amenities, accessibility, unavailabledate, typeof]
    const idealToAdd = req.body.idealfor
    const amenitiesToAdd = req.body.amenities
    const accessibilityToAdd = req.body.accessibility
    const dateToAdd = req.body.unavailabledate

    try {
        const place = await Place.findOne({ _id: req.params.id, owner:req.user._id })

        if (idealToAdd) {
            idealToAdd.forEach((item) => place.idealfor.addToSet(item))
        }
        if (amenitiesToAdd) {
            amenitiesToAdd.forEach((item) => place.amenities.addToSet(item))
        }
        if (accessibilityToAdd) {
            accessibilityToAdd.forEach((item) => place.accessibility.addToSet(item))
        }
        if (dateToAdd) {
            dateToAdd.forEach((date) => place.unavailabledate.addToSet(date))
        }
        
        await place.save()
        res.status(200).send(place)
    } catch (e) {
        res.status(400).send(e)
    }
})


// remove from objects that are array
router.delete('/api/place/:id/list', isVerified, async (req, res) => {
    // [addideal, amenities, accessibility, unavailabledate, typeof]
    const idealToRemove = req.body.idealfor
    const amenitiesToRemove = req.body.amenities
    const accessibilityToRemove = req.body.accessibility
    const dateToRemove = req.body.unavailabledate

    try {
        const place = await Place.findOne({ _id: req.params.id, owner:req.user._id })

        idealToRemove.forEach((item) => {
            place.idealfor = place.idealfor.filter((idea) => {
                return idea != item
            })
        })
        amenitiesToRemove.forEach((item) => {
            place.amenities = place.amenities.filter((idea) => {
                return idea != item
            })
        })
        accessibilityToRemove.forEach((item) => {
            place.accessibility = place.accessibility.filter((idea) => {
                return idea != item
            })
        })
        dateToRemove.forEach((date) => {
            place.unavailabledate = place.unavailabledate.filter((dates) => {
                return dates != date
            })
        })

        await place.save()
        res.status(201).send(place)
    } catch (e) {
        res.status(500).send(e)
    }
})


module.exports = router
