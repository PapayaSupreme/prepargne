const db = require("../models")
const spendingStatsModel = require("./spendingStatsModel")

const BankTransaction = db.bankTransaction

const buildChatContext = async (filters = {}) => {
    const token = filters.token || null
    const where = token ? { token } : {}

    const [summary, recentRows] = await Promise.all([
        spendingStatsModel.buildSpendingStats({ token }),
        BankTransaction.findAll({
            where,
            order: [["dateOp", "DESC"], ["id", "DESC"]],
            limit: filters.recentLimit || 8
        })
    ])

    return {
        hasUploadedData: summary.summary.totalTransactions > 0,
        summary: summary.summary,
        spendingByCategory: summary.spendingByCategory,
        spendingByDay: summary.spendingByDay,
        topSpending: summary.topSpending,
        recentTransactions: recentRows.map(spendingStatsModel.normalizeTransaction)
    }
}

module.exports = {
    buildChatContext
}

