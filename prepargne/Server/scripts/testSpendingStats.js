const fs = require("fs")
const path = require("path")
const dataController = require("../controllers/dataController")
const spendingStatsModel = require("../models/spendingStatsModel")

const csvPath = process.argv[2] || path.resolve(__dirname, "../../../sample_data.csv")

try {
    const csvBuffer = fs.readFileSync(csvPath)
    const rows = dataController.parseCsvBuffer(csvBuffer)
    const stats = spendingStatsModel.buildSpendingStatsFromRows(rows)

    console.log("Parsed rows:", rows.length)
    console.log("Spending transactions:", stats.summary.spendingTransactionCount)
    console.log("Total spending:", stats.summary.totalSpending.toFixed(2))
    console.log("Top category:", stats.spendingByCategory[0] ? `${stats.spendingByCategory[0].category} (${stats.spendingByCategory[0].total.toFixed(2)})` : "n/a")
    console.log("Biggest spending:", stats.summary.biggestSpending ? `${stats.summary.biggestSpending.label} (${stats.summary.biggestSpending.amount.toFixed(2)})` : "n/a")
} catch (err) {
    console.error("Spending stats test failed:", err.message)
    process.exit(1)
}
