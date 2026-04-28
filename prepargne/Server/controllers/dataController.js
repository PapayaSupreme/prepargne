const db = require("../models")
const { parse } = require("csv-parse/sync")
const spendingStatsModel = require("../models/spendingStatsModel")
const BankTransaction = db.bankTransaction

const parseDecimal = (value) => {
    if (value === undefined || value === null || value === "") {
        return null
    }

    const normalized = String(value).trim().replace(/\s+/g, "").replace(",", ".")
    const parsedValue = Number.parseFloat(normalized)

    return Number.isNaN(parsedValue) ? null : parsedValue
}

const parseCsvBuffer = (buffer) => {
    return parse(buffer, {
        columns: true,
        delimiter: ";",
        bom: true,
        skip_empty_lines: true,
        trim: true
    })
}

exports.addInfo = (req, res) => { //Expects JSON with revenue, token to put in table and score
    res.status(200).send({ message: "WIP." })
}

exports.addSpending = (req, res) => { //Will handle JSON array with info, loop to put each record
    res.status(200).send({ message: "WIP." })
}

exports.patchRevenue = (req, res) => { //Update following above
    res.status(200).send({ message: "WIP." })
}

exports.updateSpending = (req, res) => {
    res.status(200).send({ message: "WIP." })
}

exports.retrieveData = (req, res) => { //The get that will get all the precious data
    const token = req.query.token || null

    spendingStatsModel.buildSpendingStats({ token })
        .then(async (stats) => {
            const where = token ? { token } : {}
            const rows = await BankTransaction.findAll({
                where,
                order: [["dateOp", "ASC"], ["id", "ASC"]]
            })

            return res.status(200).send({
                ...stats,
                transactions: rows.map(spendingStatsModel.normalizeTransaction)
            })
        })
        .catch((err) => {
            return res.status(500).send({ message: "Failed to retrieve data: " + err.message })
        })
}

exports.uploadCsv = async (req, res) => {
    if (!req.file || !req.file.buffer) {
        return res.status(400).send({ message: "Missing CSV file. Use multipart/form-data with field 'file'." })
    }

    try {
        const csvRows = parseCsvBuffer(req.file.buffer)
        if (csvRows.length === 0) {
            return res.status(400).send({ message: "CSV file is empty." })
        }

        const rowsToInsert = csvRows
            .map((row) => {
                return {
                    dateOp: row.dateOp || null,
                    dateVal: row.dateVal || null,
                    label: row.label || null,
                    category: row.category || null,
                    categoryParent: row.categoryParent || null,
                    supplierFound: row.supplierFound || null,
                    amount: parseDecimal(row.amount),
                    comment: row.comment || null,
                    accountNum: row.accountNum || null,
                    accountLabel: row.accountLabel || null,
                    accountBalance: parseDecimal(row.accountbalance),
                    token: null
                }
            })
            .filter((row) => row.dateOp && row.label && row.amount !== null)

        if (rowsToInsert.length === 0) {
            return res.status(400).send({ message: "No valid CSV lines found after parsing." })
        }

        await BankTransaction.bulkCreate(rowsToInsert)

        return res.status(201).send({
            message: "CSV imported successfully.",
            importedRows: rowsToInsert.length,
            skippedRows: csvRows.length - rowsToInsert.length
        })
    } catch (err) {
        return res.status(500).send({ message: "CSV import failed: " + err.message })
    }
}

exports.parseCsvBuffer = parseCsvBuffer

