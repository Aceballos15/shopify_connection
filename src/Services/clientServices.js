const axios = require("axios");
const { response } = require("express");
urlCreateClient =
  "https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/Clientes";

class clientService {
  constructor() {}

  // Method to create client
  async createClient(clientData) {
    // find the municipality and department of client
    const idMunicipality = await this.getMunicipality(
      clientData.default_address.city,
      clientData.default_address.province
    );

    // create the object with the client information
    const newClient = {
      Tipo1: "cc",
      Documento: clientData.default_address.company,
      Retenedor: "No",
      Regimen: "persona natural - regimen simplificado",
      Nombre: clientData.first_name,
      Primer_Apellido: clientData.last_name,
      Celular: clientData.default_address.phone,
      Correo: clientData.email,
      Fecha_de_Nacimiento: "2000-01-01",
      Municipio: idMunicipality,
      Departamento1: idMunicipality,
      location: {
        country: "Colombia",
        district_city: clientData.default_address.city,
        state_province: clientData.default_address.province,
        address_line_1: clientData.default_address.address1,
      },
      Tipo_Direccion: "Casa",
      Tipo: "Detal",
      Cupo: 0,
      Estado: "Activo",
      Zona: "1889220000135235205",
    };

    console.log(newClient)

    // Try- catch => Errors
    try {
      // Call the API to create a client
      const createClient = await axios.post(
        "https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/Clientes",
        newClient
      );
      // return ID of creation
      return createClient.data.ID;
    } catch (error) {
      console.error(error);
    }
  }

  // Method to get municipality for customer
  async getMunicipality(municipality, department) {
    try {
      // define the API url and the call
      var idMunicipality = "";
      const urlMunicipality = `https://nexyapp-f3a65a020e2a.herokuapp.com/zoho/v1/console/Municipio1?where=Municipio.contains("${municipality}")%26%26Departamento.contains("${department}")`;
      const response = await axios.get(urlMunicipality);

      // if response isn't null
      if (response.data.length > 0) {
        idMunicipality = response.data[0].ID;
      } else {
        idMunicipality = "1889220000014635007";
      }
      // return ID => municipality in zoho database
      return idMunicipality;
    } catch (error) {
      //  Console the error
      console.error(error);
    }
  }
}

module.exports = clientService;
