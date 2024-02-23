const axios = require("axios");
const fulfillmentService = require("./fullfillmentServices");
const productService = require("./productServices");

// Create one class of Order
class orderService {
  constructor() {}

  // Method to create a new order in zoho database
  async createOrder(order, idClient) {
    try {
      const validateOrderExists = await this.validateOrder(order.id);
      if (!validateOrderExists.status) {
        console.log("Order not found. Creating....");
        // Create an array for product detail list
        const products = [];

        // Find products in zoho database
        const urlToconsultProduct =
          "https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/shopifyProducts";
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

          // Find object in zoho array returns
          const object_product = allProducts.data.find(
            (object) => object.numberShopify == String(product_line.product_id)
          );
          var id_product = "";
          if (object_product !== null && object_product !== undefined) {
            id_product = object_product.ID;
          } else {
            // if doesn´t exists product in zoho database, create a new product (Call product service)
            const newServiceproduct = new productService();
            id_product = await newServiceproduct.createProduct(
              product_line.product_id
            );
          }

          // product map for detail
          const product_detail = {
            Producto: product_line.title,
            productDetail: id_product,
            Precio: parseFloat(product_line.price),
            Cantidad: parseInt(product_line.quantity),
            IVA: parseInt(iva_detalle),
            Total: parseFloat(product_line.price) * product_line.quantity,
          };

          products.push(product_detail);
        }

        const adressDetail = `{
          "name": ${order.shipping_address.first_name}, 
          "lastName": ${order.shipping_address.last_name},
          "adress": ${order.shipping_address.address1}, 
          "phone": ${order.shipping_address.phone}, 
          "docNumber": ${order.shipping_address.company}, 
          "email": ${order.customer.email}, 
          "zip": ${order.shipping_address.zip}, 
          "municipality": ${order.shipping_address.city.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}, 
          "department": ${order.shipping_address.province.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}
        }`
        // build the new order collection
        const new_order = {
          dateOrder: order.created_at.substring(10, -1),
          clientOrder: idClient,
          shipingAddressDetail: adressDetail,
          orderId: order.id.toString(),
          orderName: order.name,
          statusOrder: "Creada",
          paymentValidate: "Pendiente",
          payStatusOrder: order.financial_status,
          totalOrder: parseFloat(order.current_subtotal_price),
          shippingOrder: parseFloat(order.shipping_lines[0].price),
          paymentOrderValue: parseFloat(order.total_price),
          detallePedido: products,
        };

        // Url for post conect with zoho creator and petition function
        const urlCreateOrder =
          "https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/ordersShopifyCreate";
        const response = await axios.post(urlCreateOrder, new_order);
        console.log(
          `Order created succesfully.....ID orden: ${response.data.ID}`
        );
        return response;
      } else {

        // Found one order or more, try to update order 
        console.log(`Updating Order: ${order.name}`);
        this.updateOrder(validateOrderExists.idOrder, order)

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
      const urlOrder = `https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/ordersShopify?where=orderId%3D%3D%22${idOrder}%22`;
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
        const updateOrderUrl = `https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/ordersShopify/${validateOrderExists.idOrder}`;
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
      const products = [];
      // Find products in zoho database
      const urlToconsultProduct =
      "https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/shopifyProducts";
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

        // Find object in zoho array returns
        const object_product = allProducts.data.find(
          (object) => object.numberShopify == String(product_line.product_id)
        );
        var id_product = "";
        if (object_product !== null && object_product !== undefined) {
          id_product = object_product.ID;
        } else {
          // if doesn´t exists product in zoho database, create a new product (Call product service)
          const newServiceproduct = new productService();
          id_product = await newServiceproduct.createProduct(
            product_line.product_id
          );
        }

        // product map for detail
        const product_detail = {
          Producto: product_line.title,
          productDetail: id_product,
          Precio: parseFloat(product_line.price),
          Cantidad: parseInt(product_line.quantity),
          IVA: parseInt(iva_detalle),
          Total: parseFloat(product_line.price) * product_line.quantity,
        };

        products.push(product_detail);
      }

      const adressDetail = `{
          "name": ${order.shipping_address.first_name}, 
          "lastName": ${order.shipping_address.last_name}, 
          "adress": ${order.shipping_address.address1}, 
          "phone": ${order.shipping_address.phone}, 
          "docNumber": ${order.shipping_address.company}, 
          "email": ${order.customer.email}, 
          "zip": ${order.shipping_address.zip}, 
          "municipality": ${order.shipping_address.city.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}, 
          "department": ${order.shipping_address.province.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}
        }`
      // build the new order collection
      const update_order = {
        shipingAddressDetail: adressDetail,
        statusOrder: "Creada",
        totalOrder: parseFloat(order.current_subtotal_price),
        shippingOrder: parseFloat(order.shipping_lines[0].price),
        paymentOrderValue: parseFloat(order.total_price),
        detallePedido: products,
      };

      const urlToPatchOrder = `https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/ordersShopify/${id_order}`; 
      const responseUpdate = await axios.patch(urlToPatchOrder, update_order); 

      if (responseUpdate.status == 200) {
        console.log(`Order Updated Success: ${responseUpdate.data.ID}`)
      }

    } catch (error) {
      console.error(error)
    }
  }

  // Method to Decline or reject order 
  async declineOrder(rejectDetail){
    // Config shopify request parameters 
    const urlToCancelOrder = `https://tiendaxhobbies.myshopify.com/admin/api/2024-01/orders/${rejectDetail.orderID}/cancel.json`
    const config = {
        headers: {
          "X-Shopify-Access-Token": process.env.SECRET_KEY,
        },
    };

    const postData = {
      reason : rejectDetail.reason
    }
    const cancelOrder = await axios.post(urlToCancelOrder, postData, config); 
    if (cancelOrder.status == 200) {
      console.log("Order Reject success..."); 
    }

  }

}

module.exports = orderService;
