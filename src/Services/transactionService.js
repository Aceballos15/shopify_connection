const axios = require("axios");
const { json } = require("express");

const BASE_URI_ZOHO = process.env.ZOHO_URL;

class transactionService {
  constructor() {}

  // Method to create a new transaction for an order 
  async createTransaction(transaction) {

    try {
      // Validate if transaction existis in zoho database 
      var validate = true; 
      urlToFindTransactions = `${BASE_URI_ZOHO}/shopifyTransactionsReport`; 
      const response = await axios.get(urlToFindTransactions);

      const object_Transaction = response.data.find(
        (transaction) => transaction.idTransaction == String(transaction.id)
      );

      if(object_Transaction != null && object_Transaction != undefined) {
        validate = false;
        console.log("Transaction exists in zoho database"); 
      }

      if (transaction.status === "success" || transaction.gateway.includes("contraentrega") && validate === true) {
        const newTransaction = {
          idTransaction: transaction.id,
          orderIdTransaction: transaction.order_id,
          statusTransaction: transaction.status,
          paymentMethodTransaction: transaction.gateway,
          paymentIDTransaction: transaction.payment_id,
        };

        const transactionSend  = JSON.stringify(newTransaction)
        console.log("Transaction in process...");

        const urlTransactionCreation =
          `${BASE_URI_ZOHO}/shopifyTransactions`;
        const response = await axios.post(
          urlTransactionCreation,
          transactionSend
        );

        if (response.data) {
          console.log(`Transaction created sucess. ID:${response.data.ID}`);
        }

      }
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = transactionService;
