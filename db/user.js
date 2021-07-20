const mongoose = require('mongoose')

const user = mongoose.Schema({
  identity: Object,
  pays: {
    type: Array,
    default: []
  },
  cart: {
    type: Object,
    default: {
      items: [],
      total: 0
    }
  },
  addreses: {
    type: Array,
    default: []
  },
  favorit: {
    type: Array,
    default: []
  },
  introduser: String,
  score: {
    type: Array,
    default: []
  },
  scoreUsed: {
    type: Number,
    default: 0
  }
})

module.exports = mongoose.model('User', user)
