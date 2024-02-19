const axios = require("axios");

// new class for a new fullfill function
class fullfilService {
  constructor() {}

  // Cancel the order fulfillment
  async cancelFullfillmentAnOrder(order) {}

  // add information to transport information
  async updateTrackingInformation(transportInformation, order) {
    
    // Json for headers petition
    const config = {
      headers: {
        "X-Shopify-Access-Token": process.env.ACCESS_TOKEN,
      },
    };

    const send_json = {
      fullfillment: {
        line_items_by_fulfillment_order:[
          {
            fulfillment_order_id: order.id,
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
    const UrlToAssign = `https://tiendaxhobbies.myshopify.com/admin/api/2024-01/fulfillments.json`;

    // Try to make a request
    try {
      const response = axios.post(UrlToAssign, send_json, config);
    } catch (error) {
      // log error
      console.error(error);
    }
  }
}
