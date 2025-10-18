import Router from 'express'
import Controller from '../controllers/controller.js'

const router = new Router()

router.post('/encrypt', Controller.encrypt)
router.post('/decrypt', Controller.decrypt)
router.get('/test', Controller.test) 

router.post('/login', Controller.login)

export default router