const express = require('express')
const User = require('../db/user')
const Shop = require('../db/shop')
const Off = require('../db/off')
const router = express.Router()
const { getBody, api, addScoreToIntroduser } = require('../helperFunc')
const { uid } = require('uid')
var request = require('request');
const Item = require('../db/item')


router.post('/add_to_cart', async (req, res) => {
    const data = getBody(req.body)
    // item = {
    //     id: "شناسه کالا",
    //     color: "رنگ کالا",
    //     size: "سایز کالا"
    //     amount : "تعداد"
    // }


    const { id, item, price } = data
    console.log(data);
    await User.findByIdAndUpdate(id, { $push: { "cart.items": item }, $inc: { "cart.total": price * item.amount } })
    res.json(true)
})


router.post('/contain_of',async (req, res) => {
    var itemIds = []
    const data = getBody(req.body),
        { id } = data,
        user = await User.findById(id, { cart: 1 })
    user.cart.items.map(each => itemsIds.push(each.id))
    var off = await Item.find({ id: { $inc: itemIds }, containOff: true })
    if (off.length > 0) {
        res.json(true)
        return
    }
    res.json(false)


})

router.post('/create_pay', async (req, res) => {
    const data = getBody(req.body)
    const { id, off, price } = data
    var user = await User.findById(id, { cart: 1, identity: 1 })
    var items = user.cart.items,
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
            price,
            date: Date.now()
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
                await Shop.findOneAndUpdate({ orderId: order_id }, { $set: { use: true, status: 1, trackId: body.track_id } })
                if (off) {
                    await Off.findOneAndUpdate({ code: off }, { $set: { use: true } })
                }
                await addScoreToIntroduser(user)
                res.redirect(`${backUrl}/pay_result?status=true&id=${body.track_id}`)
            }
        })
    }
})



router.post('/validate_off', async (req, res) => {
    const data = getBody(req.body)
    const { code, user } = data
    var off = await Off.findOne({ code: code })
    if (!off || off.user !== user || off.dep < Date.now()) {
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


router.post('/add_new_addres', async (req, res) => {
    const data = getBody(req.body)
    const { user, address } = data
    await User.findByIdAndUpdate(user, { $push: { addreses: address } })
    res.json({ statsu: true })

})




module.exports = router