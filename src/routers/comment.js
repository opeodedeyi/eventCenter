const express = require('express')
const Comment = require('../models/comment')
const { isVerified } = require('../middleware/auth')
const router = new express.Router()


//  Comment on a place/ reply
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


//  edit a comment/ reply
router.patch('/api/comment/:id', isVerified, async (req, res) => {
    try {
        const commentId = req.params.id
        const comment = await Comment.findOne({ owner: req.user._id, _id: commentId })
        comment.content = req.body.content
        await comment.save()
        res.status(201).send(comment)
    } catch (e) {
        res.status(500).send(e)
    }
})


//  delete a comment/ reply
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


//  Reply a Comment
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


//  like a Comment
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


//  unlike a Comment
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


// get all comments to a post/ place
router.get('/api/place/:id/comment', async (req, res) => {
    const postId = req.params.id
    try {
        const comment = await Comment.find({comment: postId})
        res.status(200).send(comment)
    } catch (e) {
        res.status(400).send()
    }
})


// get all replies to a comment
router.get('/api/comment/:id/reply', async (req, res) => {
    const commentId = req.params.id
    try {
        const replies = await Comment.find({reply: commentId})
        res.status(200).send(replies)
    } catch (e) {
        res.status(400).send()
    }
})


module.exports = router
