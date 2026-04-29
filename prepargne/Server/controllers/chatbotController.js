const chatbotModel = require("../models/chatbotModel")
const chatbotService = require("../../chatbot/chatbot")

exports.testOpenRouter = async (req, res) => {
    console.log("[Test] Testing OpenRouter API...")
    try {
        const testResult = await chatbotService.testOpenRouterConnection()
        return res.status(200).send(testResult)
    } catch (err) {
        console.error("[Test] Error:", err)
        return res.status(500).send({ error: err.message })
    }
}

exports.answerQuestion = async (req, res) => {
    const question = String(req.body?.question || "").trim()
    console.log("[Controller] Chat request received, question:", question.substring(0, 50))
    if (!question) {
        return res.status(400).send({ message: "Missing question text." })
    }

    try {
        const context = await chatbotModel.buildChatContext({
            token: req.body?.token || req.query?.token || null,
            recentLimit: 8
        })

        res.status(200)
        res.setHeader("Content-Type", "text/plain; charset=utf-8")
        res.setHeader("Cache-Control", "no-cache, no-transform")
        res.setHeader("X-Accel-Buffering", "no")

        if (typeof res.flushHeaders === "function") {
            res.flushHeaders()
        }

        console.log("[Controller] Starting stream response")

        await chatbotService.streamAnswer({
            question,
            context,
            onToken: (token) => {
                res.write(token)
            }
        })

        return res.end()
    } catch (err) {
        if (res.headersSent) {
            return res.end()
        }

        return res.status(500).send({ message: "Failed to answer chatbot question: " + err.message })
    }
}

