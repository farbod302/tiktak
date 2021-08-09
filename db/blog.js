const mongoose = require('mongoose')
const blog = mongoose.Schema({
    id: String,
    title: String,
    text: String,
    date: Number

})

module.exports = mongoose.model('Blog', blog)
