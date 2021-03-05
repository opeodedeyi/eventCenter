const express = require('express')
const Comment = require('../models/comment')
const { isVerified } = require('../middleware/auth')
const router = new express.Router()


//  Comment on a place or reply a comment -- (Tested)
router.post('/api/place/:id/comment', isVerified, async (req, res) => {
    try {
        const postId = req.params.id
        const comment = new Comment({
            ...req.body,
            owner: req.user._id,
            comment: postId,
            reply: null
        })
        await comment.save()
        res.status(201).send(comment)
    } catch (e) {
        res.status(500).send(e)
    }
})


//  edit a comment or reply -- (Tested)
router.patch('/api/comment/:id/edit', isVerified, async (req, res) => {
    try {
        const commentId = req.params.id
        const comment = await Comment.findOne({ owner: req.user._id, _id: commentId })
        comment.content = req.body.content
        await comment.save()
        res.status(201).send(comment)
    } catch (e) {
        res.status(500).send({ e, "message": "something went wrong" })
    }
})


//  delete a comment or reply -- (Tested)
router.delete('/api/comment/:id', isVerified, async (req, res) => {
    try {
        const postId = req.params.id
        await Comment.find({ reply: postId }).deleteMany()
        await Comment.findOneAndDelete({ owner: req.user._id, _id: postId })
        res.status(204).send()
    } catch (e) {
        res.status(500).send(e)
    }
})


//  Reply a Comment -- (Tested)
router.post('/api/comment/:id/reply', isVerified, async (req, res) => {
    try {
        const commentId = req.params.id
        const reply = new Comment({
            ...req.body,
            owner: req.user._id,
            comment: null,
            reply: commentId
        })
        await reply.save()
        res.status(201).send(reply)
    } catch (e) {
        res.status(500).send(e)
    }
})


//  like a Comment -- (Tested)
router.post('/api/comment/:id/like', isVerified, async (req, res) => {
    try {
        const commentId = req.params.id
        const comment = await Comment.findById(commentId)
        comment.likers.addToSet(req.user._id)
        await comment.save()
        res.status(201).send(comment)
    } catch (e) {
        res.status(500).send(e)
    }
})


//  unlike a Comment -- (Tested)
router.delete('/api/comment/:id/like', isVerified, async (req, res) => {
    try {
        const commentId = req.params.id
        const comment = await Comment.findById(commentId)
        comment.likers.pull(req.user._id)
        await comment.save()
        res.status(201).send(comment)
    } catch (e) {
        res.status(500).send(e)
    }
})


// get all comments to a post/ place -- (Tested)
router.get('/api/place/:id/comment', async (req, res) => {
    const postId = req.params.id
    const noOnPage = parseInt(req.query.limit) || 10
    const pageNo = (parseInt(req.query.page)-1)*parseInt(req.query.limit)
    const endIndex = parseInt(req.query.page)*parseInt(req.query.limit)
    const next = parseInt(req.query.page)+1
    const previous = parseInt(req.query.page)-1
    try {
        const count = await Comment.find({comment: postId}).countDocuments().exec()
        const comment = await Comment.find({comment: postId})
        .limit(noOnPage)
        .skip(pageNo)

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

        result.results = comment
        res.status(200).send(result)
    } catch (e) {
        res.status(400).send()
    }
})


// get all replies to a comment -- (Tested)
router.get('/api/comment/:id/reply', async (req, res) => {
    const commentId = req.params.id
    const noOnPage = parseInt(req.query.limit) || 10
    const pageNo = (parseInt(req.query.page)-1)*parseInt(req.query.limit)
    const endIndex = parseInt(req.query.page)*parseInt(req.query.limit)
    const next = parseInt(req.query.page)+1
    const previous = parseInt(req.query.page)-1
    try {
        const count = await Comment.find({reply: commentId}).countDocuments().exec()
        const replies = await Comment.find({reply: commentId})
        .limit(noOnPage)
        .skip(pageNo)

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

        result.results = replies
        res.status(200).send(result)
    } catch (e) {
        res.status(400).send()
    }
})


module.exports = router
