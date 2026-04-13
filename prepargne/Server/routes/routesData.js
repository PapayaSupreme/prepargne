module.exports = function(app) {

    var data = require("../controllers/dataController.js")
    var stats = require("../controllers/spendingStatsController.js")
    const multer = require("multer")
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 }
    })

    app.put("/invest-info", data.addInfo) //function to register investor score and revenue
    app.post("/invest-info", data.addSpending) //Add spending categories from formular
    app.patch("/invest-info", data.patchRevenue) //updates tokenized data
    app.post("/invest-info", data.updateSpending) //Redo spending info
    app.get("/invest-info", data.retrieveData) //Retrieve Data from all tables in JSON to feed the chatbot
    app.get("/invest-info/stats", stats.getSpendingStats)
    app.post("/invest-info/upload-csv", upload.single("file"), data.uploadCsv)

}