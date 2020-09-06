const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const yup = require('yup')
const monk = require('monk')
const { nanoid } = require('nanoid')

require('dotenv').config()

const db = monk(process.env.MONGODB_URI)
const urls = db.get('urls')
urls.createIndex({ slug: 1 }, { unique: true })

const app = express()
const port = process.env.PORT || 4242

app.use(helmet({ contentSecurityPolicy: false }))
app.use(morgan('dev'))
app.use(cors())
app.use(express.json())
app.use(express.static('./public'))


app.get('/:id', async (req, res, next) => {
  const { id: slug } = req.params
  try {
    const data = await urls.findOne({ slug })

    if (data) {
      res.redirect(301, data.url)
    }

    res.redirect(`/?error=${slug} not found`)
  } catch (error) {
    next(error)
  }
})

const schema = yup.object().shape({
  slug: yup.string().trim().matches(/[\w\-]/i),
  url: yup.string().trim().url().required()
})

app.post('/url', async (req, res, next) => {
  let { slug, url } = req.body
  try {
    await schema.validate({
      slug,
      url
    })

    if (!slug) {
      slug = nanoid(7)
    } else {
      const existing = await urls.findOne({ slug })
      if (existing) {
        throw new Error('Slug is use.')
      }
    }

    slug = slug.toLowerCase()
    const newUrl = {
      url,
      slug
    }
    const created = await urls.insert(newUrl)

    res.json(created)
  } catch (error) {
    if (!error.status) {
      error.status = 400
    }
    next(error)
  }
})

app.use((error, req, res, next) => {
  if (error.status) {
    res.status(error.status)
  } else {
    res.status(500)
  }
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? 'ok' : error
  })
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
