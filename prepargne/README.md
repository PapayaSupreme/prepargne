# Prepargne App

## CSV Upload API

- Endpoint: `POST /invest-info/upload-csv`
- Content type: `multipart/form-data`
- File field: `file`
- Token upload is ignored for CSV imports; the backend only reads the CSV file.

The CSV is parsed using `;` delimiter (same format as `sample_data.csv`) and imported with Sequelize into the `bankTransactions` table.

## Spending stats API

- Endpoint: `GET /invest-info/stats`
- Returns chart-ready totals for spending per category, spending per day, biggest spending, and top transactions.

## Quick checks

```bash
npm run test:csv-parser
npm run test:spending-stats
```
