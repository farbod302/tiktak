const express = require('express')
const router = express.Router()
const View = require('../db/view')
const Shop = require('../db/shop')
const { mountGenerator, getMountAndYear } = require('../helperFunc')


router.get("/", async (req, res) => {
    var today = new Date()
    today.setHours(0)
    today.setMinutes(0)
    today.setSeconds(0)
    today.setMilliseconds(0)
    var result = await View.findOneAndUpdate({ date: today.valueOf() }, { $inc: { view: 1 } })
    if (!result) {
        new View({
            date: today.valueOf()
        }).save().then(res.json(true))
        return
    }
    res.json(true)
    return
})

router.get('/view_chart_data', async (req, res) => {

    const lastSixMounthFilds = await mountGenerator(),
        oneMounth = 2592000000
    var lastSixMounthRecords = await View.find({ date: { $gt: Date.now() - (oneMounth * 5) } })
    lastSixMounthRecords.forEach((each, index) => {
        var mounthAndYear = getMountAndYear(each.date)
        const fildIndex = lastSixMounthFilds.findIndex(each => each.dateString === mounthAndYear)
        lastSixMounthFilds[fildIndex].value += each.view
        if (index + 1 === lastSixMounthRecords.length) {
            res.json(lastSixMounthFilds)
        }
    })


})

router.get('/sell_chart_data', async (req, res) => {

    const lastSixMounthFilds = await mountGenerator(),
        oneMounth = 2592000000
    var lastSixMounthRecords = await Shop.find
        ({
            date: { $gt: Date.now() - (oneMounth * 5) },
            status: { $gt: 0 }
        }
            , { date: 1, amount: 1 })
    lastSixMounthRecords.forEach((each, index) => {
        var mounthAndYear = getMountAndYear(each.date)
        const fildIndex = lastSixMounthFilds.findIndex(each => each.dateString === mounthAndYear)
        lastSixMounthFilds[fildIndex].value += each.amount
        if (index + 1 === lastSixMounthRecords.length) {
            res.json(lastSixMounthFilds)
        }
    })


})


router.post('/item_view', (req, res) => {
    const data = getBody(req.body)
    const { id } = data
    Item.findOneAndUpdate({ id: id }, { $inc: { view: 1 } }).then(res.json(true))
})


router.post("/item_sell", (req, res) => {
    const data = getBody(req.body)
    const { id } = data
    Shop.find({ "items.id": id, status: { $gt: 0 } }).count()
        .then(result => { res.json(result) })

})

router.post('/item_favor', (req, res) => {
    const data = getBody(req.body)
    const { id } = data
    user.find({ favor: id }).count()
        .then(result => { res.json(result) })
})

module.exports = router