module.exports = function(app) {

    var data = require("../controllers/dataController.js")

    app.put("/invest-info", data.addInfo) //function to register investor score and revenue
    app.post("/invest-info", data.addSpending) //Add spending categories from formular
    app.unlock("/invest-info", data.patchRevenue) //updates tokenized data
    app.patch("/invest-info", data.updateSpending) //Redo spending info
    app.get("/invest-info", data.retrieveData) //Retrieve Data from all tables in JSON to feed the chatbot

}