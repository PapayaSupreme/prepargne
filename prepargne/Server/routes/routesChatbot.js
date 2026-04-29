module.exports = function(app) {
    const chatbot = require("../controllers/chatbotController.js")

    app.post("/invest-info/chat", chatbot.answerQuestion)
    app.get("/invest-info/chat-test", chatbot.testOpenRouter)
}

