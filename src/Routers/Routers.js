const { Router } = require("express");
const axios = require("axios");
const router = Router();

// instance of client service
const clientService = require("../Services/clientServices");
// instance of order service
const orderService = require("../Services/orderServices");
// instance of transaction object
const transactionService = require("../Services/transactionService");

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

    res.send(orderCancellation)
    
  } catch (error) {
    console.error(error);
  }
});

//router to create all products 
router.post("/create_products", async (req, res) => {
  const urlProduct =
    "https://tiendaxhobbies.myshopify.com/admin/api/2024-01/products.json?limit=250&&status=active";
  const config = {
    headers: {
      "X-Shopify-Access-Token": process.env.SECRET_KEY,
    },
  };

  const response = await axios.get(urlProduct, config);

  const allProducts = response.data.products;

  console.log(allProducts.length);

  allProducts.forEach(async (product_response) => {
    var statusProduct = "";
    if (product_response.status === "active") {
      statusProduct = "Activo";
    } else {
      statusProduct = "Inactivo";
    }

    const images = [];
    product_response.images.forEach((image) => {
      const new_Image = {
        linkUrl: image.src,
      };

      images.push(new_Image);
    });

    const new_product = {
      Nicho: "XHO",
      GrupoDeProductos: "1889220000051935384",
      Tipo: "1889220000084502235",
      Categoria: "1889220000124756734",
      Marca: "1889220000014561383",
      Referencia: product_response.title.toLowerCase(),
      textBody: product_response.body_html,
      Precio_detal: parseFloat(product_response.variants[0].price),
      PrecioComparacion:
        parseFloat(product_response.variants[0].compare_at_price) || 0,
      Precio_Mayorista: 0,
      Precio_Aliado: 0,
      pesoProducto: parseInt(product_response.variants[0].weight) || 0,
      Estado: statusProduct,
      numberShopify: product_response.id,
      idShopify: `{"product_id": ${product_response.id}, "variant_id": ${product_response.variants[0].id}}`,
      Imagenes: images,
      CodigoTecnosuper: product_response.id,
    };

    const insertProduct = await axios.post(
      "https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/Productos",
      new_product
    );

    console.log(insertProduct.data);
  });

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
});



module.exports = router;
