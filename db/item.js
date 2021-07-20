const mongoose = require("mongoose")
const item = mongoose.Schema({
    id: String,
    name: String,
    mainCategory: Number,
    secondaryCategory: Number,
    off: Number,
    containOff: {
        type: Boolean,
        default: false
    },
    tags: Array,
    price: Number,
    sizes: Array,
    colors: Array,
    info: String,
    depo: {
        type: Boolean,
        default: true
    },
    view: {
        type: Number,
       dafult: 0
    }
})


module.exports = mongoose.model("Item", item)