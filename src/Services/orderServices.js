const axios = require("axios");

const V_SHOPIFY = process.env.SHOPIFY_VERSION;
const BASE_URI_ZOHO = process.env.ZOHO_URL;
const BASE_URI_SHOPIFY = process.env.SHOPIFY_URL;

// Create an instance of fulfillment and product services
const fulfillmentService = require("./fullfillmentServices");
const productService = require("./productServices");

// instance of client service
const clientService = require("../Services/clientServices");
// Intance os transactor service
const transactionService = require("../Services/transactionService");

// Create one class of Order
class orderService {
  constructor() {}

  // Method to create a new order in zoho database
  async createOrder(order) {
    try {
      const validateOrderExists = await this.validateOrder(order.id);

      if (!validateOrderExists.status) {
        // Define customer map
        const customerData = order.customer;
        const clientDocument =
          order.shipping_address.company != null
            ? order.shipping_address.company
            : customerData.default_address.comnpany;
        // Create an id client in blank variable
        var idClient = "";

        // Url to fin client in zoho databse "Clientes_Report"
        const urlClient = `${BASE_URI_ZOHO}/Clientes_Report?where=Documento%3D%3D%22${clientDocument}%22`;
        const findClient = await axios.get(urlClient);

        // if the API petition found one client or more, capture this ID
        if (findClient.data.length > 0) {
          idClient = findClient.data[0].ID;
        } else {
          // create client if no exists
          const newClient = new clientService();
          idClient = await newClient.createClient(customerData, clientDocument);

          if (idClient != null) {
            console.log(`Client created succesfully...ID cliente: ${idClient}`);
          }
        }

        console.log("Order not found. Creating....");
        // Create an array for product detail list
        const products = [];

        // Find products in zoho database
        const allProducts = await axios.get(`${BASE_URI_ZOHO}/shopifyProducts`);

        // for each item
        for (let index = 0; index < order.line_items.length; index++) {
          const product_line = order.line_items[index];
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

          const priceProduct = parseFloat(Math.floor(product_line.price)) - parseFloat(Math.floor(product_line.total_discount)); 
          // product map for detail
          const product_detail = {
            Producto: product_line.title,
            productDetail: id_product,
            Precio: parseFloat(priceProduct),
            Cantidad: parseInt(product_line.quantity),
            IVA: parseInt(iva_detalle),
            Total:
              parseFloat(priceProduct) *
              product_line.quantity,
          };

          products.push(product_detail);
        }

        const adressDetail = `{
          "name": "${order.shipping_address.first_name}", 
          "lastName": "${order.shipping_address.last_name}",
          "adress": "${order.shipping_address.address1} - ${order.shipping_address.address2}", 
          "phone": "${order.shipping_address.phone}", 
          "docNumber": "${order.shipping_address.company}", 
          "email": "${order.customer.email}", 
          "zip": "${order.shipping_address.zip}", 
          "municipality": "${order.shipping_address.city
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")}", 
          "department": "${order.shipping_address.province
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")}"
        }`;
        // build the new order collection
        const new_order = {
          dateOrder: order.created_at.substring(10, -1),
          clientOrder: idClient,
          Tipo: "Orden",
          shipingAddressDetail: adressDetail,
          orderId: order.id.toString(),
          orderName: order.name,
          statusOrder: "Creada",
          paymentValidate: "Pendiente",
          payStatusOrder: order.financial_status,
          totalOrder: parseFloat(Math.floor(order.current_subtotal_price)),
          shippingOrder: parseFloat(Math.floor(order.shipping_lines[0].price)),
          paymentOrderValue: parseFloat(Math.floor(order.total_price)),
          detallePedido: products,
        };

        // Url for post conect with zoho creator and petition function
        const urlCreateOrder = `${BASE_URI_ZOHO}/ordersShopifyCreate`;
        const response = await axios.post(urlCreateOrder, new_order);
        console.log(
          `Order created succesfully.....ID orden: ${response.data.ID}`
        );

        const config = {
          headers: {
            "X-Shopify-Access-Token": process.env.ACCESS_TOKEN,
          },
        };

        // if exists transactions for order, update transactions
        const findTransactions = `${BASE_URI_SHOPIFY}/${V_SHOPIFY}/orders/${order.id}/transactions.json`;
        const responseTransactions = await axios.get(findTransactions, config);

        if (responseTransactions.data.transactions.length > 0) {
          for (
            let transaction = 0;
            transaction < responseTransactions.data.transactions.length;
            transaction++
          ) {
            const element = responseTransactions.data.transactions[transaction];
            await new transactionService().createTransaction(element);
          }
        }

        return response;
      } else {
        // Found one order or more, try to update order
        console.log(`Updating Order: ${order.name}`);
        this.updateOrder(validateOrderExists.idOrder, order);
        return {
          status: "Order created before....",
        };
      }
    } catch (error) {
      console.log(error);
    }
  }

  // method to validate if order exists in zoho database
  async validateOrder(idOrder) {
    try {
      // Validate if order exists in zoho database
      const urlOrder = `${BASE_URI_ZOHO}/ordersShopify?where=orderId%3D%3D%22${idOrder}%22`;
      const findOrder = await axios.get(urlOrder);
      // if order found one element or more, return true validate
      if (findOrder.data.length > 0) {
        return {
          status: true,
          idOrder: findOrder.data[0].ID,
        };
        // else return status false
      } else {
        return {
          status: false,
        };
      }
    } catch (error) {
      console.error(error);
    }
  }

  // method to cancell an order
  async cancelOrder(order) {
    try {
      // Validate if exists an order with this order.id
      const validateOrderExists = await this.validateOrder(order.id);
      if (!validateOrderExists.status) {
        console.log("Order canceled doesn't exist in zoho database");
      } else {
        // Url and new data to update this order
        const updateOrderUrl = `${BASE_URI_ZOHO}/ordersShopify/${validateOrderExists.idOrder}`;
        const new_data = {
          statusOrder: "Cancelada",
        };

        // Patch request and response log
        const updateOrder = await axios.patch(updateOrderUrl, new_data);
        if (updateOrder.data !== null) {
          console.log(
            `Order Canceled succesfully. Order id: ${JSON.stringify(
              updateOrder.data
            )}`
          );
          if (order.fulfillments.length > 0) {
            // Call the fulfillment order cancellation
            const fulfillment = order.fulfillments;
            const newCancelService = new fulfillmentService();
            newCancelService.cancelFullfillmentAnOrder(fulfillment);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Method to Update an order in zoho database
  async updateOrder(id_order, order) {
    try {
      const customerData = order.customer;

      const clientDocument =
          order.shipping_address.company != null
            ? order.shipping_address.company
            : customerData.default_address.comnpany;
      // Create an id client in blank variable
      var idClient = "";

      // Url to fin client in zoho databse "Clientes_Report"
      const urlClient = `${BASE_URI_ZOHO}/Clientes_Report?where=Documento%3D%3D%22${clientDocument}%22`;
      const findClient = await axios.get(urlClient);

      // if the API petition found one client or more, capture this ID
      if (findClient.data.length > 0) {
        idClient = findClient.data[0].ID;
      } else {
        // create client if no exists
        const newClient = new clientService();
        idClient = await newClient.createClient(customerData, clientDocument);
        if (idClient != null) {
          console.log(`Client created succesfully...ID cliente: ${idClient}`);
        }
        
      }

      const products = [];
      // Find products in zoho database
      const urlToconsultProduct = `${BASE_URI_ZOHO}/shopifyProducts`;
      const allProducts = await axios.get(urlToconsultProduct);

      // for each item
      for (let index = 0; index < order.line_items.length; index++) {
        const product_line = order.line_items[index];
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

        const priceProduct = parseFloat(Math.floor(product_line.price)) - parseFloat(Math.floor(product_line.total_discount)); 
        // product map for detail
        const product_detail = {
          Producto: product_line.title,
          productDetail: id_product,
          Precio: parseFloat(priceProduct),
          Cantidad: parseInt(product_line.quantity),
          IVA: parseInt(iva_detalle),
          Total: parseFloat(priceProduct) * product_line.quantity,
        };

        products.push(product_detail);
      }

      const adressDetail = `{
          "name": "${order.shipping_address.first_name}", 
          "lastName": "${order.shipping_address.last_name}",
          "adress": "${order.shipping_address.address1} - ${order.shipping_address.address2}", 
          "phone": "${order.shipping_address.phone}", 
          "docNumber": "${order.shipping_address.company}", 
          "email": "${order.customer.email}", 
          "zip": "${order.shipping_address.zip}", 
          "municipality": "${order.shipping_address.city
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")}", 
          "department": "${order.shipping_address.province
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")}"
        }`;
      // build the new order collection
      const update_order = {
        shipingAddressDetail: adressDetail,
        clientOrder: idClient,
        statusOrder: "Creada",
        totalOrder: parseFloat(Math.floor(order.current_subtotal_price)),
        shippingOrder: parseFloat(Math.floor(order.shipping_lines[0].price)),
        paymentOrderValue: parseFloat(Math.floor(order.total_price)),
        detallePedido: products,
      };

      const urlToPatchOrder = `${BASE_URI_ZOHO}/ordersShopify/${id_order}`;
      const responseUpdate = await axios.patch(urlToPatchOrder, update_order);

      if (responseUpdate.status == 200) {
        console.log(`Order Updated Success: ${responseUpdate.data.ID}`);

        const config = {
          headers: {
            "X-Shopify-Access-Token": process.env.ACCESS_TOKEN,
          },
        };

        // if exists transactions for order, update transactions
        const findTransactions = `${BASE_URI_SHOPIFY}/${V_SHOPIFY}/orders/${order.id}/transactions.json`;
        const responseTransactions = await axios.get(findTransactions, config);

        if (responseTransactions.data.transactions.length > 0) {
          console.log(`Search transactions`);

          for (
            let transaction = 0;
            transaction < responseTransactions.data.transactions.length;
            transaction++
          ) {
            const element = responseTransactions.data.transactions[transaction];
            await new transactionService().createTransaction(element);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Method to Decline or reject order
  async declineOrder(rejectDetail) {
    // Config shopify request parameters
    const urlToCancelOrder = `${BASE_URI_SHOPIFY}/${V_SHOPIFY}/orders/${rejectDetail.orderID}/cancel.json`;
    const config = {
      headers: {
        "X-Shopify-Access-Token": process.env.ACCESS_TOKEN,
      },
    };

    const postData = {
      reason: rejectDetail.reason,
    };
    const cancelOrder = await axios.post(urlToCancelOrder, postData, config);
    if (cancelOrder.status == 200) {
      console.log("Order Reject success...");
    }
  }
}

module.exports = orderService;
