<template>
  <main class="page">
    <header class="topbar">
      <h1>Prepargne</h1>
      <p>Track your savings and spending in one place.</p>
    </header>

    <section class="grid">
      <article class="card card-span-2">
        <h2>CSV Upload</h2>
        <p>Import bank transactions from your semicolon-separated CSV.</p>

        <form class="upload-form" @submit.prevent="submitCsvUpload">
          <label class="field">
            <span>CSV file</span>
            <input
              ref="fileInput"
              type="file"
              accept=".csv,text/csv"
              @change="onFileChange"
            >
          </label>

          <button type="submit" :disabled="isUploading || !selectedFile">
            {{ isUploading ? "Uploading..." : "Upload CSV" }}
          </button>
        </form>

        <p v-if="successMessage" class="status success">{{ successMessage }}</p>
        <p v-if="errorMessage" class="status error">{{ errorMessage }}</p>
      </article>

      <article class="card">
        <h2>Overview</h2>
        <div v-if="stats" class="stats-grid">
          <div class="stat">
            <span>Total spending</span>
            <strong>{{ formatCurrency(stats.summary.totalSpending) }}</strong>
          </div>
          <div class="stat">
            <span>Spending / day</span>
            <strong>{{ formatCurrency(stats.summary.averageDailySpending) }}</strong>
          </div>
          <div class="stat">
            <span>Spending transactions</span>
            <strong>{{ stats.summary.spendingTransactionCount }}</strong>
          </div>
          <div class="stat">
            <span>Total transactions</span>
            <strong>{{ stats.summary.totalTransactions }}</strong>
          </div>
        </div>
        <p v-else class="empty-state">Upload a CSV to load spending analytics.</p>
      </article>

      <article class="card card-span-2">
        <h2>Spending per category</h2>
        <p v-if="statsError" class="status error">{{ statsError }}</p>
        <div v-if="stats && stats.spendingByCategory.length > 0" class="pie-layout">
          <div
            class="pie-chart"
            :style="getPieChartStyle(stats.spendingByCategory)"
            role="img"
            :aria-label="getPieAriaLabel(stats.spendingByCategory)"
          ></div>
          <ul class="pie-legend">
            <li v-for="(item, index) in stats.spendingByCategory" :key="item.category" class="pie-legend-item">
              <span class="pie-dot" :style="{ backgroundColor: getCategoryColor(index) }" aria-hidden="true"></span>
              <span class="pie-label">{{ item.category }}</span>
              <strong>{{ formatCurrency(item.total) }}</strong>
            </li>
          </ul>
        </div>
        <p v-else class="empty-state">No spending categories available yet.</p>
      </article>

      <article class="card">
        <h2>Spending per day</h2>
        <ul v-if="stats && stats.spendingByDay.length > 0" class="list">
          <li v-for="item in stats.spendingByDay" :key="item.date" class="list-item">
            <span>{{ item.date }}</span>
            <strong>{{ formatCurrency(item.total) }}</strong>
          </li>
        </ul>
        <p v-else class="empty-state">Daily totals will appear after import.</p>
      </article>

      <article class="card">
        <h2>Biggest spending</h2>
        <div v-if="stats?.summary?.biggestSpending" class="biggest-spending">
          <strong>{{ formatCurrency(stats.summary.biggestSpending.amount) }}</strong>
          <p>{{ stats.summary.biggestSpending.label }}</p>
          <span>{{ stats.summary.biggestSpending.category }} · {{ stats.summary.biggestSpending.dateOp }}</span>
        </div>
        <p v-else class="empty-state">The largest expense will show here.</p>
      </article>

      <article class="card card-span-2">
        <h2>Top spending transactions</h2>
        <ul v-if="stats && stats.topSpending.length > 0" class="list">
          <li v-for="item in stats.topSpending" :key="`${item.id}-${item.dateOp}`" class="list-item list-item-stack">
            <div>
              <strong>{{ item.label }}</strong>
              <p>{{ item.category }} · {{ item.dateOp }}</p>
            </div>
            <strong>{{ formatCurrency(item.amount) }}</strong>
          </li>
        </ul>
        <p v-else class="empty-state">The largest expenses will be listed here after upload.</p>
      </article>
    </section>

  </main>
</template>

<script setup>
import { onMounted, ref } from "vue"

const selectedFile = ref(null)
const fileInput = ref(null)
const isUploading = ref(false)
const successMessage = ref("")
const errorMessage = ref("")
const stats = ref(null)
const statsError = ref("")

const PIE_COLORS = ["#2563eb", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]

const formatCurrency = (value) => {
  const amount = Number(value) || 0
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(amount)
}

const getCategoryColor = (index) => PIE_COLORS[index % PIE_COLORS.length]

const getPieChartStyle = (categories) => {
  if (!categories || categories.length === 0) {
    return { background: "#e5e7eb" }
  }

  const total = categories.reduce((sum, item) => sum + Math.max(Number(item.total) || 0, 0), 0)
  if (total <= 0) {
    return { background: "#e5e7eb" }
  }

  let current = 0
  const segments = categories.map((item, index) => {
    const amount = Math.max(Number(item.total) || 0, 0)
    const slice = (amount / total) * 100
    const start = current
    current += slice
    return `${getCategoryColor(index)} ${start.toFixed(2)}% ${current.toFixed(2)}%`
  })

  return { background: `conic-gradient(${segments.join(", ")})` }
}

const getPieAriaLabel = (categories) => {
  const details = categories
    .slice(0, 5)
    .map((item) => `${item.category}: ${formatCurrency(item.total)}`)
    .join(", ")

  return details ? `Spending by category pie chart. ${details}.` : "Spending by category pie chart."
}

const loadStats = async () => {
  statsError.value = ""

  try {
    const response = await fetch("/invest-info/stats")
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(payload.message || "Failed to load spending statistics.")
    }

    stats.value = payload
    return payload
  } catch (error) {
    stats.value = null
    statsError.value = error instanceof Error ? error.message : "Unexpected stats error."
    return null
  }
}

const onFileChange = (event) => {
  const fileList = event.target.files
  selectedFile.value = fileList && fileList.length > 0 ? fileList[0] : null
  successMessage.value = ""
  errorMessage.value = ""
}

const submitCsvUpload = async () => {
  if (!selectedFile.value || isUploading.value) {
    return
  }

  isUploading.value = true
  successMessage.value = ""
  errorMessage.value = ""

  const formData = new FormData()
  formData.append("file", selectedFile.value)


  try {
    const response = await fetch("/invest-info/upload-csv", {
      method: "POST",
      body: formData
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload.message || "CSV upload failed.")
    }

    const imported = payload.importedRows ?? 0
    const skipped = payload.skippedRows ?? 0
    successMessage.value = `Upload complete. Imported ${imported} row(s), skipped ${skipped}.`
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ""
    }

    await loadStats()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Unexpected upload error."
  } finally {
    isUploading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

