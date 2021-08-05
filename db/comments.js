const mongoose = require('mongoose')
const comment = mongoose.Schema({
    userId: String,
    itemId: String,
    score: Number,
    comment: String

})

module.exports = mongoose.model('Comment', comment)
