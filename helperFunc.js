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
      }]
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
      },
      {
        id: 4,
        label: 'بوت'
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
        base64Img.imgSync(each, `${__dirname}/item/${id}`, index + 1)
        if (index + 1 === imgs.length) {
          resolve()
        }
      })
    }))
  })
}


const addBlogImg = (img, id) => {
  return new Promise(resolve => {
    base64Img.imgSync(img, `${__dirname}/blog`, id)
    resolve()
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
      dep = new JDate(new Date(now + (1000 * 60 * 60 * 24 * day))).format('dddd DD MMMM YYYY'),
      off = {
        code,
        amount,
        dep: now + (1000 * 60 * 60 * 24 * day),
        user
      }
    new Off(off).save().then(() => { resolve({ code, dep }) })
  })

}

const addScoreToIntroduser = (userId) => {
  return new Promise(async resolve => {
    const user = await User.findById(userId),
      introduserPhone = user.introduser,
      introduserId = await User.findOne({ "identity.phone": introduserPhone })
    _id = introduserId._id
    if (!_id) {
      return resolve()
    }
    var introduser = await User.findById(_id),
      score = introduser.score
    console.log(score);
    if (score.includes(userId)) {
      return resolve()
    }
    await User.findByIdAndUpdate(_id, { $push: { score: userId } })
    var length = score.length + 1
    if (Math.floor(length / 4) <= introduser.scoreUsed) {
      return resolve()
    }
    console.log(introduser.identity.phone);
    var code = await createOffCode(introduser.identity.phone, 20000, 7)
    await User.findByIdAndUpdate(_id, { $inc: { scoreUsed: 1 } })
    var introduserName = `${introduser.identity.name} ${introduser.identity.lastName}`,
      phone = introduser.identity.phone,
      msg =
        `${introduserName} عزیز
کد تخفیف ۲۰,۰۰۰ هزار تومانی شما بابت معرفی دوستان به فروشگاه تیک تاک ایجاد شد:
کد تخفیف:
${code.code}
این کد تخفیف تا یک هفته در وبسایت و اپلیکیشن تیک تاک قابل استفاده است
ممنون از حسن نیت شما
`
    await client.manualSendCode(phone, msg)
    return resolve()
  })
}


const getRecomendItems = (tags, selectedId) => {
  return new Promise(async resolve => {
    var recomendation = []
    var sameTags = await Item.find({ tags: { $all: tags }, id: { $ne: selectedId } }, { id: 1 })
    sameTags.slice(0, 5).forEach(each => recomendation.push(each.id))
    if (recomendation.length >= 6) resolve(recomendation)
    var left
    left = 6 - recomendation.length
    var semularItems = await Item.find({ tags: { $in: tags }, id: { $ne: selectedId } }, { id: 1 })
    semularItems.slice(0, left).forEach(each => {
      recomendation.push(each.id)
    })
    if (recomendation.length >= 6) resolve(recomendation)
    left = 6 - recomendation.length
    var randomItem = await Item.find({ id: { $nin: recomendation, $ne: selectedId } }, { id: 1 })
    randomItem.slice(0, left).forEach(each => recomendation.push(each.id))

    resolve(recomendation)
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

const api = 'http://localhost:4545'




const checkOrgin = (req, res, next) => {
  let origin = req.get('origin');
  if (origin != 'http://localhost:3000') {
    res.json({ status: "orgin error" })
    return
  }
  next()

}
const calcOff = (price, off) => {
  return (price * (100 - off) / 100)
}
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
  getMountAndYear,
  addBlogImg,
  checkOrgin,
  calcOff
}


