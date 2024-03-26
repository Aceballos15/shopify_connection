const app = require("../../index")
const moment = require('moment');

const URL_SHOPIFY = process.env.SHOPIFY_URL; 
const VERSION = process.env.SHOPIFY_VERSION; 
const BASE_URI_ZOHO = process.env.ZOHO_URL

// Obtener la fecha de ayer y formatearla
const fechaAyer = moment().subtract(1, 'days').format('YYYY-MM-DDTHH:mm:ssZZ');

console.log(fechaAyer);

allAbandonedZoho = axios.get()


const createAbandonecCheckouts = () => {

    
}