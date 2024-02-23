const axios = require("axios");

// Require an instance of fulfillment service 
const fulfillmentService = require("./fullfillmentServices");
const fullfilService = require("./fullfillmentServices");


class billingService {
  constructor() {}

  // Method to create a new billing
  async create_billing(id_order, id_despacho) {
    try {
        console.log("Generating a new billing...")

      // Consult order details in zoho database
      const urlToZohoOrder =
        "https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/";
      const zoho_order = await axios.get(
        `${urlToZohoOrder}/ordersShopify?where=ID%3D%3D${id_order}`
      );
      const despacho = await axios.get(
        `${urlToZohoOrder}/Despachos_Xhobbies_Report?where=ID%3D%3D${id_despacho}`
      );
     
      // Create a new Billing Order
      const billing_detail = zoho_order.data[0];
      const tracking_detail = despacho.data[0];

      const detailOrder = await axios.get(
        `${urlToZohoOrder}/shopifyDetail?where=ordenID%3D%3D${billing_detail.ID}`
      );

      const products = [];
      var totalIva = 0;

      for(let index = 0; index <  detailOrder.data.length; index++) {
        const item =  detailOrder.data[index];
        const product = {
            Producto: item.productDetail.ID,
            Cantidad: parseInt(item.Cantidad),
            Precio: parseFloat(item.Precio),
            IVA: parseFloat(item.IVA),
            Total: parseFloat(item.Total),
            Utilidad: 0,
            Cargo_por_venta: 0,
            Asesor: "1889220000137104120",
          };
          totalIva += parseFloat(item.IVA);
          products.push(product);
      }

      const packings = []
      // Validatew if "Paquetes" field is not empty 
      if (tracking_detail.Paquetes.length > 0) {
        // Create an array with all packings 
        for (let packing = 0; packing < tracking_detail.Paquetes.length; packing++) {
          const element = tracking_detail.Paquetes[packing];
          const new_pack = {
            Tipo_de_empaque: element.Tipo_de_empaque.ID, 
            Peso_kg: element.Peso_kg, 
            Unidades: element.Unidades
          }
          packings.push(new_pack)
        }
      }

      // Create a new dictionary with Billing Values
      const billing = {
        Fecha: "2024-02-22",
        Cliente: billing_detail.clientOrder.ID != null ? billing_detail.clientOrder.ID : "1889220000014774504",
        tipoCliente: "Detal",
        Tipo_Factura: "Contado",
        Financieras: "1889220000132747937",
        Marketplace: "1889220000137194583", 
        Redes2: "No",
        Zona: "1889220000135235205",
        Aseso: "1889220000137104120",
        Bodega: tracking_detail.Bodega.ID,
        Cuenta: "1889220000137104130",
        Cargo_por_ventas: 0,
        Otras_Deducciones: 0,
        RT_Pago_Digital: 0,
        Rete_Iva: 0,
        Rete_Fuente: 0,
        Rete_Ica: 0,
        Envio: parseFloat(billing_detail.shippingOrder),
        Transportadora: tracking_detail.Transportadora,
        tipo_merca: "Mercancía",
        Vendedor: "1889220000125851460",
        Item: products,
        Observacion: `Venta Shopify. Order ${billing_detail.orderName}. ASEGURADO CON SEGUROS BOLIVAR`,
        Subtotal: parseFloat(
          billing_detail.paymentOrderValue - billing_detail.shippingOrder - totalIva
        ),
        Total: parseFloat(billing_detail.paymentOrderValue),
        Iva_Total: parseFloat(totalIva),
        Valor_Declarado: parseFloat(tracking_detail.Valor_Declarado),
        orderShopify: billing_detail.orderId,
        Paquetes: packings,
        shipingAddressDetail: billing_detail.shipingAddressDetail
      };

      // Config and send post To create Billing
      const urlToCreateBilling =
        "https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/Remision";
      const responseBilling = await axios.post(urlToCreateBilling, billing);

      if (responseBilling.status == 200 && responseBilling.data != null ) {
        console.log(
          `Billing Created successfully... ${responseBilling.data.ID}`
        );  
        // if transport information is "Propia", update tracking information for this order 
            if (tracking_detail.Transportadora === "Propia") {
                const trackingInformation = {
                    company: tracking_detail.transportName, 
                    guia_number: tracking_detail.guideNumber, 
                }
                // Call a new fulfillment service and update tracking information 
                const newFullfilmentTracking = new fullfilService(); 
                await newFullfilmentTracking.updateTrackingInformation(trackingInformation, billing_detail.orderId);
            }
      }else{
        console.log("Invoice not generating!!!")
      }
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = billingService;
