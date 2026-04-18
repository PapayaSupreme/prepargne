const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require("cors")

const route1 = require("./routes/routesUser.js")
const route2 = require("./routes/routesData.js")

app.use(cors({methods: 'GET,PUT,PATCH,POST,DELETE,LOCK,UNLOCK,REPORT'}))
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const db = require("./models")
db.sequelize.sync({alter: true}).then(() => {
    console.log("heyyy macarena");
}).catch((err) => {
    console.log("Failed to sync db: " + err.message)
})

route1(app)
route2(app)

app.listen(PORT, () => {
  console.log(`Prepargne server is running on http://localhost:${PORT}`);
});