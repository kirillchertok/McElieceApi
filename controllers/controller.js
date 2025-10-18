import cipher from "../services/cipher.js" 
import Token from "../services/token.js"

export default class Controller {
    static async encrypt(req, res, next){
        try{
            const { text, token } = req.body
            if (!token) return res.status(401).json({ message: 'No token in request' })
            if (!text) return res.status(400).json({ message: 'No text to encrypt' })

            const check = await Token.verify(token)
            if (!check) return res.status(401).json({ message: 'Incorrect token' })

            const encryptedBuffer = await cipher.encrypt(text)
            return res.json({
                encrypted: encryptedBuffer.toString('base64')
            })
        }
        catch(e){
            console.log('Encryption error:', e)
            next(e)
        }
    }

    static async decrypt(req, res, next){
        try{
            const { encrypted, token } = req.body
            if (!token) return res.status(401).json({ message: 'No token in request' })
            if (!encrypted) return res.status(400).json({ message: 'No encrypted data' })

            const check = await Token.verify(token)
            if (!check) return res.status(401).json({ message: 'Incorrect token' })

            const encryptedBuffer = Buffer.from(encrypted, 'base64');
            const decrypted = await cipher.decrypt(encryptedBuffer);
            
            return res.json({
                decrypted: decrypted
            })
        }
        catch(e){
            console.log('Decryption error:', e)
            next(e)
        }
    }

    static async test(req, res, next){
        try{
            const testText = " Some Text  Some Text  Some Text  Some Text  Some Text !@#$%^&*()(*&^%";
            const encryptedBuffer = await cipher.encrypt(testText);
            const decrypted = await cipher.decrypt(encryptedBuffer);
            
            return res.json({
                original: testText,
                encrypted: encryptedBuffer.toString('base64'),
                decrypted: decrypted,
                success: testText === decrypted
            });
        }
        catch(e){
            console.log('Test error:', e)
            next(e)
        }
    }

    static async login(req, res, next){
        try{
            const { login } = req.body
            if(!login) return res.status(500).json({ message: 'No login' })
            const token = await Token.create()
            return res.json({
                token: token
            })
        }
        catch(e){
            console.log(e)
            next(e)
        }
    }
}