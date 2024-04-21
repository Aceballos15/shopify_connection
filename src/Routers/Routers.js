const { Router } = require("express");
const router = Router();
const async = require("async");

const validateHandler = require("../middlewares/validationHanddler");

// instance of order service
const orderService = require("../Services/orderServices");
// instance of transaction object
const transactionService = require("../Services/transactionService");
// Instance of fulfillment service
const fullfilService = require("../Services/fullfillmentServices");
// Instance of a Billing service
const billingService = require("../Services/billing_services");
// Instance os a product service
const productService = require("../Services/productServices");

// service of ultima milla service
const guideService = require("../Services/ultimaMillaService");

// Function to encole order
const queue = async.queue(async (orderData) => {
  console.log("Procesing order in que...");
  // instance an object of class order => Use create an order method

  const newOrderClass = new orderService();
  const responseCreate = await newOrderClass.createOrder(JSON.parse(orderData.order));

  return responseCreate.data;
}, 1);

//Principal router to received the webhook
router.post("/create_order", async (req, res) => {
  try {
    // Call to queue function, to generate a row in memory
    const dataProcesing = {
      order: req.body,
    };

    // Add a que
    queue.push(dataProcesing);

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
  try {
    const newProduct = new productService();
    await newProduct.createProduct(req.body.id);

    res.status(200).send("Creado correctamente");
  } catch (error) {
    console.error(error);
    res.status(500).send("Not response ");
  }
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

// Router to update a tracking information for order since zoho database
router.post("/update_tracking", async (req, res) => {
  const data = req.body;

  // Call a method of a fulfillment service
  const newFulfillment = new fullfilService();
  await newFulfillment.updateTrackingInformation(
    data.trackingInformation,
    data.orderId
  );

  res.status(200).send("Tracking Received");
});

// Router to cancel an order since zoho database
router.post("/reject_order", async (req, res) => {
  const newCancelOrder = new orderService();
  await newCancelOrder.declineOrder(req.body);

  res.status(200).send("Reject order received");
});

// Router to create an invoice in zoho database
router.post("/create_billing", async (req, res) => {
  try {
    const billing = new billingService();
    await billing.create_billing(req.body.id_order, req.body.id_despacho);

    res.status(200).send("Order billing received successfully");
  } catch (error) {
    console.error(error);
    res.status(501).send("Server error");
  }
});

router.post("/create_milla_guide", async (req, res) => {
  try {
    data_response = req.body;
    const newGuide = new guideService();
    const createGuide = await newGuide.createOrder(req.body);
    var data_response = {};

    if (createGuide.code != null) {
      const newSticker = await newGuide.createSticker(createGuide.code);

      data_response = {
        code: createGuide.code,
        rotulo: newSticker.rotulo,
      };
    }

    res.status(200).send(data_response);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.delete("/cancel_order_milla", async (req, res) => {
  try {
    const newGuide = new guideService();
    await newGuide.cancelOrder(req.body.code);

    res.status(200).send("Ultima Milla canceled received");
  } catch (error) {
    res.status(500).send("Server error");
  }
});

module.exports = router;
