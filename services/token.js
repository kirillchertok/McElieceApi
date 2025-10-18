import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid';

const SECRET_KEY = "QWERTYUIOPASDFGHJKLZXCVBNM"

export default class Token{
    static async create(){
        const id = uuidv4();
        const token = jwt.sign({ id: id }, SECRET_KEY, { expiresIn: '30d' })
        return token
    }

    static async verify(token){
        try{
            const check = jwt.verify(token, SECRET_KEY)
            return check
        }
        catch(e){
            console.log(e)
            return false
        }
    }
}