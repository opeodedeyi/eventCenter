const express = require('express')
const Place = require('../models/place')
const Media = require('../models/media')
const { auth, isVerified } = require('../middleware/auth')
const { s3 } = require('../middleware/aws')
const router = new express.Router()
require('dotenv').config()


//  Create an event place -- (Tested)
router.post('/place', isVerified, async (req, res) => {
    const place = new Place({
        ...req.body,
        owner: req.user._id,
        deactivated: false,
    })

    if (place.time.alwaysopen) {
        place.time.open = undefined
        place.time.close = undefined
    }

    try {
        await place.save()
        res.status(201).send(place)
    } catch (error) {
        res.status(400).send({ "message": "A required field was not filled", error })
    }
})


// Add a place to my saved/favorite places -- (Tested)
router.post('/favorite/:id', auth, async (req, res) => {
    const placeId = req.params.id
    const place = await Place.findById(placeId)
    const userId = req.user._id

    try {
        if (!place) {
            return res.status(404).send({"message": "This place does not exist"})
        }
        place.saved.addToSet(userId)
        await place.save()
        res.status(200).send({ place, "message": "This place has been saved" })
    } catch (e) {
        res.status(401).send({"message": "failed to add this place to my saved places"})
    }
})


// remove a place from my saved/favorite places -- (Tested)
router.delete('/favorite/:id', auth, async (req, res) => {
    const placeId = req.params.id
    const place = await Place.findById(placeId)
    const userId = req.user._id

    try {
        if (!place) {
            return res.status(404).send({"message": "This place does not exist"})
        }
        place.saved = place.saved.filter((objid) => {
            objid != userId 
        })
        await place.save()
        res.status(200).send({ place, "message": "This place is no longer saved" })
    } catch (e) {
        res.status(401).send({"message": "failed to remove this place from my saved places"})
    }
})


// Check if logged in user has saved a place -- (Tested)
router.get('/favorite/:id', auth, async (req, res) => {
    const placeId = req.params.id
    const place = await Place.findById(placeId)
    const userId = req.user._id

    try {
        if (!place) {
            return res.status(404).send({"message": "This place does not exist"})
        }

        let isSaved = place.saved.some(function (objid) {
            return objid.equals(userId);
        });
        
        return res.status(200).send({ "saved": isSaved })
    } catch (e) {
        res.status(401).send({"message": "something went wrong"})
    }
})


// get all places (search and filter and sorting done here) -- (Tested) wip
router.get('/place', async (req, res) => {
    const match = {
        deactivated: false,
    }
    const sort = {}

    // filters using if statements
    if (req.query.idealfor) {
        match.idealfor = { $all : req.query.idealfor }
    } if (req.query.amenities) {
        match.amenities = { $all : req.query.amenities }
    } if (req.query.availabledate) {
        // match.unavailabledate = { "$ne": req.query.availabledate }
        match.unavailabledate = { "$nin": JSON.parse(req.query.availabledate) }
    } if (req.query.typeof) {
        match.typeof = req.query.typeof
    } if (req.query.featured) {
        match.featured = req.query.featured
    } if (req.query.img) {
        match.img = req.query.img
    } if (req.query.search) {
        match.$text = {$search: req.query.search}
        // sort.score = {$meta: "textScore"}
        sort.score = -1
    }

    const noOnPage = parseInt(req.query.limit) || 20
    const pageNo = (parseInt(req.query.page)-1)*parseInt(req.query.limit) || 0
    const endIndex = parseInt(req.query.page)*parseInt(req.query.limit)
    const next = parseInt(req.query.page)+1
    const previous = parseInt(req.query.page)-1

    try {
        const count = await Place.find(match).countDocuments().exec()

        // const place = await Place.distinct(match, sort)
        // .limit(noOnPage)
        // .skip(pageNo)
        // .sort(sort)

        const place = await Place.find(match)
        .limit(noOnPage)
        .skip(pageNo)
        .sort(sort)

        const result = {}

        // Shows the search result count
        result.resultCount = count

        // Shows the previous page number
        if (parseInt(req.query.page)!=1) {
            result.previous = previous
        }

        // Shows the next page number
        if (endIndex < count) {
            result.next = next
        }

        // assigns the search results to variable names results
        result.results = place

        res.status(200).send(result)
    } catch (e) {
        res.status(400).send({ "message": "something went wrong please reload page" })
    }
})


// get all saved places -- (Tested)
router.get('/savedplace', auth, async (req, res) => {
    const match = {
        saved: req.user._id,
    }
    const sort = {}

    // filters using if statements
    if (req.query.deactivated) {
        match.deactivated = req.query.deactivated
    }

    const noOnPage = parseInt(req.query.limit) || 20
    const pageNo = (parseInt(req.query.page)-1)*parseInt(req.query.limit) || 0
    const endIndex = parseInt(req.query.page)*parseInt(req.query.limit)
    const next = parseInt(req.query.page)+1
    const previous = parseInt(req.query.page)-1

    try {
        const count = await Place.find(match).countDocuments().exec()

        const place = await Place.find(match, sort)
        .limit(noOnPage)
        .skip(pageNo)
        .sort(sort)

        const result = {}

        // Shows the search result count
        result.resultCount = count

        // Shows the previous page number
        if (parseInt(req.query.page)!=1) {
            result.previous = previous
        }

        // Shows the next page number
        if (endIndex < count) {
            result.next = next
        }

        // assigns the search results to variable names results
        result.results = place

        res.status(200).send(result)
    } catch (e) {
        res.status(400).send({ "message": "something went wrong please login and reload page" })
    }
})


// Get all images to a place -- (Tested)
router.get('/place/:id/photo', async (req, res) => {
    try {
        const images = await Media.find({ place: req.params.id })
        res.status(200).send(images)
    } catch (e) {
        res.status(401).send({ "message": "something went wrong please reload page" })
    }
})


// Get a single image to a place -- (Tested)
router.get('/place/:id/onephoto', async (req, res) => {
    try {
        const image = await Media.findOne({ place: req.params.id })
        res.status(200).send(image)
    } catch (e) {
        res.status(401).send({ "message": "something went wrong please reload page" })
    }
})


// get a single place -- (Tested)
router.get('/place/:id', async (req, res) => {
    try {
        const place = await Place.findById(req.params.id).populate('owner')
        res.status(200).send(place)
    } catch (e) {
        res.status(401).send({ "message": "something went wrong please reload page" })
    }
})


// get a place to be edited -- (Tested)
router.get('/placetoedit/:id', auth, async (req, res) => {
    try {
        const place = await Place.findOne({ _id: req.params.id, owner: req.user._id }).select(['-createdAt', '-featured', '-img', '-owner', '-saved', '-updatedAt', '-__v', '-_id'])
        if (!place) {
            return res.status(404).send({ "message": "place does not exist" })
        }
        res.status(200).send(place)
    } catch (e) {
        res.status(401).send({ "message": "something went wrong please reload page" })
    }
})


// get all logged in user's not deactivated place -- (Tested)
router.get('/myactiveplaces', isVerified, async (req, res) => {
    const noOnPage = parseInt(req.query.limit) || 10
    const pageNo = (parseInt(req.query.page)-1)*parseInt(req.query.limit) || 0
    const endIndex = parseInt(req.query.page)*parseInt(req.query.limit)
    const next = parseInt(req.query.page)+1
    const previous = parseInt(req.query.page)-1
    try {
        const id = req.user._id
        const count = await Place.find({owner: id, deactivated: false}).countDocuments().exec()
        const place = await Place.find({owner: id, deactivated: false}).limit(noOnPage).skip(pageNo)
        const result = {}
        result.resultCount = count
        // Shows the previous page number
        if (parseInt(req.query.page)!=1) {
            result.previous = previous
        }
        // Shows the next page number
        if (endIndex < count) {
            result.next = next
        }
        result.results = place
        res.status(200).send(result)
    } catch (e) {
        res.status(401).send({ "message": "you need to be a verified user" })
    }
})


// get all logged in user's deactivated place -- (Tested)
router.get('/mydeactivatedplaces', isVerified, async (req, res) => {
    const noOnPage = parseInt(req.query.limit) || 10
    const pageNo = (parseInt(req.query.page)-1)*parseInt(req.query.limit) || 0
    const endIndex = parseInt(req.query.page)*parseInt(req.query.limit)
    const next = parseInt(req.query.page)+1
    const previous = parseInt(req.query.page)-1
    try {
        const id = req.user._id
        const count = await Place.find({owner: id, deactivated: true}).countDocuments().exec()
        const place = await Place.find({owner: id, deactivated: true}).limit(noOnPage).skip(pageNo)
        const result = {}
        result.resultCount = count
        // Shows the previous page number
        if (parseInt(req.query.page)!=1) {
            result.previous = previous
        }
        // Shows the next page number
        if (endIndex < count) {
            result.next = next
        }
        result.results = place
        res.status(200).send(result)
    } catch (e) {
        res.status(401).send({ "message": "you need to be a verified user" })
    }
})


// updating
// Edit a place -- (Tested) wip
router.patch('/place/:id', isVerified, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["title", "typeof", "description", "location", "time", "idealfor", "maxguest", "size", "rooms", "toilet", "price", "amenities", "accessibility", "rules", "unavailabledate", "deactivated", "phone"]
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(404).send({ error: 'Invalid updates!' })
    }

    try {
        const place = await Place.findOne({ _id: req.params.id, owner: req.user._id })

        if (!place) {
            return res.status(404).send({ "message": "place does not exist" })
        }

        updates.forEach((update) => place[update] = req.body[update])
        if (place.time.alwaysopen) {
            place.time.open = undefined
            place.time.close = undefined
        }
        await place.save()
        res.status(201).send({place, "message": "successfully updated" })
    } catch (e) {
        res.status(400).send({ "message": "failed to update" })
    }
})


//  Add a photo to place -- (Tested)
router.patch('/place/:id/photo', isVerified, async (req, res) => {
    const place = await Place.findOne({ _id: req.params.id, owner: req.user._id })
    const data = req.body
    const noOfImages = Media.find({ place: req.params.id }).countDocuments().exec()

    if (noOfImages>14) { // prevent image from uploading 15 images have been reached
        return res.status(400).send({ "message": `you have reached the limit of photos` })
    }

    try {
        const image = new Media({
            ...req.body,
            owner: req.user._id,
            place: req.params.id
        })
        await image.save() // saving image to its model named "Media" and referencing place that own the image

        place.img = true // once there is am image uploaded this must be set so it can show up in search results,
                        // as places without image dont show up in search result
        await place.save()
        res.status(201).send({ image, "message": "uploaded successfully" })
    } catch (e) {
        res.status(400).send({ "message": "failed to upload photo" })
    }
})


// delete a place -- (Tested)
router.delete('/place/:id', isVerified, async (req, res) => {
    const _id = req.params.id

    try {
        const images = await Media.find({ place: req.params.id, owner: req.user._id }) // getting all images to a place

        for (let image of images) {
            let key = image.key
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key
            }
            await s3.deleteObject(params).promise() // deleting image from S3
            await image.remove() // deleting image reference from DB
        }

        await Place.findOneAndDelete({ _id, owner: req.user._id }) // finally deleting the place
        res.status(204).send({ "message": "successfully deleted" })
    } catch (e) {
        res.status(400).send({ "message": "failed to delete" })
    }
})


// deactivate a place -- (Tested)
router.delete('/place/:id/active', isVerified, async (req, res) => {
    const _id = req.params.id

    try {
        const place = await Place.findOne({ _id, owner: req.user._id }) 
        place.deactivated = true
        await place.save()
        res.status(204).send({ "message": "successfully deactivated" })
    } catch (e) {
        res.status(400).send({ "message": "failed to deactivated" })
    }
})


// reactivate a place -- (Tested)
router.patch('/place/:id/active', isVerified, async (req, res) => {
    const _id = req.params.id

    try {
        const place = await Place.findOne({ _id, owner: req.user._id }) 
        place.deactivated = false
        await place.save()
        res.status(204).send({ "message": "successfully activate" })
    } catch (e) {
        res.status(400).send({ "message": "failed to activate" })
    }
})



// delete a place's photo -- (Tested)
router.delete('/photo/:id', isVerified, async (req, res) => {
    const _id = req.params.id

    try {
        const image = await Media.findOne({ _id, owner: req.user._id})
        const placeId = image.place
        let key = image.key
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        }
        await s3.deleteObject(params).promise() // delete image from s3
        await image.remove() // delete the media instance of the image

        const noOfImages = await Media.find({ place: placeId }).countDocuments().exec()
        if (!noOfImages>0) { // check if the place has no image
            const place = await Place.findOne({ _id: placeId, owner: req.user._id })
            place.img = false // This is set to prevent images without images from showing in search
            await place.save()
        }

        res.status(204).send({ "message": "image has been successfully deleted" })
    } catch (e) {
        res.status(400).send({ "message": "image failed to delete" })
    }
})

module.exports = router
