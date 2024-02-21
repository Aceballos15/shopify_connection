const { Router } = require("express");
const axios = require("axios");
const router = Router();

// instance of client service
const clientService = require("../Services/clientServices");
// instance of order service
const orderService = require("../Services/orderServices");
// instance of transaction object
const transactionService = require("../Services/transactionService");
// Instance of fulfillment service
const fullfilService = require("../Services/fullfillmentServices");

//Principal router to received the webhook
router.post("/create_order", async (req, res) => {
  try {
    // Define customer map
    const customerData = req.body.customer;

    const clientDocument = customerData.default_address.company;
    // Create an id client in blank variable
    var idClient = "";

    // Url to fin client in zoho databse "Clientes_Report"
    const urlClient = `https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/Clientes_Report?where=Documento%3D%3D%22${clientDocument}%22`;
    const findClient = await axios.get(urlClient);

    // if the API petition found one client or more, capture this ID
    if (findClient.data.length > 0) {
      idClient = findClient.data[0].ID;
    } else {
      // create client if no exists
      const newClient = new clientService();
      idClient = await newClient.createClient(customerData);
      if (idClient != null) {
        console.log(`Client created succesfully...ID cliente: ${idClient}`);
      }
    }

    // order variable
    const order = req.body;

    // instance an object of class order => Use create an order method
    const newOrderClass = new orderService();
    const responseCreate = await newOrderClass.createOrder(order, idClient);

    res.status(200).send(responseCreate.data);
  } catch (error) {
    // error log and response status code 500
    console.error("Error en la solicitud a Zoho:", error);
    res.status(500).send(error);
  }
});

// router to cancell an order
router.post("/cancel_order", async (req, res) => {
  try {
    const orderCancellation = new orderService();
    await orderCancellation.cancelOrder(req.body);

    res.send({ Status: "Order cancelled received" });
  } catch (error) {
    console.error(error);
  }
  res.status(200).send("Cancel Order Received")
});

//router to create all products
router.post("/create_products", async (req, res) => {
  res.status(200).send("Creado correctamente");
});

//router to create a new transaction
router.post("/transaction_creation", async (req, res) => {
  try {
    const newTransaction = new transactionService();
    await newTransaction.createTransaction(req.body);
  } catch (error) {
    console.error(error);
  }
  res.status(200).send("Transaction received");
});

router.post("/update_tracking", async (req, res) => {
  const data = req.body;
  // Config shopify request parameters
  const urlConsultProduct = `https://tiendaxhobbies.myshopify.com/admin/api/2024-01/orders/${data.idOrder}.json`;
  const config = {
    headers: {
      "X-Shopify-Access-Token": process.env.SECRET_KEY,
    },
  };

  // Search product in shopify account
  const orderResponse = await axios.get(urlConsultProduct, config);

  // Call a method of a fulfillment service 
  const newFulfillment = new fullfilService();
  await newFulfillment.updateTrackingInformation(
    data.trackingInformation,
    orderResponse.data.order
  );

  res.status(200).send("Tracking Received")
});


router.post("/reject_order", async(req, res) => {
  const newCancelOrder = new orderService(); 
  await newCancelOrder.declineOrder(req.body)

  res.send(200).res("Reject order received")
})

module.exports = router;
