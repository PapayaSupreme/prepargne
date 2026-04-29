const db = require("../models")
const config = require("../config/auth.config.js")
const User = db.user
const Tokenized = db.tokenized
const Spending = db.spending
const Op = db.Sequelize.Op
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

var jwt = require("jsonwebtoken")
var crypto = require("crypto")

exports.addInfo = (req, res) => { //Expects JSON with revenue, token to put in table and score
    if (req.body === undefined) {
        return res.status(400).send({ message : "Empty request body." })
    }
    if (req.body.token === undefined | req.body.score === undefined | req.body.revenue === undefined) {
        return res.status(400).send({ message : "Missing parameters." })
    }
    jwt.verify(req.body.token, config.secret, (err, decoded) => { 
        if (err) { 
            return res.status(401).send({ 
            message: "Unauthorized." 
            }); 
        }

        var hashed = crypto.createHmac('sha256', config.secret).update(decoded.id + decoded.username, 'utf8').digest('hex') //fabrics hash with token info

        Tokenized.create({
            hash: hashed,
            revenue: req.body.revenue,
            investorScore: req.body.score
        }).then(() => {
            res.status(200).send({ message: "Information about user " + decoded.id + " registered." })
        }).catch(err => {
            res.status(500).send({ message: err.message })
        })
    })
}

exports.addSpending = (req, res) => { //Will handle JSON array with info, loop to put each record
    if (req.body === undefined) {
        return res.status(400).send({ message : "Empty request body." })
    }
    if (req.body.token === undefined | req.body.spendings === undefined) {
        return res.status(400).send({ message : "Missing parameters." })
    }
    jwt.verify(req.body.token, config.secret, (err, decoded) => { //Checks jwt token
            if (err) { 
              return res.status(401).send({ 
                message: "Unauthorized." 
              }); 
            }

            //Received JSON structure check
            const schema = {
                amount_spent: "number",
                category: "string"
            }

            if (req.body.spendings.length == 0) {
                res.status(400).send({ message: "Invalid JSON Array : empty spendings array." })
                return
            }

            for (let i = 0; i < req.body.spendings.length; i++) {
                var item = req.body.spendings[i];

                // Ensure each item is an object
                if (typeof item !== "object" || item === null || Array.isArray(item)) {
                    res.status(400).send({ message: "Invalid JSON Array : Item at index ${i} is not a valid object." });
                    return
                }

                // Check each schema key and the type of the entry
                for (const [key, type] of Object.entries(schema)) {
                    if (!(key in item)) {
                        res.status(400).send({ message: `Invalid JSON Array : Missing key "${key}" in item at index ${i}.` });
                        return
                    }
                    if (typeof item[key] !== type) {
                        res.status(400).send({ message: `Invalid JSON Array : Key "${key}" in item at index ${i} should be of type "${type}".` });
                        return
                    }
                }

            }

            for (let i = 0; i < req.body.spendings.length; i++) { //Sends as many INSERT INTO queries as necessary to add to the records the spendings

                var hashed = crypto.createHmac('sha256', config.secret).update(decoded.id + decoded.username, 'utf8').digest('hex')

                Spending.create({
                    hash: hashed,
                    amount_spent: req.body.spendings[i]["amount_spent"],
                    category: req.body.spendings[i]["category"]
                }).then(() => {
                    console.log("Spending about user " + req.body.token + " registered : " + req.body.spendings[i]["amount_spent"] + " spent on " + req.body.spendings[i]["category"] + ".")
                }).catch(error => {
                    res.status(500).send({ message: error })
                    return
                })
            }

            res.status(200).send({ message: "Spendings put successfully." })
        })
}

exports.patchRevenue = (req, res) => { //Update following above
    if (req.body === undefined) {
        return res.status(400).send({ message : "Empty request body." })
    }
    if (req.body.token === undefined | req.body.score === undefined | req.body.revenue === undefined) {
        return res.status(400).send({ message : "Missing parameters." })
    }
    jwt.verify(req.body.token, config.secret, (err, decoded) => { 
            if (err) { 
              return res.status(401).send({ 
                message: "Unauthorized." 
              }); 
            }

            var hashed = crypto.createHmac('sha256', config.secret).update(decoded.id + decoded.username, 'utf8').digest('hex')

            Tokenized.update({
                revenue: req.body.revenue,
                investorScore: req.body.score
            }, { where : {
                hash: hashed
            }}).then(() => {
                res.status(200).send({ message: "Information about user " + decoded.id + " updated." })
            }).catch(err => {
                res.status(500).send({ message: err.message })
            })
    })
}

exports.updateSpending = (req, res) => {
    if (req.body === undefined) {
        return res.status(400).send({ message : "Empty request body." })
    }
    if (req.body.token === undefined | req.body.spendings === undefined) {
        return res.status(400).send({ message : "Missing parameters." })
    }
    jwt.verify(req.body.token, config.secret, (err, decoded) => { 
        if (err) { 
            return res.status(401).send({ 
                message: "Unauthorized." 
            }); 
        }

        var hashed = crypto.createHmac('sha256', config.secret).update(decoded.id + decoded.username, 'utf8').digest('hex')

        //Received JSON structure check
        const schema = {
            amount_spent: "number",
            category: "string",
            changeType: "number", //Specifies what kind of change to apply, see switch case below
            formerName: "string" //Specifically for the renaming a column case, else leave empty
        }

        if (req.body.spendings.length == 0) {
            res.status(400).send({ message: "Invalid JSON Array : empty spendings array." })
            return
        }

        for (let i = 0; i < req.body.spendings.length; i++) {
            var item = req.body.spendings[i];

            // Ensure each item is an object
            if (typeof item !== "object" || item === null || Array.isArray(item)) {
                res.status(400).send({ message: "Invalid JSON Array : Item at index ${i} is not a valid object." });
                return
            }

            // Check each schema key and the type of the entry
            for (const [key, type] of Object.entries(schema)) {
                if (!(key in item)) {
                    res.status(400).send({ message: `Invalid JSON Array : Missing key "${key}" in item at index ${i}.` });
                    return
                }
                if (typeof item[key] !== type) {
                    res.status(400).send({ message: `Invalid JSON Array : Key "${key}" in item at index ${i} should be of type "${type}".` });
                    return
                }
            }

        }

        for (let i = 0; i < req.body.spendings.length; i++) { //Sends as many UPDATE queries as necessary to add to the records the spendings

            switch (req.body.spendings[i]["changeType"]) {

                case 0: //Just updating an amount
                    Spending.update({
                        amount_spent: req.body.spendings[i]["amount_spent"],
                    }, { where: {
                        category: req.body.spendings[i]["category"],
                        hash: hashed
                    }}).then(() => {
                        console.log("Spending about user " + req.body.token + " updated : " + req.body.spendings[i]["amount_spent"] + " spent on " + req.body.spendings[i]["category"] + ".")
                    }).catch(error => {
                        res.status(500).send({ message: error })
                        return
                    })
                    break

                case 1: //Category update with or without amount modification, to send less data
                    Spending.update({
                        amount_spent: req.body.spendings[i]["amount_spent"],
                        category: req.body.spendings[i]["category"]
                    }, { where: {
                        category: req.body.spendings[i]["formerName"],
                        hash: hashed
                    }}).then(() => {
                        console.log("Spending about user " + req.body.token + " updated : " + req.body.spendings[i]["amount_spent"] + " spent on " + req.body.spendings[i]["category"] + ".")
                    }).catch(error => {
                        res.status(500).send({ message: error })
                        return
                    })
                    break

                case 2:
                    Spending.findOne({ attributes: ["amount_spent", "category", "hash"], where: { amount_spent: req.body.spendings[i]["amount_spent"], category: req.body.spendings[i]["category"], hash: hashed}}).then( record => {
                        if (!record) {
                            console.log("Not found.")
                        } else {
                            Spending.destroy({ where: { amount_spent: req.body.spendings[i]["amount_spent"], category: req.body.spendings[i]["category"], hash: hashed} }).then(() => {
                                console.log("Deletion for user " + req.body.token + " proceeded at : " + req.body.spendings[i]["amount_spent"] + " spent on " + req.body.spendings[i]["category"] + ".")
                            }).catch((err) => {
                                return res.status(500).send({ message: "Spending deletion failed : " + err.message })
                            })
                        }
                    }).catch(err => {
                        return res.status(500).send({ message: "Exception has occurred during user fetching : " + err.message })
                    })
                    break

                default:
                    res.status(400).send({ message: "Illegal state exception in changeType." })
                    break

            }
        }

        res.status(200).send({ message: "Spendings updated successfully." })
    })
}

exports.retrieveTransactions = (req, res) => { //Separated by the force of github branch conflict management
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

exports.retrieveData = (req, res) => { //The get that will get all the precious data
    if (req.body === undefined) {
        return res.status(400).send({ message : "Empty request body." })
    }
    if (req.body.token === undefined) {
        return res.status(400).send({ message : "Missing parameters." })
    }
    jwt.verify(req.body.token, config.secret, (err, decoded) => { 
        if (err) { 
            return res.status(401).send({ 
                message: "Unauthorized." 
            }); 
        }

        var hashed = crypto.createHmac('sha256', config.secret).update(decoded.id + decoded.username, 'utf8').digest('hex')
        var tokendata = "cara istouille"
        var spendingdata = []

        Tokenized.findOne({
            where: { hash: hashed }
        }).then(record => {
            console.log(record.dataValues)
            tokendata = record.dataValues

            Spending.findAll({
                where: { hash: hashed }
            }).then(record => {
                console.log(record)
                if (record) {
                    record.forEach(element => {
                        spendingdata.push(element.dataValues)
                    });
                }

                res.status(200).send({ message: "Fetching completed, data sent in body", data: { UserKeyInfo: tokendata, Spending: spendingdata } })
            }).catch(err => {
                return res.status(500).send({ message: "Exception has occurred during Spending fetching : " + err.message })
            })

        }).catch(err => {
            return res.status(500).send({ message: "Exception has occurred during Tokenized fetching : " + err.message })
        })

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

