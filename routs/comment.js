const express = require('express')
const router = express.Router()
const { getBody } = require("../helperFunc")
const Comment = require("../db/comments")
const Item = require("../db/item")

router.post("/add_comment", async (req, res) => {
    const data = getBody(req.body)
    const { userId, itemId, comment, score } = data
    let newComment = {
        userId, itemId, score
    }
    let item = await Item.findOne({ id: itemId }),
        sell = item.status.sell
    if (!sell.includes(userId)) {
        res.json({ status: false })
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
    comments.forEach(each => comments += each.score)
    res.json({
        comments,
        score: score / comments.length
    })

})



module.exports = router