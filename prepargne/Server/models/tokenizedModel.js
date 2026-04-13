module.exports = (sequelize, Sequelize) => {
    const Tokenized = sequelize.define("tokenized", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        token: { //Generate after account creation using revenue + password hash through hashing algorithm ?
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