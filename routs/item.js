const express = require('express')
const router = express.Router()
const Item = require('../db/item')
const user = require('../db/user')
const User = require('../db/user')
const { getBody, pagination, calcPagination, getRecomendItems } = require('../helperFunc')



router.get('/all_items', (req, res) => {
    var allItems = Item.find({ depo: true }, { info: 0, tags: 0, containOff: 0, depo: 0 })
    allItems.then(result => { res.json({ status: true, items: result }) })
})

//برگرداندن ایتم های یک کتگوری خاص مثلا کفش مجلسی به تعداد مشخص
router.post('/category_items', (req, res) => {
    const data = getBody(req.body)
    const { mainCategory, seconderyCategory, pageIndex, perPage } = data
    var items = Item.find(
        { mainCategory: mainCategory, seconderyCategory: seconderyCategory, depo: true },
        { name: 1, price: 1, off: 1, mainImg: 1, }
    )
    if (!pageIndex && pageIndex <= 0) {
        items.then(result => res.json({ status: true, items: result }))
            .catch(() => { res.json({ status: false, items: [] }) })
    }
    else {
        items.then(result => {
            res.json({ status: true, items: pagination(perPage, pageIndex, result) })
                .catch(() => { res.json({ status: false, items: [] }) })
        })
    }
})

router.post('/page_count', (req, res) => {
    const data = getBody(req.body)
    const { mainCategory, seconderyCategory, perPage } = data
    let count
    {
        seconderyCategory && mainCategory ?
            count = Item.find({ mainCategory: mainCategory, seconderyCategory: seconderyCategory, depo: true }).count()
            :
            count = Item.find({ depo: true }).count()
    }
    count.then(result => {
        res.json({ status: true, page: calcPagination(result, perPage) })
    }).catch(() => { res.json({ status: false, count: 0 }) })
})


router.post('/view', async (req, res) => {
    var
        data = getBody(req.body),
        { id, fastView, userId } = data,
        item,

        favorite = false
    if (userId) {
        var user = await User.findById(userId, { favorit: 1 })
        if (user.favorit.includes(id)) {
            favorite = true
        }

    }
    {
        fastView ?
            item = Item.findOne({ id: id }, { name: 1, price: 1, colors: 1, sizes: 1 })
            :
            item = Item.findOne({ id: id })
    }
    item.then(result => {
        res.json({ status: true, item: result, favorite })
    }).catch(() => { res.json({ status: false, item: {} }) })
})






router.post('/recomandation', async (req, res) => {

    const data = getBody(req.body)
    const { item } = data
    var selectedItem = await Item.findOne({ id: item }, { tags: 1 }),
        tags = selectedItem.tags
    if (tags) {
        var recItemIds = await getRecomendItems(tags, data.item)
        var items = []
        recItemIds.map(async (each, index) => {
            var item = await Item.findOne({ id: each })
            items.push(item)
            if (index === recItemIds.length - 1) {
                res.json({ status: true, items: items.sort((a, b) => { return b.off - a.off }) })
            }
        })

    }


})




router.get("/main_page", async (req, res) => {

    var allItems = await Item.find({ depo: true }, { status: 1, name: 1, price: 1, off: 1, id: 1, imgs: 1 })
    var sorted = []
    var lastItems = []
    sorted = allItems.sort((a, b) => { return b.status.date - a.status.date })
    for (let i = 0; i <= 9; i++) {
        if (sorted.length - 1 >= i) {
            lastItems.push(sorted[i])
        }
    }
    var offItem = []
    sorted = allItems.sort((a, b) => { return b.off - a.off })
    for (let i = 0; i <= 9; i++) {
        if (sorted.length - 1 >= i) {
            offItem.push(sorted[i])
        }
    }
    var mostSell = []
    sorted = allItems.sort((a, b) => { return b.status.sell.length - a.status.sell.length })
    for (let i = 0; i <= 9; i++) {
        if (sorted.length - 1 >= i) {
            mostSell.push(sorted[i])
        }
    }
    var result = {
        lastItems, offItem, mostSell
    }
    res.json(result)
})


module.exports = router