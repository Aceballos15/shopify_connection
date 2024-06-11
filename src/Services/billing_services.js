const axios = require("axios");

// Require an instance of fulfillment service 
const fullfilService = require("./fullfillmentServices");

const BASE_URI_ZOHO = process.env.ZOHO_URL;

// Class to invoice services and zoho validations 
class billingService {
  constructor() {}

  // Method to create a new billing
  async create_billing(id_order, id_despacho) {
    try {
        console.log("Generating a new billing...")

      // Consult order details in zoho database
      const zoho_order = await axios.get(
        `${BASE_URI_ZOHO}/ordersShopify?where=ID==${id_order}`
      );
      const despacho = await axios.get(
        `${BASE_URI_ZOHO}/Despachos_Xhobbies_Report?where=ID==${id_despacho}`
      );
     
      // Create a new Billing Order
      const billing_detail = zoho_order.data.data[0];
      const tracking_detail = despacho.data.data[0];

      console.log(billing_detail.data);
      console.log(billing_detail.data);
      const detailOrder = await axios.get(
        `${BASE_URI_ZOHO}/shopifyDetail?where=ordenID==${billing_detail.ID}`
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
        Fecha: new Date().toISOString().slice(0, 10),
        Cliente: billing_detail.clientOrder.ID != null ? billing_detail.clientOrder.ID : "1889220000014774504",
        tipoCliente: "Detal",
        Tipo_Factura: "Contado",
        Financieras: "1889220000132747937",
        Marketplace: "1889220000137194583", 
        Redes2: "No",
        Zona: tracking_detail.Zona.ID,
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
        tipo_merca: tracking_detail.Tipo_merca,
        Vendedor: "1889220000125851460",
        Item: products,
        Observacion: `Venta Shopify. Order ${billing_detail.orderName}. ASEGURADO CON SEGUROS BOLIVAR`,
        Subtotal: parseFloat(
          billing_detail.paymentOrderValue - billing_detail.shippingOrder - totalIva
        ),
        Total: parseFloat(billing_detail.paymentOrderValue),
        Iva_Total: parseFloat(totalIva),
        Valor_Declarado: parseFloat(tracking_detail.Valor_Declarado),
        orderShopify: billing_detail.codeOrder,
        Paquetes: packings,
        shipingAddressDetail: billing_detail.shipingAddressDetail
      };

      console.log(billing); 
      
      // Config and send post To create Billing
      const responseBilling = await axios.post(`${BASE_URI_ZOHO}/Remision`, billing);

      if (responseBilling.status == 200 && responseBilling.data != null ) {
        console.log(
          `Billing Created successfully... ${responseBilling.data.data.ID}`
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
