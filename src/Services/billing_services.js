const axios = require("axios")


class billingService {

    constructor() {}

    // Method to create a new billing 
    async create_billing(id_order, id_despacho){

        // Consult order details in zoho database 
        const urlToZohoOrder = "https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/"; 
        const zoho_order = await axios.get(`${urlToZohoOrder}/ordersShopify?where=ID%3D%3D%22${id_order}6%22`); 
        const despacho = await axios.get(`${urlToZohoOrder}/Despachos_Xhobbies_Report?where=ID%3D%3D%22${id_despacho}6%22`); 

        // Create a new Billing Order
        const billing_detail = zoho_order.data; 
        const tracking_detail = despacho.data; 

        // Create a Dictionary of Billing
        const billing = {
            Fecha: "2024-20-02", 
            Cliente: billing_detail.clientOrder.ID ?? "1889220000014774504", 
            tipoCliente: "Detal", 
            Tipo_Factura: "Contado", 
            Financieras: "1111", 
            Redes2: "No", 
            Zona: ""
        }




    }


}


module.exports = billingService


