const axios = require("axios");
const { configDotenv } = require("dotenv");
const LUXURY = process.env.URL_LUXURY;

class transportClass {
  constructor() {}

  // Create a new order in transport serice
  async createOrder(orderData) {
    // Json for headers petition
    const config = {
      headers: {
        "Custom-Auth-Token": process.env.TOKEN_LUXURY,
      },
    };
    
    try {
      // Create a luxury order
      const responseCreate = await axios.post(
        `${LUXURY}/order/create`,
        orderData,
        config
      );
      var codeTransport = null; 

      if (responseCreate.data) {
        codeTransport = responseCreate.data.data.reference;
      }
      return {
        code: codeTransport,
      };
    } catch (error) {
      console.log(error);
      return {
        code: null,
      };
    }
  }

  // Method to find a rotule
  async createSticker(orderCode) {
    const config = {
      headers: {
        "Custom-Auth-Token": process.env.TOKEN_LUXURY,
      },
    };

    const sticker = await axios.get(
      `${LUXURY}/print/sticker?reference=${orderCode}`,
      config
    );
    return {
      rotulo: sticker.data.data.file,
    };
  }

  //   Method to cancel an order
  async cancelOrder(orderCode) {
    const config = {
      headers: {
        "Custom-Auth-Token": process.env.TOKEN_LUXURY,
      },
    };

    const deleteResponse = await axios.delete(
      `${LUXURY}/order/cancel/${orderCode}`,
      config
    );

    console.log(deleteResponse.data.data.observation);
  }

  // Method to consult an order detail
  async orderDetails(orderCode) {
    const response = await axios.get(`${LUXURY}/order/details/${orderCode}`);

    if (response.data.data) {
      length = response.data.data.status_domicilio.length;
      return response.data.data.status_domicilio[length];
    } else {
      return false;
    }
  }
}

module.exports = transportClass;
