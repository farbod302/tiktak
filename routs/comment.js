const express = require('express')
const router = express.Router()
const { getBody } = require("../helperFunc")
const Comment = require("../db/comments")
const Item = require("../db/item")

router.post("/add_comment", async (req, res) => {
    const data = getBody(req.body)
    const { userId, itemId, comment, score, userName } = data
    let newComment = {
        userId, itemId, score, userName
    }
    let item = await Item.findOne({ id: itemId }),
        sell = item.status.sell
    if (!sell.includes(userId)) {
        res.json({ status: false })
        return
    }
    var prv = await Comment.find({ userId: userId, itemId: itemId }).count()
    if (prv > 0) {
        res.json({ status: "duplicate comment" })
        return
    }
    if (comment) {
        newComment["comment"] = comment
    }
    new Comment(newComment).save().then(() => {
        res.json({ status: true })
        return
    })
})

router.post("/get_comments", async (req, res) => {
    const data = getBody(req.body)
    const { itemId } = data
    let comments = await Comment.find({ itemId: itemId }),
        score = 0
    comments.forEach(each => score += each.score)
    let finalScore = 0
    if (score === 0) {
        finalScore = 0
    }
    else {
        finalScore = score / comments.length
    }
    res.json({
        comments,
        score: finalScore
    })

})



module.exports = router