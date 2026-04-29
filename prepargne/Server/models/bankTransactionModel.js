module.exports = (sequelize, Sequelize) => {
    const BankTransaction = sequelize.define("bankTransaction", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        dateOp: {
            type: Sequelize.DATEONLY,
            allowNull: false
        },
        dateVal: {
            type: Sequelize.DATEONLY
        },
        label: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        category: {
            type: Sequelize.STRING
        },
        categoryParent: {
            type: Sequelize.STRING
        },
        supplierFound: {
            type: Sequelize.STRING
        },
        amount: {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: false
        },
        comment: {
            type: Sequelize.TEXT
        },
        accountNum: {
            type: Sequelize.STRING
        },
        accountLabel: {
            type: Sequelize.STRING
        },
        accountBalance: {
            type: Sequelize.DECIMAL(12, 2)
        },
        hash: {
            type: Sequelize.STRING,
            allowNull: true
        }
    })

    return BankTransaction
}

