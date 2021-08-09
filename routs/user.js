const express = require('express')
const User = require('../db/user')
const Shop = require('../db/shop')
const Off = require('../db/off')
const router = express.Router()
const { getBody, api, addScoreToIntroduser, calcOff } = require('../helperFunc')
const { uid } = require('uid')
var request = require('request');
const Item = require('../db/item')
const Blog = require('../db/blog')
const Bug = require('../db/bug')


router.post('/add_to_cart', async (req, res) => {
    const data = getBody(req.body)
    // item = {
    //     id: "شناسه کالا",
    //     color: "رنگ کالا",
    //     size: "سایز کالا"
    //     amount : "تعداد"
    // }

    const { id, item } = data
    let { cart } = await User.findById(id, { cart: 1 })
    let exist = []
    await cart.forEach(each => exist.push(each.id))
    if (exist.includes(item.id)) {
        res.json({ status: false })
        return
    }

    let result = await User.findByIdAndUpdate(id, { $push: { cart: item } })
    if (!result) {
        res.json({ status: false })
        return
    }
    res.json({ status: true })
})


router.post('/contain_off', async (req, res) => {
    var itemIds = []
    const data = getBody(req.body),
        { id } = data,
        user = await User.findById(id, { cart: 1 })
    user.cart.map(each => itemIds.push(each.id))
    var off = await Item.find({ id: { $in: itemIds }, containOff: true })
    if (off.length > 0) {
        res.json(true)
        return
    }
    res.json(false)


})


router.post("/get_cart", async (req, res) => {
    const data = getBody(req.body)
    const { id } = data

    let itemList = []
    let user = await User.findById(id, { cart: 1 })
    
    if (!user) {
        res.json({ status: false })
        return
    }
    let cart = user.cart
    await cart.forEach(each => {
        itemList.push(each.id)
    })

    var itemsInCart = await Item.find({ id: { $in: itemList } })

    var finalList = [],
        total = 0,
        notDepo = []

    await itemsInCart.forEach(each => {
        if (!each.depo) {
            return notDepo.push(each.id)
        }
        finalList.push({
            id: each.id,
            img: `http://localhost:4545/item/${each.id}/1.jpg`,
            amount: cart.find(item => item.id === each.id).amount,
            color: cart.find(item => item.id === each.id).color,
            size: cart.find(item => item.id === each.id).size,
            price: each.price,
            off: each.off,
            name: each.name
        })
        let itemPrice = calcOff(each.price, each.off) * cart.find(item => item.id === each.id).amount
        return total += itemPrice
    })
    if (notDepo.length !== 0) {

        cart = await cart.filter(each => !each.id.includes(notDepo))
        await User.findByIdAndUpdate(id, { $set: { cart: cart } })
    }
    await res.json({
        items: finalList,
        total
    })

})

router.post("/remove_from_cart", (req, res) => {
    const data = getBody(req.body)
    const { id, itemId } = data
    User.findById(id).then(result => {
        if (!result) {
            res.json({ status: false })
            return
        }
        var cart = [...result.cart],
            newItems = cart.filter(each => each.id !== itemId)
        User.findByIdAndUpdate(id, { $set: { cart: newItems } }).then(result => {
            if (result) {
                res.json({ status: true })
                return
            }
            res.json({ status: false })
            return
        })

    })
})

router.post('/create_pay', async (req, res) => {
    const data = getBody(req.body)
    const { id, off, price, pay, addres } = data
    var user = await User.findById(id, { cart: 1, identity: 1 })
    var items = user.cart,
        phone = user.identity['phone'],
        orderId = uid(6)


    var options = {

        method: 'POST',
        url: 'https://api.idpay.ir/v1.1/payment',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': '69e288bc-b987-43a3-a866-17e26b0136b8',
            "X-SANDBOX": "true"


        },
        body: {
            'order_id': orderId,
            'amount': price * 10,
            'phone': phone,
            'desc': `خرید  ${id}`,
            'callback': `${api}/user/pay_res`,
        },
        json: true,
    }

    await request(options, async function (error, response, body) {

        const shopId = body.id
        const newShop = {
            user: id,
            orderId,
            shopId,
            items,
            amount: price,
            total: pay,
            date: Date.now(), addres
        }
        { off ? newShop["off"] = off : null }
        await new Shop(newShop).save()
        res.json({
            status: true,
            link: body.link
        })
    })
})


router.post('/pay_res', async (req, res) => {
    const { status, order_id, id } = req.body
    const backUrl = "https://tiktakstyle.ir/#/payres"
    const pay = await Shop.findOne({ orderId: order_id })
    const user = pay.user
    var off = pay.off
    var itemIds = []
    await pay.items.map(each => itemIds.push(each.id))
    if (pay.use === true || status !== "10") {
        await Shop.findOneAndUpdate({ orderId: order_id }, { $set: { use: true } })
        res.redirect(`${backUrl}/pay_result?status=false&id=0`)
    }
    else {
        var options = {
            method: 'POST',
            url: 'https://api.idpay.ir/v1.1/payment/verify',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': '69e288bc-b987-43a3-a866-17e26b0136b8',
                "X-SANDBOX": "true"
            },
            body: {
                'id': id,
                'order_id': order_id,
            },
            json: true,
        };
        await request(options, async function (error, response, body) {
            if (error) {
                res.redirect(`${backUrl}/pay_result?status=false&id=0`)
                return
            }
            if (body.track_id && body.status === 100) {
                await Shop.findOneAndUpdate({ orderId: order_id }, { $set: { used: true, status: 1, trackId: body.track_id } })
                if (off) {
                    await Off.findOneAndUpdate({ code: off }, { $set: { use: true } })
                }
                console.log(itemIds);
                await Item.updateMany({ id: { $in: itemIds } }, { $push: { "status.sell": user } })
                await addScoreToIntroduser(user)
                await User.findByIdAndUpdate(user, { $set: { cart: [] } })
                res.redirect(`${backUrl}/pay_result?status=true&id=${body.track_id}`)
            }
        })
    }
})



router.post('/validate_off', async (req, res) => {
    const data = getBody(req.body)
    const { code, user } = data
    var off = await Off.findOne({ code: code })
    console.log(off);
    if (!off || off.user !== user || off.dep < Date.now() || off.use === true) {
        res.json({ status: false, amount: 0 })
        return
    }
    res.json({ status: true, amount: off.amount })

})

router.post('/get_user_addreses', async (req, res) => {
    const data = getBody(req.body)
    const { user } = data
    const selectedUser = await User.findById(user, { addreses: 1 })
    res.json({ status: true, addreses: selectedUser.addreses })

})

router.get('/blogs', (req, res) => {
    Blog.find({}).then((result) => { res.json(result) })
})



router.post('/add_new_addres', async (req, res) => {
    const data = getBody(req.body)
    const { user, address } = data
    let sUser = await User.findById(user)
    if (sUser.addreses.length === 5) {
        res.json({ status: false })
        return
    }
    await User.findByIdAndUpdate(user, { $push: { addreses: address } })
    res.json({ statsu: true })

})


router.post('/get_user_from_phone', async (req, res) => {
    const { phone } = req.body
    var user = await User.findOne({ "identity.phone": phone })
    if (!user) {
        res.json({ name: "ناشناس" })
    }
    else {
        res.json({ name: `${user.identity.name} ${user.identity.lastName}` })
    }
})


router.post('/add_to_favorite', (req, res) => {
    const data = getBody(req.body),
        { item, user, op } = data

    if (op) {
        User.findByIdAndUpdate(user, { $push: { favorit: item } }).then(() => {
            res.json({ status: true })
            return
        }).catch(() => {
            res.json({ status: false })
        })
    }
    else {
        User.findByIdAndUpdate(user, { $pull: { favorit: item } }).then(() => {
            res.json({ status: true })
            return
        }).catch(() => {
            res.json({ status: false })
        })
    }

})


router.post("/report_bug", async (req, res) => {
    const { userId, bug } = getBody(req.body)
    const count = await Bug.find({ user: userId }).count()
    if (count > 6) {
        res.json({ status: false })
    }
    new Bug({ user: userId, bug }).save().then(() => {
        res.json({ status: true })
    })

})

router.get("/bugs", async (req, res) => {
    const bugs = await Bug.find({})
    res.json(bugs)
})



router.post("/get_user_pays", (req, res) => {
    const data = getBody(req.body),
        { userId } = data
    Shop.find({ user: userId, status: { $gt: 0 } }).then(result => {
        res.json(result)
    })

})

module.exports = router