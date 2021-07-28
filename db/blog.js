const mongoose = require('mongoose')
const blog = mongoose.Schema({
    id: String,
    title: String,
    text: String

})

module.exports = mongoose.model('Blog', blog)
