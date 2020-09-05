const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const app = express()
const port = process.env.PORT || 4200

app.use(helmet())
app.use(morgan('tiny'))
app.use(cors())
app.use(express.json())
app.use(express.static('./public'))

app.get('/', (req, res) => {
    res.json({
        message: 'All right'
    })
})

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})