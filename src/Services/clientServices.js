const axios = require("axios");

const BASE_URI_ZOHO = process.env.ZOHO_URL;

class clientService {
  constructor() {}

  // Method to create client
  async createClient(clientData, documentClient) {
    // find the municipality and department of client
    const idMunicipality = await this.getMunicipality(
      clientData.default_address.city,
      clientData.default_address.province
    );

    console.log("Creating a new client")
    // create the object with the client information
    const newClient = {
      Tipo1: "cc",
      Documento: documentClient,
      Retenedor: "No",
      Regimen: "persona natural - regimen simplificado",
      Nombre: clientData.first_name,
      Primer_Apellido: clientData.last_name,
      Celular: clientData.default_address.phone != null ? clientData.default_address.phone.replace("+57", "").replace(" ", "") : 0,
      Correo: clientData.email != null ? clientData.email : "notiene@chacam.co",
      Fecha_de_Nacimiento: "2000-01-01",
      Municipio: idMunicipality,
      Departamento1: idMunicipality,
      location: {
        country2: "Colombia",
        district_city2: clientData.default_address.city,
        state_province2: clientData.default_address.province,
        address_line_12: clientData.default_address.address1,
      },
      Tipo_Direccion: "Casa",
      Tipo: "Detal",
      Cupo: 0,
      Estado: "Activo",
      Zona: "1889220000135235205",
    };
    
    // Try- catch => Errors
    try {
      // Call the API to create a client
      const createClient = await axios.post(`${BASE_URI_ZOHO}/Clientes`,
        newClient
      );
      // return ID of creation
      return await createClient.data.data[0].ID;
    } catch (error) {
      console.error(error);
    }
  }

  // Method to get municipality for customer
  async getMunicipality(municipality, department) {
    try {
      // define the API url and the call
      var idMunicipality = "";

      // Regex to convert text in lower case for municipality to find 
      var municipalityToFind = municipality.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      municipalityToFind = municipalityToFind.toLowerCase()

      // // Regex to convert text in lower case for department to find 
      var departmentToFind = department.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      departmentToFind = departmentToFind.toLowerCase(); 

      const urlMunicipality = `${BASE_URI_ZOHO}/Municipio1?where=Municipio.contains("${municipalityToFind}")%26%26Departamento.contains("${departmentToFind}")`;
      const response = await axios.get(urlMunicipality);

      // if response isn't null
      if (response.data.data.length > 0) {
        idMunicipality = response.data.data[0].ID;
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
