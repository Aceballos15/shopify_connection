const axios = require("axios");
const { json } = require("express");

const BASE_URI_ZOHO = process.env.ZOHO_URL;

class transactionService {
  constructor() {}

  // Method to create a new transaction for an order 
  async createTransaction(transaction) {

    try {
      if (transaction.status === "success" || transaction.gateway.includes("contraentrega")) {
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
