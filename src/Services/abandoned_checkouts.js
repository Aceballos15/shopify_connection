const axios = require("axios");
const moment = require("moment");

const V_SHOPIFY = process.env.SHOPIFY_VERSION;
const BASE_URI_ZOHO = process.env.ZOHO_URL;
const BASE_URI_SHOPIFY = process.env.SHOPIFY_URL;


// instance of a product service 
const productService = require("./productServices");
// instance of client service
const clientService = require("../Services/clientServices");

// Obtener la fecha de ayer y formatearla
const fechaAyer = moment().subtract(1, "days").format("YYYY-MM-DDTHH:mm:ssZZ");


// Function to get all abandoned checkouts since yesterday
const createAbandonecCheckouts = async () => {
  // Json for headers petition
  const config = {
    headers: {
      "X-Shopify-Access-Token": process.env.ACCESS_TOKEN,
    },
  };

  // Try to catch for error
  try {
    const checkouts = await axios.get(
      `${BASE_URI_SHOPIFY}/${V_SHOPIFY}/checkouts.json?created_at_min=${fechaAyer}`,
      config
    );

    // Find products in zoho database
    const allProducts = await axios.get(`${BASE_URI_ZOHO}/shopifyProducts`);

    if (checkouts.data.checkouts.length > 0) {
      for (
        let checkout = 0;
        checkout < checkouts.data.checkouts.length;
        checkout++
      ) {
        const checkoutElement = checkouts.data.checkouts[checkout];

        // Define customer map
        const customerData = checkoutElement.customer;

        var clientDocument = null ; 

        if (customerData.default_address || checkoutElement.shipping_address != null) {
          clientDocument =
          customerData.default_address && customerData.default_address.company != null
            ? customerData.default_address.company
            : checkoutElement.shipping_address.comnpany;
        }
        
        // Create an id client in blank variable
        var idClient = "";

        if (clientDocument != null ) {
          // Url to fin client in zoho databse "Clientes_Report"
          const urlClient = `${BASE_URI_ZOHO}/Clientes_Report?where=Documento%3D%3D%22${clientDocument}%22`;
          const findClient = await axios.get(urlClient);

          // if the API petition found one client or more, capture this ID
          if (findClient.data.length > 0) {
            idClient = findClient.data[0].ID;

          } else if (customerData.default_address ) {
            // create client if no exists
            const newClient = new clientService();
            idClient = await newClient.createClient(customerData, clientDocument);

            if (idClient != null) {
              console.log(`Client created succesfully...ID cliente: ${idClient}`);
            }
          } // End client function 
        }

        const products = [];
        // detail products list
        // for each item
        for (
          let index = 0;
          index < checkoutElement.line_items.length;
          index++
        ) {
          const product_line = checkoutElement.line_items[index];
          // If product is taxed, calculate the VAT
          var iva_detalle = 0;
          if (product_line.taxable === true) {
            iva_detalle =
              (parseFloat(product_line.price) -
                parseFloat(product_line.price) / 1.19) *
              parseInt(product_line.quantity);
          }

          var id_product = null;

          const findProductBy_sku = allProducts.data.find((object) => {
            return object.CodigoTecnosuper == String(product_line.sku);
          });

          if (findProductBy_sku != null && findProductBy_sku != undefined) {
            id_product = findProductBy_sku.ID;
          }

          if (id_product == null) {
            // Find object in zoho array returns
            const object_product = allProducts.data.find((object) => {
              return (
                object.numberShopify == String(product_line.product_id) &&
                object.idShopify.includes(product_line.variant_id)
              );
            });

            if (object_product !== null && object_product !== undefined) {
              id_product = object_product.ID;
            } else {
              // if doesn´t exists product in zoho database, create a new product (Call product service)
              const newServiceproduct = new productService();
              id_product = await newServiceproduct.createProduct(
                product_line.product_id
              );
            }
          }


          // product map for detail
          const product_detail = {
            Producto: product_line.title,
            productDetail: id_product,
            Precio: parseFloat(Math.floor(product_line.price)),
            Cantidad: parseInt(product_line.quantity),
            IVA: parseInt(iva_detalle),
            Total:
              parseFloat(Math.floor(product_line.price)) *
              product_line.quantity,
          };

          products.push(product_detail);
        }

        const adressDetail = `{
          "name": "${checkoutElement.shipping_address.first_name}", 
          "lastName": "${checkoutElement.shipping_address.last_name}",
          "adress": "${checkoutElement.shipping_address.address1}", 
          "phone": "${checkoutElement.shipping_address.phone}", 
          "docNumber": "${checkoutElement.shipping_address.company}", 
          "email": "${checkoutElement.customer.email}", 
          "zip": "${checkoutElement.shipping_address.zip}", 
          "municipality": "${checkoutElement.shipping_address.city
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")}", 
          "department": "${checkoutElement.shipping_address.province
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")}"
        }`;

          // build the new order collection
        const new_order = {
          dateOrder: checkoutElement.created_at.substring(10, -1),
          clientOrder: idClient,
          Tipo: "Carrito Abandonado",
          shipingAddressDetail: adressDetail,
          orderId: checkoutElement.id.toString(),
          orderName: checkoutElement.name,
          statusOrder: "Creada",
          paymentValidate: "Pendiente",
          payStatusOrder: "pending",
          totalOrder: parseFloat(Math.floor(checkoutElement.total_price)) - parseFloat(Math.floor(checkoutElement.shipping_lines[0].price)),
          shippingOrder: parseFloat(Math.floor(checkoutElement.shipping_lines[0].price)),
          paymentOrderValue: parseFloat(Math.floor(checkoutElement.total_price)),
          detallePedido: products,
        };

          // Url for post conect with zoho creator and petition function
          const urlCreateOrder =`${BASE_URI_ZOHO}/ordersShopifyCreate`;
          const response = await axios.post(urlCreateOrder, new_order);
          console.log(
            `Order created succesfully.....ID orden: ${response.data.ID}`
          );
      }
    }else{
        stop 
    }
  } catch (error) {
    console.error(error);
  }
};

class abandonedOrder {

  constructor() {}

  async createCheckouts(){

    await createAbandonecCheckouts()

  }
}
 
module.exports = abandonedOrder;