const axios = require("axios")


class productService {

    constructor(){}

    // Method to create a product 
    async createProduct(idProduct){

        // Config shopify request parameters 
        const urlConsultProduct = `https://tiendaxhobbies.myshopify.com/admin/api/2024-01/products/${idProduct}.json`; 
        const config = {
            headers: {
              "X-Shopify-Access-Token": process.env.SECRET_KEY,
            },
        };

        // Search product in shopify account 
        const product_response = await axios.get(urlConsultProduct, config);
 
        try {

            // New product object 
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
                CodigoTecnosuper: product_response.id,
              };

              urlToCreateProducts = "https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/Productos"
              const insertProduct = await axios.post(urlToCreateProducts,
                  new_product
              );
  
              return insertProduct.data.ID
            
        } catch (error) {
            console.error(error)
        }
    }

}



module.exports = productService