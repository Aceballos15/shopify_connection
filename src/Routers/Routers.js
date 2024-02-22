const { Router } = require("express");
const axios = require("axios");
const router = Router();
const async = require("async")

// instance of client service
const clientService = require("../Services/clientServices");
// instance of order service
const orderService = require("../Services/orderServices");
// instance of transaction object
const transactionService = require("../Services/transactionService");
// Instance of fulfillment service
const fullfilService = require("../Services/fullfillmentServices");
// Instance of a Billing service 
const billingService = require("../Services/billing_services")

// Function to encole order 
const queue = async.queue( async(orderData) => {
  console.log("Procesing order in que...")
     // instance an object of class order => Use create an order method
     const newOrderClass = new orderService();
     const responseCreate = await newOrderClass.createOrder(orderData.order, orderData.client);

     return responseCreate.data; 
}, 1); 


//Principal router to received the webhook
router.post("/create_order", async (req, res) => {
  try {
    // Define customer map
    const customerData = req.body.customer;

    const clientDocument = customerData.default_address.company != null ? customerData.default_address.company : req.body.shipping_address.comnpany;

    // Create an id client in blank variable
    var idClient = "";

    // Url to fin client in zoho databse "Clientes_Report"
    const urlClient = `https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/Clientes_Report?where=Documento%3D%3D%22${clientDocument}%22`;
    const findClient = await axios.get(urlClient);

    var validate = false; 
    const validateClient = typeof(`${findClient.data[0]}`); 

    // Try catch to validate Client
    try {
      JSON.parse(validateClient); 
      validate = true; 
    } catch (error) {
      validate = false; 
    }
    // if the API petition found one client or more, capture this ID
    if ( validate === true ) {

      idClient = findClient.data[0].ID;

    } else {
      // create client if no exists
      const newClient = new clientService();
      idClient = await newClient.createClient(customerData, req.body.shipping_address.comnpany);

      if (idClient != null) {
        console.log(`Client created succesfully...ID cliente: ${idClient}`);
      }
    }

    // Call to queue function, to generate a row in memory 
    const dataProcesing = {
      order: req.body, 
      client: idClient
    }
    
    // Add a que 
    queue.push(dataProcesing)

    res.status(200).send("Received order");

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

  // Call a method of a fulfillment service 
  const newFulfillment = new fullfilService();
  await newFulfillment.updateTrackingInformation(
    data.trackingInformation,
    data.orderId
  );

  res.status(200).send("Tracking Received")
});


router.post("/reject_order", async(req, res) => {

  const newCancelOrder = new orderService(); 
  await newCancelOrder.declineOrder(req.body)

  res.status(200).send("Reject order received")
})


router.post("/create_billing", async(req, res) => {

  try {
    
    const billing = new billingService();
    await billing.create_billing(req.body.id_order, req.body.id_despacho); 

    res.status(200).send("Order billing received successfully"); 
  } catch (error) {
    console.error(error)
    res.status(501).send("Server error")
  }
})

module.exports = router;
