const db = require("../models")

const BankTransaction = db.bankTransaction

const toNumber = (value) => {
    if (value === undefined || value === null || value === "") {
        return 0
    }

    const normalized = String(value).trim().replace(/\s+/g, "").replace(",", ".")
    const parsedValue = Number(normalized)
    return Number.isNaN(parsedValue) ? 0 : parsedValue
}

const normalizeDate = (value) => {
    if (!value) {
        return null
    }

    if (value instanceof Date) {
        return value.toISOString().slice(0, 10)
    }

    return String(value).slice(0, 10)
}

const normalizeCategory = (row) => row.category || row.categoryParent || "Uncategorized"

const normalizeTransaction = (row) => {
    const plainRow = typeof row?.get === "function" ? row.get({ plain: true }) : row
    const amount = toNumber(plainRow?.amount)

    return {
        id: plainRow?.id ?? null,
        dateOp: normalizeDate(plainRow?.dateOp),
        label: plainRow?.label || "Unnamed transaction",
        category: normalizeCategory(plainRow || {}),
        amount,
        accountLabel: plainRow?.accountLabel || null,
        accountNum: plainRow?.accountNum || null,
        comment: plainRow?.comment || null,
        token: plainRow?.token || null
    }
}

const buildSpendingStatsFromRows = (rows = []) => {
    const transactions = rows.map(normalizeTransaction).filter((row) => row.dateOp)
    const spendingTransactions = transactions.filter((row) => row.amount < 0)

    const totalSpending = spendingTransactions.reduce((sum, row) => sum + Math.abs(row.amount), 0)
    const totalTransactions = transactions.length
    const spendingTransactionCount = spendingTransactions.length

    const byCategory = new Map()
    const byDay = new Map()

    spendingTransactions.forEach((transaction) => {
        const categoryKey = transaction.category || "Uncategorized"
        const dayKey = transaction.dateOp
        const spentAmount = Math.abs(transaction.amount)

        const categoryEntry = byCategory.get(categoryKey) || {
            category: categoryKey,
            total: 0,
            transactionCount: 0
        }
        categoryEntry.total += spentAmount
        categoryEntry.transactionCount += 1
        byCategory.set(categoryKey, categoryEntry)

        const dayEntry = byDay.get(dayKey) || {
            date: dayKey,
            total: 0,
            transactionCount: 0
        }
        dayEntry.total += spentAmount
        dayEntry.transactionCount += 1
        byDay.set(dayKey, dayEntry)
    })

    const spendingByCategory = Array.from(byCategory.values())
        .sort((left, right) => right.total - left.total || left.category.localeCompare(right.category))

    const spendingByDay = Array.from(byDay.values())
        .sort((left, right) => left.date.localeCompare(right.date))

    const topSpending = spendingTransactions
        .slice()
        .sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount) || right.dateOp.localeCompare(left.dateOp))
        .slice(0, 5)
        .map((transaction) => ({
            ...transaction,
            amount: Math.abs(transaction.amount)
        }))

    const biggestSpending = topSpending[0] || null
    const averageDailySpending = spendingByDay.length > 0 ? totalSpending / spendingByDay.length : 0

    return {
        summary: {
            totalTransactions,
            spendingTransactionCount,
            totalSpending,
            averageDailySpending,
            biggestSpending
        },
        spendingByCategory,
        spendingByDay,
        topSpending
    }
}

const buildSpendingStats = async (filters = {}) => {
    const where = {}
    if (filters.token) {
        where.token = filters.token
    }

    const rows = await BankTransaction.findAll({
        where,
        order: [["dateOp", "ASC"], ["id", "ASC"]]
    })

    return buildSpendingStatsFromRows(rows)
}

module.exports = {
    toNumber,
    normalizeTransaction,
    buildSpendingStatsFromRows,
    buildSpendingStats
}

