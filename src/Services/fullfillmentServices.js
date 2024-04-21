const axios = require("axios");

const BASE_URI_SHOPIFY = process.env.SHOPIFY_URL; 

// new class for a new fullfill function
class fullfilService {
  constructor() {}

  // Cancel the order fulfillment
  async cancelFullfillmentAnOrder(fullfill) {
    // url to cancel an order fulfillments 
    const urlToFulfillmentsCanel = `${BASE_URI_SHOPIFY}/${process.env.SHOPIFY_VERSION}/fulfillments/${fullfill[0].id}/canel.json`

    try {
      // Json for headers petition
      const config = {
        headers: {
          "X-Shopify-Access-Token": process.env.ACCESS_TOKEN,
        },
      };

      // POST request to cancell 
      const response = await axios.post(urlToFulfillmentsCanel, config); 
      if(response.data.fulfillment.status == "cancelled"){
        console.log("¡Fulfillment canceled succesfully!")
      }else{
        console.log("Error to cancel fulfillment")
      }
    } catch (error) {
      
      console.error(error)

    }
  }

  // add information to transport information
  async updateTrackingInformation(transportInformation, orderId) {
    
    // Json for headers petition
    const config = {
      headers: {
        "X-Shopify-Access-Token": process.env.ACCESS_TOKEN,
      },
    };

    // COnst Json to update tracking information and configuration information 
    const send_json = {
      fullfillment: {
        line_items_by_fulfillment_order:[
          {
            fulfillment_order_id: orderId,
          }
        ], 
        tracking_info: {
          company: transportInformation.company,
          number: String(transportInformation.guia_number),
          url: String(transportInformation.url_guia),
        }
      }
    }

    // url to request
    const UrlToAssign = `${BASE_URI_SHOPIFY}/${process.env.SHOPIFY_VERSION}/fulfillments.json`;

    // Try to make a request
    try {
      const response = axios.post(UrlToAssign, send_json, config);
      if(response.data.status == 200)
      {
        console.log("Update Tracking information success")
      }
    } catch (error) {
      // log error
      console.error(error);
    }
  }
  
}

module.exports = fullfilService; 