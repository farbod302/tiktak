const express = require('express')
const router = express.Router()
const { uid } = require('uid')
const { addImgs, multItems, removeImgs, createOffCode, addBlogImg, api, phoneValidator } = require('../helperFunc')
const Item = require('../db/item')
const User = require('../db/user')
const Shop = require('../db/shop')
const Blog = require('../db/blog')
const View = require('../db/view')
const TrezSmsClient = require("trez-sms-client");
const Off = require('../db/off')
const client = new TrezSmsClient("daaraan", "81912601320");



router.post('/add_item', async (req, res) => {
    const id = uid(5)
    const {
        name, mainCategory, secondaryCategory
        , off, tags, price, sizes, colors
        , mainImg, imgs, info, depo, containOff } = req.body

    var newItem = {
        id: id,
        name, mainCategory, secondaryCategory
        , off, tags, price, sizes, colors, info, depo, containOff,
        status: {
            view: 0,
            sell: [],
            date: Date.now()
        }
    }
    var itemImgs = [...imgs]
    itemImgs.push(mainImg)
    await addImgs(id, itemImgs)
    // var allTypes = multItems(sizes, colors)
    // newItem['allTypes'] = allTypes
    var imgsList = []
    for (let i = 1; i <= 5; i++) {
        imgsList.push(`${api}/item/${id}/${i}.jpg`)
    }
    newItem['imgs'] = imgsList

    new Item(newItem).save().then(() => {
        res.json(true)
    })

})


// router.post('/add_depo', async (req, res) => {
//     const { item, color, size, depo } = req.body
//     var selectItem = await Item.findOne({ id: item }, { allTypes: 1 })
//     var allTypes = [...selectItem.allTypes]
//     var index = allTypes.findIndex(each => each.color === color && each.size === size)
//     if (index === -1) {
//         res.json(false)
//         return
//     }
//     allTypes[index].depo += depo
//     if (allTypes[index].depo < 0) {
//         allTypes[index].depo = 0
//     }
//     Item.findOneAndUpdate({ id: item }, { $set: { allTypes: allTypes } }).then(result => {
//         res.json(true)
//     })
// })


router.post('/edit_item_info', async (req, res) => {
    const { id, name, mainCategory, secondaryCategory
        , off, tags, price, info, sizes, colors, containOff, depo } = req.body

    var item = await Item.findOne({ id: id })
    item.name = name
    item.mainCategory = mainCategory
    item.secondaryCategory = secondaryCategory
    item.off = off
    item.tags = tags
    item.price = price
    item.info = info
    item.colors = colors
    item.sizes = sizes
    item.containOff = containOff
    item.depo = depo
    item.save().then(() => {
        res.json(true)
    })

})


router.post('/edit_item_types', async (req, res) => {
    const { id, colors, sizes } = req.body
    var item = await Item.findOne({ id: id })
    var allTypes = multItems(sizes, colors)
    item.allTypes = allTypes
    item.save().then(() => {
        res.json(true)
    })
})


router.post('/edit_item_img', async (req, res) => {
    const { id, mainImg, imgs } = req.body
    var allImgs = [...imgs]
    allImgs.push(mainImg)
    await removeImgs(id)
    await addImgs(id, allImgs)
    res.json(true)
})


router.post('/create_off_code', async (req, res) => {
    const { user, amount, day, sendSms } = req.body
    console.log(req.body);
    var selectedUser
    { user ? selectedUser = user : selectedUser = "0" }
    var code = await createOffCode(selectedUser, amount, day)
    console.log(phoneValidator(user), sendSms);
    if (phoneValidator(user) !== false && sendSms === true) {
        let msg =
            `مشتری عزیز کد تخفیف ${amount} تومانی خرید از اپ و وب سایت تیک تاک برای شما ایجاد شد
کدتخفیف شما:
${code.code}
مهلت استفاده ${day} روز
tiktakstyle.ir
`
        await client.manualSendCode(user, msg)
    }
    res.json({
        status: true,
        code: code.code,
        dep: code.dep
    })

})


router.post('/send_sms', async (req, res) => {
    const { msg } = req.body
    var users = await User.find({}, { identity: 1 })
    var phones = []
    users.forEach(each => phones.push(each.identity.phone))
    phones.map((each, index) => {
        setTimeout(() => {
            client.manualSendCode(each, msg)
                .then(() => {
                    if (index + 1 === phones.length) {
                        res.json(true)
                    }
                })
                .catch(() => {
                    if (index + 1 === phones.length) {
                        res.json(true)
                    }
                });

        }, (index + 1) * 500)
    })
})


router.post('/contain_off', async (req, res) => {
    const { mainCategory, secondaryCategory, containe } = req.body
    if (mainCategory === -1) {
        await Item.updateMany({}, { $set: { containOff: containe } })
        res.json(true)
    }
    else {
        if (secondaryCategory === -1) {
            await Item.updateMany({ mainCategory: mainCategory }, { $set: { containOff: containe } })
            res.json(true)

        }
        else {
            await Item.updateMany({ mainCategory: mainCategory, secondaryCategory: secondaryCategory }, { $set: { containOff: containe } })
            res.json(true)
        }
    }
})


router.post('/item_search', async (req, res) => {
    const { name, id } = req.body
    var items = await Item.find({}, { name: 1, id: 1 })
    if (name) {
        items = items.filter(each => each.name.indexOf(name) > -1)
    }
    if (id) {
        items = items.filter(each => each.id.indexOf(id) > -1)
    }
    await res.json(items)

})



router.post("/get_pays", async (req, res) => {
    const { status } = req.body
    var pays
    if (status) {
        pays = await Shop.find({ status: status }, { items: 1, user: 1, status: 1, amount: 1, orderType: 1, date: 1, trackId: 1 })
    }
    else {
        pays = await Shop.find({}, { items: 1, user: 1, status: 1, amount: 1, orderType: 1, date: 1, trackId: 1 })

    }
    res.json(pays)
})


router.get('/off_list', async (req, res) => {
    const offs = await Off.find({})
    res.json(offs)
})



router.post('/add_blog', async (req, res) => {


    const { img, title, text } = req.body
    const id = uid(4)
    const newBlog = {
        id,
        title,
        text
    }
    await addBlogImg(img, id)

    new Blog(newBlog).save().then(() => { res.json(true) })


})

router.post('/delete_blog', (req, res) => {
    const { id } = req.body
    Blog.findOneAndRemove({ id: id }).then(() => {

        res.json(true)
    })
})


router.get('/summery', async (req, res) => {
    let oneMounth = 2592000000,
        shops = await Shop.find({ status: { $gt: 0 } }),
        views = await View.find({}),
        items = await Item.find({}),
        user = await User.find({}).count(),
        result = {
            view: {
                allView: 0,
                allUser: user,
                last30View: 0
            },
            sell: {
                sellAmount: shops.length,
                sellPrice: 0,
                todaySell: 0,
            },
            items: {
                allItems: items.length,
                depoItems: items.filter(each => each.depo === true).length,
                notDepoItems: items.filter(each => each.depo === false).length,
            }

        }
    let all = 0
    await views.forEach(each => all += each.view)
    result.view["allView"] = all
    all = 0
    let now = Date.now(),
        lastMonth = now - oneMounth,
        lastDay = now - (1000 * 60 * 60 * 24)
    views = views.filter(each => each.date > lastMonth)
    await views.forEach(each => all += each.view)
    result.view["last30View"] = all
    all = 0
    await shops.forEach(each => all += each.amount)
    result.sell["sellPrice"] = all
    all = 0
    shops = shops.filter(each => each.date > lastDay)
    await shops.forEach(each => all += each.amount)
    result.sell["todaySell"] = all

    await res.json(result)





})


module.exports = router