const mongoose = require('mongoose')

const shop = mongoose.Schema({

    user: String,
    items: Array,
    amount: Number,
    off: String,
    total: Number,
    addres: Object,
    used: {
        type: Boolean,
        default: false
    },
    orderId: String,
    shopId: String,
    status: {
        type: Number,
        default: 0
    },
    trackId: {
        type: String,
        defult: "0"
    },
    date: Number,
    orderType: Boolean,
    adrres: String


})

module.exports = mongoose.model('Shop', shop)
