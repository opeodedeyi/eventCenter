const express = require('express')
const Place = require('../models/place')
const Media = require('../models/media')
const { isVerified } = require('../middleware/auth')
const { s3 } = require('../middleware/aws')
const router = new express.Router()
require('dotenv').config()


//  Create an event place -- (Tested)
router.post('/api/place', isVerified, async (req, res) => {
    const place = new Place({
        ...req.body,
        owner: req.user._id,
        deactivated: false,
    })

    try {
        await place.save()
        res.status(201).send(place)
    } catch (error) {
        res.status(400).send({ "message": "A required field was not filled", error })
    }
})


// get all places (search and filter and sorting done here) -- (Tested)
router.get('/api/place', async (req, res) => {
    const match = {
        deactivated: false,
        img: true // Only places with photos should show
    }
    const sort = {}

    // filters using if statements
    if (req.query.idealfor) {
        // Getting multiple ideal for
        const idealforarray = JSON.parse(req.query.idealfor) // OR req.query.idealfor.split(',')
        match.idealfor = { 
            $all: idealforarray 
        }
    } if (req.query.amenities) {
        // Getting multiple amenities
        const amenitiesarray = JSON.parse(req.query.amenities) // OR req.query.amenities.split(',')
        match.amenities = {
            $all: amenitiesarray 
        }
    } if (req.query.availabledate) {
        match.availabledate = { "$ne": req.query.availabledate }
    } if (req.query.typeof) {
        match.typeof = req.query.typeof
    } if (req.query.search) {
        match.$text = {$search: req.query.search}
        sort.score = {$meta: "textScore"}
    }

    const noOnPage = parseInt(req.query.limit) || 10
    const pageNo = (parseInt(req.query.page)-1)*parseInt(req.query.limit)
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
        res.status(400).send({ "message": "something went wrong please reload page" })
    }
})


// add a route to get all images to a place -- (Tested)
router.get('/api/place/:id/photo', async (req, res) => {
    try {
        const images = await Media.find({ place: req.params.id })
        res.status(200).send(images)
    } catch (e) {
        res.status(401).send({ "message": "something went wrong please reload page" })
    }
})


// get a single place -- (Tested)
router.get('/api/place/:id', async (req, res) => {
    try {
        const place = await Place.findById(req.params.id)
        res.status(200).send(place)
    } catch (e) {
        res.status(401).send({ "message": "something went wrong please reload page" })
    }
})


// get all logged in user's not deactivated place -- (Tested)
router.get('/api/myactiveplaces', isVerified, async (req, res) => {
    const noOnPage = parseInt(req.query.limit) || 10
    const pageNo = (parseInt(req.query.page)-1)*parseInt(req.query.limit)
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
router.get('/api/mydeactivatedplaces', isVerified, async (req, res) => {
    const noOnPage = parseInt(req.query.limit) || 10
    const pageNo = (parseInt(req.query.page)-1)*parseInt(req.query.limit)
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
// Edit a place -- (Tested)
router.patch('/api/place/:id', isVerified, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["title", "description", "maxguest", "size", "deactivated", "rules", "rooms", "toilet", "price", "phonenumber", "location", "typeof", "time"]
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
        await place.save()
        res.status(201).send({place, "message": "successfully updated" })
    } catch (e) {
        res.status(400).send({ "message": "failed to update" })
    }
})


//  Add a photo to place -- (Tested)
router.patch('/api/place/:id/photo', isVerified, async (req, res) => {
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
router.delete('/api/place/:id', isVerified, async (req, res) => {
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


// delete a place's photo -- (Tested)
router.delete('/api/photo/:id', isVerified, async (req, res) => {
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


// add to [addideal, amenities, accessibility, unavailabledate]
router.patch('/api/place/:id/list', isVerified, async (req, res) => {
    // [addideal, amenities, accessibility, unavailabledate]
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
        res.status(200).send({ "message": "successfully updated" })
    } catch (e) {
        res.status(400).send({ "message": "failed to update" })
    }
})


// remove from [addideal, amenities, accessibility, unavailabledate]
router.delete('/api/place/:id/list', isVerified, async (req, res) => {
    // [addideal, amenities, accessibility, unavailabledate]
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
        res.status(201).send({ "message": "successfully removed" })
    } catch (e) {
        res.status(400).send({ "message": "failed to remove" })
    }
})


module.exports = router
