const axios = require("axios");

class transactionService {
  constructor() {}

  // Method to create a new transaction for an order 
  async createTransaction(transaction) {

    try {
      if (transaction.status === "success") {
        const newTransaction = {
          idTransaction: transaction.id,
          orderIdTransaction: transaction.order_id,
          statusTransaction: transaction.status,
          paymentMethodTransaction: transaction.gateway,
          paymentIDTransaction: transaction.payment_id,
        };
        const urlTransactionCreation =
          "https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/shopifyTransactions";
        const response = await axios.post(
          urlTransactionCreation,
          newTransaction
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
