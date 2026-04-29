const fs = require("fs")
const path = require("path")
const dataController = require("../controllers/dataController")

const csvPath = process.argv[2] || path.resolve(__dirname, "../../../sample_data.csv")

try {
    const csvBuffer = fs.readFileSync(csvPath)
    const rows = dataController.parseCsvBuffer(csvBuffer)

    console.log("Parsed rows:", rows.length)
    if (rows.length > 0) {
        console.log("First row columns:", Object.keys(rows[0]).join(", "))
    }
} catch (err) {
    console.error("CSV parser test failed:", err.message)
    process.exit(1)
}

