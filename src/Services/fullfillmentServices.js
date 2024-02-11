const axios = require("axios");

// new class for a new fullfill function
class fullfilService {
  constructor() {}

  // Assign a new order fulfilment, wen the user generated invoice in zoho
  async assignFullfilmentAnOrder(order, fullfilInformation) {}

  // Moddify the order fulfillment for a transportation service
  async updateFullfilmentAnOrder(order, fullfilInformation) {}

  // Cancel the order fulfillment
  async cancelFullfillmentAnOrder(order) {}

  // add information to transport information
  async updateTrackingInformation(fulfillment_id, transportInformation) {
    // Json of tracking information
    const new_information = {
      fulfillment: {
        notify_customer: true,
        tracking_info: {
          company: transportInformation.company,
          number: String(transportInformation.guia_number),
          url: String(transportInformation.url_guia),
        },
      },
    };

    // Json for headers petition
    const config = {
      headers: {
        "X-Shopify-Access-Token": process.env.ACCESS_TOKEN,
      },
    };

    // url to request
    const UrlToAssign = `https://tiendaxhobbies.myshopify.com/admin/api/2024-01/fulfillments/${fulfillment_id}/update_tracking.json`;

    // Try to make a request
    try {
      const response = axios.post(UrlToAssign, new_information, config);
    } catch (error) {
      // log error
      console.error(error);
    }
  }
}
