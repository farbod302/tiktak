const mongoose = require('mongoose')
const bug = mongoose.Schema({

    user: String,
    bug: String

})

module.exports = mongoose.model('Bug', bug)
