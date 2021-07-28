const mongoose = require('mongoose')
const off = mongoose.Schema({

    code: String,
    amount: Number,
    use: {
        type: Boolean,
        default: false
    },
    user: String,
    dep: Number

})

module.exports = mongoose.model('Off', off)
