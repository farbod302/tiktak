const mongoose = require('mongoose')

const view = mongoose.Schema({

    date: Number,
    view: {
        type: Number,
        default: 1
    }

})

module.exports = mongoose.model('View', view)
