const express = require('express')
const router = express.Router()
const User = require("../db/user")
const TrezSmsClient = require("trez-sms-client");
const { phoneValidator, getBody } = require('../helperFunc');
const JDate = require('jalali-date');

const client = new TrezSmsClient("daaraan", process.env.SMS);

router.post('/check', async (req, res) => {
    var data = getBody(req.body)
    const { phone } = data
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
    const { day, month, year } = birthday
    const jdate = new JDate(year, month, day)
    var identity = {
        name, lastName, phone,
        birthday: {
            year,
            month: Number(month),
            day: Number(day),
            birthday: `${Number(month)}/${Number(day)}`,
            fullDate: jdate._d,
        },
    }
    var newUser = {
        identity
    }
    { introduser ? newUser['introduser'] = introduser : null }
    await new User(newUser).save().then((result) => {
        res.json({ status: true, userId:result._id })
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




module.exports = router