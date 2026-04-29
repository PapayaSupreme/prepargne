const dbConfig = require("../config/db.js")

const Sequelize = require("sequelize")
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    operatorsAliases: false,

    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
})

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

db.user = require("./userModel.js")(sequelize, Sequelize)
db.tokenized = require("./tokenizedModel.js")(sequelize, Sequelize)
db.spending = require("./spendingModel.js")(sequelize, Sequelize)
db.bankTransaction = require("./bankTransactionModel.js")(sequelize, Sequelize)

db.spending.belongsTo(db.tokenized, {
    foreignKey: "hash",
    targetKey: "hash",
    onDelete: "CASCADE"
});

db.tokenized.hasMany(db.spending, {
    foreignKey: "hash",
    sourceKey: "hash"
});

db.bankTransaction.belongsTo(db.tokenized, {
    foreignKey: "token",
    targetKey: "token",
    onDelete: "CASCADE"
});

db.tokenized.hasMany(db.bankTransaction, {
    foreignKey: "token",
    sourceKey: "token"
});

module.exports = db