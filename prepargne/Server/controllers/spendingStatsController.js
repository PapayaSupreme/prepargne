const spendingStatsModel = require("../models/spendingStatsModel")

exports.getSpendingStats = async (req, res) => {
    try {
        const stats = await spendingStatsModel.buildSpendingStats({
            token: req.query.token || null
        })

        return res.status(200).send(stats)
    } catch (err) {
        return res.status(500).send({ message: "Failed to build spending stats: " + err.message })
    }
}
