const db = require("../models")
const config = require("../config/auth.config.js")
const User = db.user
const Tokenized = db.tokenized
const Spending = db.spending
const Op = db.Sequelize.Op

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
    res.status(200).send({ message: "WIP." })
}