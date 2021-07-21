const express = require('express')
const router = express.Router()
const Item = require('../db/item')
const { getBody, pagination, calcPagination, getRecomendItems } = require('../helperFunc')



router.get('/all_items', (req, res) => {
    var allItems = Item.find({ depo: true }, { name: 1, price: 1, off: 1, mainImg: 1, })
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


router.post('/view', (req, res) => {
    var
        data = getBody(req.body),
        { id, fastView } = data,
        item
    {
        fastView ?
            item = Item.findOne({ id: id }, { name: 1, price: 1, colors: 1, sizes: 1 })
            :
            item = Item.findOne({ id: id })
    }
    item.then(result => {
        res.json({ status: true, item: result })
    }).catch(() => { res.json({ status: false, item: {} }) })
})




router.post('/recomandation', async (req, res) => {

    const data = getBody(req.body)
    const { item } = data
    var selectedItem = await Item.findOne({ id: item }, { tags: 1 }),
        tags = selectedItem.tags
    if (tags) {
        var recItemIds = await getRecomendItems(tags)
        var items = await Item.find({ id: { $in: recItemIds } })
        res.json({ status: true, items })
    }


})



module.exports = router