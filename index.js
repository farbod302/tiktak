const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
const TrezSmsClient = require("trez-sms-client");
const client = new TrezSmsClient("daaraan", "81912601320");

require('dotenv').config()
const app = express()
app.use(cors())


app.use("/item", express.static('item'))
app.use("/blog", express.static('blog'))
app.use("/slider", express.static('sliders'))
app.use(bodyParser.json({ limit: '7mb' }));
app.use(bodyParser.urlencoded({ limit: '7mb', extended: true }));


const { checkBirthday, createOffCode } = require('./helperFunc')

var port = process.env.PORT
app.listen(port, console.log(`Server Start On Port ${port}`))

mongoose
  .connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('Connect To db Successfully')
  })

const regist = require('./routs/regist')
const admin = require('./routs/admin')
const user = require('./routs/user')
const view = require('./routs/view')
const item = require('./routs/item')
const comment = require('./routs/comment')

app.use('/regist', regist)
app.use('/admin', admin)
app.use('/user', user)
app.use('/view', view)
app.use('/item', item)
app.use('/comment', comment)

birthdayFunc = async () => {
  var users = await checkBirthday()

  users.map(async (each, index) => {
    let { phone } = each.identity,
      code = await createOffCode(phone, 20000, 5),
      msg = `
زادروزتان مبارک
کد تخفیف ۲۰,۰۰۰ تومانی خرید از سایت و اپیکیشن تیک تاک برای شما ایجاد شد
کد تخفیف:
${code.code}
مهلت استفاده:۵ روز
tiktakstyle.ir
`
    setTimeout(async () => {
      await client.manualSendCode(phone, msg)
    }, index * 1000);

  })
}

setInterval(() => {
  birthdayFunc()
}, 1000 * 60 * 60 * 25)
