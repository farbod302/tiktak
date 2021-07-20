const JDate = require('jalali-date')
const User = require('./db/user')
const Off = require('./db/off')
const Item = require('./db/item')
const fs = require("fs")
var base64Img = require('base64-img');
const path = require('path');
const { uid } = require('uid')
const TrezSmsClient = require("trez-sms-client");
const client = new TrezSmsClient("daaraan", "81912601320");




const phoneValidator = num => {
  num.replace(/[۰-۹]/g, index => '۰۱۲۳۴۵۶۷۸۹'.indexOf(index))
  if (num.length !== 11) return false
  if (!num.startsWith('09')) return false
  return num
}

const getBody = data => {
  if (data.nameValuePairs) return data.nameValuePairs
  return data
}

const checkBirthday = () => {
  return new Promise(resolve => {
    var jdate = new JDate()
    var today = `${jdate.getMonth()}/${jdate.getDate()}`
    User.find(
      { 'identity.birthday.birthday': today },
      { identity: 1, _id: 0 }
    ).then(result => {
      resolve(result)
    })
  })
}

const multItems = (sizes, colors) => {
  var response = []
  for (s in sizes) {
    for (c in colors) {
      response.push({
        size: `${sizes[s]}`,
        color: `${colors[c]}`,
        depo: 0
      })
    }
  }
  return response
}

const mainCategory = [
  {
    id: 1,
    label: 'کیف'
  },
  {
    id: 2,
    label: 'کفش'
  },
  {
    id: 3,
    label: 'ست کیف و کفش'
  },
  {
    id: 4,
    label: 'پوشاک'
  }
]
const secondaryCategory = [
  {
    mainId: 1,
    category: [
      {
        id: 1,
        label: 'مجلسی'
      },
      {
        id: 2,
        label: 'اسپرت'
      },
      {
        id: 3,
        label: 'کوله'
      }
    ]
  },
  {
    mainId: 2,
    category: [
      {
        id: 1,
        label: 'مجلسی'
      },
      {
        id: 2,
        label: 'اسپرت'
      },
      {
        id: 3,
        label: 'صندل'
      }
    ]
  },
  {
    mainId: 4,
    category: [
      {
        id: 1,
        label: 'شلوار'
      },
      {
        id: 2,
        label: 'مانتو'
      }
    ]
  }
]


const pagination = (each, page, items) => {
  const
    startIndex = each * (page - 1),
    endPage = (each * page) - 1
  let filtered = items.reverse().filter((each, index) => index >= startIndex && index <= endPage)
  return filtered
}

const calcPagination = (all, each) => {
  return Math.ceil(all / each)
}



const addImgs = (id, imgs) => {
  return new Promise(resolve => {
    fs.mkdir(`${__dirname}/item/${id}`, (() => {
      imgs.reverse().forEach((each, index) => {
        path = base64Img.imgSync(each, `${__dirname}/item/${id}`, index + 1)
        if (index + 1 === imgs.length) {
          resolve()
        }
      })
    }))
  })
}


const removeImgs = (id) => {

  return new Promise(resolve => {
    fs.readdir(`${__dirname}/item/${id}`, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(`${__dirname}/item/${id}`, file), err => {
          if (err) throw err;
        });
      }
    });
    resolve()
  })
}


const createOffCode = (user, amount, day) => {

  return new Promise(resolve => {
    const code = uid(6)
    var now = Date.now(),
      dep = now + (1000 * 60 * 60 * 24 * day),
      off = {
        code,
        amount,
        dep,
        user
      }
    new Off(off).save().then(() => { resolve(code) })
  })

}

const addScoreToIntroduser = (userId) => {
  return new Promise(async resolve => {
    const user = await User.findById(userId),
      introduserId = user.introduser
    if (!introduserId) resolve()
    var introduser = await User.findById(introduserId),
      score = introduser.score
    if (score.includes(userId)) resolve()
    await User.findByIdAndUpdate(introduserId, { $push: { score: userId } })
    var length = score.length + 1
    if (Math.floor(length / 4) <= introduser.scoreUsed) resolve()

    var code = await createOffCode(introduserId, 20000, 7)
    await User.findByIdAndUpdate(introduserId, { $inc: { scoreUsed: 1 } })
    var introduserName = `${introduser.identity.name} ${introduser.identity.lastName}`,
      phone = introduser.identity.phone,
      msg =
        `${introduserName} عزیز
کد تخفیف ۲۰,۰۰۰ هزار تومانی شما بابت معرفی دوستان به فروشگاه تیک تاک ایجاد شد:
کد تخفیف:
${code}
این کد تخفیف تا یک هفته در وبسایت و اپلیکیشن تیک تاک قابل استفاده است
ممنون از حسن نیت شما
`
    await client.manualSendCode(phone, msg)
    resolve()
  })
}


const getRecomendItems = (tags) => {
  return new Promise(async resolve => {
    var recomendation = []
    var sameTags = await Item.find({ tags: { $all: tags } }, { id: 1 }).sort({ view: -1 })
    sameTags.forEach(each => recomendation.push(each.id))
    if (recomendation.length >= 6) resolve(recomendation.slice(0, 5))
    var semularItems = await Item.find({ tags: { $in: tags } }, { id: 1 }).sort({ view: -1 })
    semularItems.forEach(each => recomendation.push(each.id))
    if (recomendation.length >= 6) resolve(recomendation.slice(0, 5))
    var randomItem = await Item.find({ id: { $nin: recomendation } }, { id: 1 }).sort({ view: -1 })
    randomItem.slice(0, 5).forEach(each => recomendation.push(each.id))
    resolve(recomendation.slice(0, 5))
  })


}



const mountGenerator = () => {
  return new Promise(resolve => {
    const oneMounth = 2592000000
    let datatimeA = []
    var today = new Date()
    today.setHours(0)
    today.setMinutes(0)
    today.setSeconds(0)
    today.setMilliseconds(0)

    for (let i = 0; i <= 5; i++) {
      var dataSrting = today - oneMounth * i
      const jdate = new JDate(new Date(dataSrting))
      var year = jdate.getFullYear()
      var mounth = jdate.getMonth()
      var datatime = `${year}/${mounth}`
      datatimeA.push({
        dateString: datatime,
        value: 0
      })
      if (i === 5) {
        resolve(datatimeA);
      }
    }


  })
}


const getMountAndYear = (date) => {
  var jdate = new JDate(new Date(date))
  var year = jdate.getFullYear()
  var mounth = jdate.getMonth()
  return (`${year}/${mounth}`)

}

const api = 'http://localhost:4545/pay'

module.exports = {
  removeImgs,
  addScoreToIntroduser,
  addImgs,
  phoneValidator,
  getBody,
  checkBirthday,
  mainCategory,
  secondaryCategory,
  multItems,
  pagination,
  calcPagination,
  createOffCode,
  getRecomendItems,
  mountGenerator,
  api,
  getMountAndYear
}


