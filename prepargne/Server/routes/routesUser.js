module.exports = function(app) {

    var user = require("../controllers/userController.js")

    app.put("/log-in", user.create)
    app.post("/log-in", user.logIn)
    app.delete("/log-in", user.delete)

}