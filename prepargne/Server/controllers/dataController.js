const db = require("../models")
const config = require("../config/auth.config.js")
const User = db.user
const Tokenized = db.tokenized
const Spending = db.spending
const Op = db.Sequelize.Op

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
    //res.status(200).send({ message: "WIP." })
}

exports.updateSpending = (req, res) => {
    res.status(200).send({ message: "WIP." })
}

exports.retrieveData = (req, res) => { //The get that will get all the precious data
    res.status(200).send({ message: "WIP." })
}