import express from 'express'
import { config } from 'dotenv'
import bodyParser from 'body-parser'
import router from './router/router.js'
import cookieParser from 'cookie-parser';
import cors from 'cors'

config()

const app = express()
const port = 5151


app.use(
    cors(
      {
        origin: true,
        credentials: true
      }
    )
)

app.use(bodyParser.json())
app.use(cookieParser())

app.use('/api', router)

app.get('/', (req, res, next) => res.json({ message: "Api is working" }))

const start = () => {
    try {
      app.listen(port, () => console.log(`Listening on port ${port}`))
    }
    catch (e) {
      console.error('Error starting server:', error);
    }
}

start()