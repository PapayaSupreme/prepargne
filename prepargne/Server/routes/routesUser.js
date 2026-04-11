module.exports = function(app) {

    var user = require("../controllers/userController.js")

    app.put("/register", user.create)

}