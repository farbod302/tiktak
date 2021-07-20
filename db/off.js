const mongoose = require('mongoose')
//test
const off = mongoose.Schema({

    code: String,
    amount: Number,
    use: {
        type: Boolean,
        default: false
    },
    user: String,
    dip: Number

})

module.exports = mongoose.model('Off', off)
