const db = require("../models")
//const config = require("../config/auth.config.js")
const User = db.user
const Tokenized = db.tokenized
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
        if (user.isBanned) { //case of admin side blocking
            return res.status(403).send({
                accessToken: null,
                message: "You have been forbidden from using this service."
            })
        }

        var authorities = []
        user.getRoles().then(roles => {
            for (let i = 0; i < roles.length; i++) {
                authorities.push("ROLE_" + roles[i].name.toUpperCase())
            }
            var isAdmin = (authorities.includes("ROLE_ADMIN")) ? true : false
            var isProvider = (authorities.includes("ROLE_PROVIDER")) ? true : false
            var token = jwt.sign({ id: user.id, username: user.username, isAdmin: isAdmin, isProvider: isProvider }, config.secret, {
                expiresIn: 86400
            })
            res.status(200).send({
                id: user.id,
                username: user.username,
                email: user.email,
                roles: authorities,
                accessToken: token
            })
        })
    }).catch(err => {
        res.status(500).send({ message: err.message })
    })
}

exports.delete = (req, res) => { //Frontend wise, SHOULD NOT BE REQUESTED WITHOUT CONFIRMATION ALERT
    if (req.body === undefined) {
        return res.status(400).send({ message : "Empty request body." })
    }
    if (req.body.token === undefined) {
        return res.status(401).send({ message : "No valid credentials found." })
    }
    if (req.body.user === undefined) {
        return res.status(400).send({ message : "Missing user parameter." })
    }
    jwt.verify(req.body.token, config.secret, (err, decoded) => { 
        if (err) { 
          return res.status(401).send({ 
            message: "Unauthorized." 
          }); 
        } 
        if (decoded.isAdmin === undefined | decoded.isAdmin == 0) {
            return res.status(403).send({ message : "You are not allowed to perform access modification." })
        }
        User.findOne({ attributes: ['id'], where: { id: req.body.user }}).then( user => {
            if (!user) {
                return res.status(404).send({ message : "User not found." })
            }
            user.setRoles([]).then(() => {
                    User.destroy({ where: { id: user.id }}).then(() => {
                        return res.status(200).send({ message : "User deleted." })
                    }).catch((err) => {
                        return res.status(500).send({ message: "Deletion failed : " + err.message })
                    })
                }).catch(err => {
                    return res.status(500).send({ message: "Exception has occurred during role removal : " + err.message })
                })
        }).catch(err => {
            return res.status(500).send({ message: "Exception has occurred during user fetching : " + err.message })
        })
    })
}
