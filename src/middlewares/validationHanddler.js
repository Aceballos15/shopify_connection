require('dotenv').config() 

const APP_TOKEN = process.env.APP_TOKEN; 

// Validation handlers for validate if exists headers 
const validateHandler = (req, res, next) => {
    const appToken = req.headers['app-token']; 

    if (appToken == APP_TOKEN) {
        next(); 
    }else {
        res.status(400).send("Unauthenticated")
    }
}

module.exports = validateHandler 