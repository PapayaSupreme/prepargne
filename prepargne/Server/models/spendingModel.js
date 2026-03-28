module.exports = (sequelize, Sequelize) => {
    const Spending = sequelize.define("spending", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        amount_spent: {
            type: Sequelize.INTEGER
        },
        category: {
            type: Sequelize.STRING
        },
    })

    return Spending
}