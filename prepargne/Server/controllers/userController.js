const db = require("../models")
const config = require("../config/auth.config.js")
const User = db.user
const Tokenized = db.tokenized
const Spending = db.spending
const Op = db.Sequelize.Op

var jwt = require("jsonwebtoken")
var bcrypt = require("bcryptjs")


exports.create = (req, res) => {
    if (req.body === undefined) {
        return res.status(400).send({ message : "Empty request body." })
    }
    if (req.body.username === undefined | req.body.email === undefined | req.body.password === undefined) {
        return res.status(400).send({ message : "Missing parameters." })
    }
    User.create({
        username: req.body.username,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
    }).then(user => {
        if (req.body.roles) {
            Role.findAll({
                where: {
                    name: {
                        [Op.or]: req.body.roles
                    }
                } //Legacy code, don't worry
            }).then(roles => {
                res.status(200).send({ message: "User registered successfully." })
            })
        } else {
                res.status(200).send({ message: "User registered successfully." })
        }
    }).catch(err => {
        res.status(500).send({ message: err.message })
    })
}

exports.logIn = (req, res) => {
    if (req.body === undefined) {
        return res.status(400).send({ message : "Empty request body." })
    }
    if ((req.body.username === undefined & req.body.email === undefined) | req.body.password === undefined) { //We'll try to find the user using either username or email
        return res.status(400).send({ message : "Missing parameters." })
    }
    if (req.body.username !== undefined) {
        User.findOne({ where: { username: req.body.username } }).then(user => {
            if (!user) {
                return res.status(404).send({ message : "User not found." })
            }
            var passwordValidity = bcrypt.compareSync(req.body.password, user.password)
            if (!passwordValidity) {
                return res.status(401).send({
                    accessToken: null,
                    message: "Invalid Password."
                })
            }

            var token = jwt.sign({ id: user.id, username: user.username }, config.secret, {
                expiresIn: 86400
            })
            res.status(200).send({
                id: user.id,
                username: user.username,
                email: user.email,
                accessToken: token
            })
    
        }).catch(err => {
            res.status(500).send({ message: err.message })
        })
    } else if (req.body.email !== undefined) {
        User.findOne({ where: { email: req.body.email } }).then(user => {
            if (!user) {
                return res.status(404).send({ message : "User not found." })
            }
            var passwordValidity = bcrypt.compareSync(req.body.password, user.password)
            if (!passwordValidity) {
                return res.status(401).send({
                    accessToken: null,
                    message: "Invalid Password."
                })
            }

            var token = jwt.sign({ id: user.id, username: user.username }, config.secret, {
                expiresIn: 86400
            })
            res.status(200).send({
                id: user.id,
                username: user.username,
                email: user.email,
                accessToken: token
            })
    
        }).catch(err => {
            res.status(500).send({ message: err.message })
        })
    } else {
        res.status(503).send({ message : "Unknown state reached." })
    }
}

exports.delete = (req, res) => { //Frontend wise, SHOULD NOT BE REQUESTED WITHOUT CONFIRMATION ALERT
    if (req.body === undefined) { //Goal is for user to auto delete account if needed, which means cleaning up everything
        return res.status(400).send({ message : "Empty request body." })
    }
    if (req.body.token === undefined) {
        return res.status(401).send({ message : "No valid credentials found." })
    }
    jwt.verify(req.body.token, config.secret, (err, decoded) => { 
        if (err) { 
          return res.status(401).send({ 
            message: "Unauthorized." 
          }); 
        } 
        User.findOne({ attributes: ['id'], where: { id: decoded.id }}).then( user => {
            if (!user) {
                return res.status(404).send({ message : "User not found." })
            }
            Tokenized.destroy({ where: { token: req.body.token }}).then(() => { //A tester une fois les controllers de tokenized et de spending fait
                console.log("Tokenized data deletion done for user " + decoded.username + ".")
            }).catch((err) => {
                return res.status(500).send({ message: "Tokenized deletion failed : " + err.message })
            })
            Spending.destroy({ where: { token: req.body.token }}).then(() => { //A tester une fois les controllers de tokenized et de spending fait
                console.log("Spending data deletion done for user " + decoded.username + ".")
            }).catch((err) => {
                return res.status(500).send({ message: "Spending deletion failed : " + err.message })
            })
            User.destroy({ where: { id: user.id }}).then(() => {
                return res.status(200).send({ message : "User deleted and its data." })
            }).catch((err) => {
                return res.status(500).send({ message: "Deletion failed : " + err.message })
            })
        }).catch(err => {
            return res.status(500).send({ message: "Exception has occurred during user fetching : " + err.message })
        })
    })
}


