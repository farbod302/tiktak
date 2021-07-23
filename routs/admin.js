const express = require('express')
const router = express.Router()
const { uid } = require('uid')
const { addImgs, multItems, removeImgs, createOffCode } = require('../helperFunc')
const Item = require('../db/item')
const User = require('../db/user')
const TrezSmsClient = require("trez-sms-client");
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
        , off, tags, price, sizes, colors, info, depo, containOff
    }
    var itemImgs = [...imgs]
    itemImgs.push(mainImg)
    await addImgs(id, itemImgs)
    // var allTypes = multItems(sizes, colors)
    // newItem['allTypes'] = allTypes

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
    const { user, amount, day } = req.body
    var selectedUser
    { user ? selectedUser = user : selectedUser = "0" }
    var code = await createOffCode(selectedUser, amount, day)
    res.json({
        status: true,
        code
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

module.exports = router