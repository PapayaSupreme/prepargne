const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require("cors")

app.use(cors({methods: 'GET,PUT,PATCH,POST,DELETE,LOCK,UNLOCK,REPORT'}))
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const db = require("./models")
db.sequelize.sync({alter: true}).then(() => {
    console.log("heyyy macarena");
})
console.log(typeof db.sequelize.sync);

app.listen(PORT, () => {
  console.log(`Prepargne server is running on http://localhost:${PORT}`);
});