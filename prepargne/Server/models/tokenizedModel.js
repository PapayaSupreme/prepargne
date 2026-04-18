module.exports = (sequelize, Sequelize) => {
    const Tokenized = sequelize.define("tokenized", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        hash: { //hash generated with jwt data
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        revenue: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        investorScore: {
            type: Sequelize.FLOAT //Score after filling investor profile questionnaire
        }
    })

    return Tokenized
}