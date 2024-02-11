const axios = require("axios");

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

        // for each item
        order.line_items.forEach((product_line) => {
          // If product is taxed, calculate the VAT
          var iva_detalle = 0;
          if (product_line.taxable === true) {
            iva_detalle =
              (parseFloat(product_line.price) -
                parseFloat(product_line.price) / 1.19) *
              parseInt(product_line.quantity);
          }

          // product map for detail
          const product_detail = {
            Producto: product_line.title,
            Precio: parseFloat(product_line.price),
            Cantidad: parseInt(product_line.quantity),
            IVA: parseInt(iva_detalle),
            Total: parseFloat(product_line.price) * product_line.quantity,
          };

          products.push(product_detail);
        });

        // build the new order collection
        const new_order = {
          dateOrder: order.created_at.substring(10, -1),
          clientOrder: idClient,
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
          idOrder: findOrder.data.ID
        };
      // else return status false 
      } else {
        return {
          status: false
        };
      }
    } catch (error) {
      console.error(error);
    }
  }


  // method to cancell an order 
  async cancelOrder(order, req, res) {
    try {

      // Validate if exists an order with this order.id
      const validateOrderExists = await this.validateOrder(order.id); 
      if(!validateOrderExists.status){

        console.log("Order doesn't exist in zoho database")
        return "order doesn't exist in zoho database"

      }else{
        // Url and new data to update this order 
        const updateOrderUrl =`https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/ordersShopify/${validateOrderExists.idOrder}`;
        const new_data = {
          statusOrder: "Cancelada"
        }

        // Patch request and response log 
        const updateOrder = await axios.patch(updateOrderUrl, new_data);
        if(updateOrder.data !== null ){
          console.log(`Order Canceled succesfully. Order id: ${updateOrder.data}`)
        } 

      }
      
    } catch (error) {  
      console.error(error)
    }
  }

}

module.exports = orderService;


