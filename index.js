const express = require('express');
const bodyParser = require('body-parser');
require("dotenv").config()

// Create a new express app 
const app = express();
const PORT = process.env.PORT || 4000;


//Middleware instalation 
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(bodyParser.json());



app.post('/webhook', (req, res) => {
  const data = req.body;
  // Trabajar con la información de la orden recibida
  console.log(data);
  // Realizar acciones según la información recibida
  
  res.status(200).send('Webhook received successfully');
});


// usar las rutas de routers 
const routers = require("./src/Routers/Routers")
app.use("/pruebas", routers)



app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
