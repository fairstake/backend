const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const routeManager = require('./routes/route.manager.js')
const { createsocket } = require("./socket/index.js");
const { createServer } = require("node:http");

require("dotenv").config();
// ============ Initilize the app ========================
const app = express();
app.use(express.json({limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true , limit: '50mb'}));

app.use(cors({
  origin : ["https://fairstake-admin.netlify.app", 
        "http://localhost:5173","http://localhost:3000", 
        "https://trademaxoption.com"
      ]
}));

const server = createServer(app);
async function main() {
  createsocket(server);
}
main();

// application routes
routeManager(app)

app.get("/", (req, res) => {
  res.send("Welcome to Wager backend server");
})

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).json({
      status: false,
      code  : 500,
      error : `Can't find ${err.stack}`
  });
});

// 404 handler
app.use(function (req, res, next) {
  res.status(404).json({
      status: false,
      code  : 404,
      error : `Can't find ${req.originalUrl}`
  });
});

mongoose.set('strictQuery', false);
// const dbUri = `mongodb://127.0.0.1:27017/fairbet`;
const dbUri = `mongodb+srv://valiantjoee:L4Gq484PPz5VLRpA@cluster0.k7tpqpw.mongodb.net/wager1?retryWrites=true&w=majority&appName=Cluster0`

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000  })
  .then((result) => console.log('Database connected'))
  .catch((err) => console.log("Database failed to connect"))
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log("Running on port " + PORT);
});