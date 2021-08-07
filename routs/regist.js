const express = require('express')
const router = express.Router()
const User = require("../db/user")
const TrezSmsClient = require("trez-sms-client");
const { phoneValidator, getBody, checkOrgin } = require('../helperFunc');
const jwt = require('jsonwebtoken');
const encryptor = require('simple-encryptor')(process.env.ENCRYPT_KEY);

const client = new TrezSmsClient("daaraan", process.env.SMS);

router.post('/check', async (req, res) => {
    var data = getBody(req.body)
    const { phone, web } = data
    var validPhone = phoneValidator(phone)
    if (!validPhone) {
        await res.json({
            valid: false,
            code: null,
            status: false
        })
        return
    }
    var user = await User.findOne({ "identity.phone": validPhone })
    const randomNum = Math.floor(Math.random() * 89999) + 10000
    await client.manualSendCode(validPhone, `کد تایید ورود به برنامه:${randomNum}`)
    var status
    { user ? status = true : status = false }
    if (web) {
        await res.json({
            valid: true,
            code: encryptor.encrypt(randomNum),
            status
        })
        return
    }
    await res.json({
        valid: true,
        code: randomNum,
        status
    })
    return
})
//ثبت نام
router.post('/sign_up', async (req, res) => {
    var data = getBody(req.body)
    const { name, lastName, phone, birthday, introduser } = data
    var user = await User.findOne({ "identity.phone": phone })
    if (user) {
        res.json({ status: false })
        return
    }
    const { day, month } = birthday
    var identity = {
        name, lastName, phone,
        birthday: {
            month: Number(month),
            day: Number(day),
            birthday: `${Number(month)}/${Number(day)}`,
        },
    }
    var newUser = {
        identity
    }
    { introduser ? newUser['introduser'] = introduser : null }
    await new User(newUser).save().then((result) => {
        res.json({ status: true, userId: result._id, phone })
    }).catch(() => { res.json({ status: false }) })
})




router.post('/log_in', async (req, res) => {
    const data = getBody(req.body)
    const { phone } = data
    var user = await User.findOne({ "identity.phone": phone })
    if (user) {
        res.json({ status: true, user })
        return
    }
    else {
        res.json({ staus: false, user: "null" })
    }
})

router.post('/log_in_web', checkOrgin, async (req, res) => {
    const { phone } = req.body
    let phoneNum = phoneValidator(phone)
    if (!phoneNum) {
        res.json({ status: false })
        return
    }
    let user = await User.findOne({ "identity.phone": phoneNum })
    if (!user) {
        res.json({ status: false })
        return
    }
    const { name, lastName, birthday } = user.identity,
        token = jwt.sign({
            id: user._id,
            name,
            lastName,
            phone:phoneNum,
            birthday
        }, process.env.JWT);

    res.json(token)
})


module.exports = router


