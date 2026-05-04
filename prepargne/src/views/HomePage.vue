<template>
  <div class="home-page">
    <div class="home-container">
      <div class="home-content">
        <div class="logo-section">
          <img src="/prepargne.png" alt="Prepargne Logo" class="home-logo" />
        </div>

        <div class="text-section">
          <h1 class="gradient-title">prepargne</h1>
          <p class="tagline">Welcome. Ready to earn money?</p>
        </div>

        <form class="home-upload-form" @submit.prevent="submitCsvUpload">
          <section class="questionnaire-card" aria-label="Financial profile questionnaire">
            <h2>Your profile</h2>
            <p>These answers help the AI tailor advice to your situation.</p>

            <label class="field-group">
              <span>Net monthly salary (EUR)</span>
              <input
                v-model.number="netMonthlySalary"
                type="number"
                min="0"
                step="50"
                class="number-input"
                placeholder="e.g. 2400"
              />
            </label>

            <label class="field-group">
              <span>Financial literacy: <strong>{{ financialLiteracy }}</strong>/5</span>
              <input v-model.number="financialLiteracy" type="range" min="1" max="5" step="1" class="range-input" />
              <small>{{ literacyLabel }}</small>
            </label>

            <label class="field-group">
              <span>Risk appetite: <strong>{{ riskAppetite }}</strong>/5</span>
              <input v-model.number="riskAppetite" type="range" min="1" max="5" step="1" class="range-input" />
              <small>{{ riskLabel }}</small>
            </label>

            <label class="field-group">
              <span>Savings discipline: <strong>{{ savingsDiscipline }}</strong>/5</span>
              <input v-model.number="savingsDiscipline" type="range" min="1" max="5" step="1" class="range-input" />
              <small>{{ disciplineLabel }}</small>
            </label>
          </section>

          <label class="upload-label">
            <span class="upload-text">Upload Your Spending File</span>
            <input
              ref="fileInput"
              type="file"
              accept=".csv,text/csv"
              @change="onFileChange"
              class="file-input"
            />
          </label>

          <button type="submit" :disabled="isUploading || !selectedFile" class="upload-button">
            {{ isUploading ? "Uploading..." : "Get Started" }}
          </button>

          <p v-if="successMessage" class="status success">{{ successMessage }}</p>
          <p v-if="errorMessage" class="status error">{{ errorMessage }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue"
import { useRouter } from "vue-router"

const QUESTIONNAIRE_STORAGE_KEY = "prepargne.questionnaire"

const router = useRouter()
const selectedFile = ref(null)
const fileInput = ref(null)
const isUploading = ref(false)
const successMessage = ref("")
const errorMessage = ref("")
const netMonthlySalary = ref(null)
const financialLiteracy = ref(3)
const riskAppetite = ref(3)
const savingsDiscipline = ref(3)

const literacyLabelByLevel = {
  1: "Beginner: still learning money basics",
  2: "Basic: understands simple budgeting",
  3: "Intermediate: can manage regular finances",
  4: "Advanced: comfortable with planning and investing",
  5: "Expert: confident with complex financial topics"
}

const riskLabelByLevel = {
  1: "Very conservative: money under the bed",
  2: "Cautious: prefers low volatility",
  3: "Balanced: moderate risk for moderate returns",
  4: "Growth-focused: accepts swings for higher upside",
  5: "Aggressive: open to exotic options"
}

const disciplineLabelByLevel = {
  1: "Often spends first, saves later",
  2: "Saves irregularly",
  3: "Saves monthly with occasional misses",
  4: "Consistent monthly saver",
  5: "Highly disciplined: automate and track savings"
}

const literacyLabel = computed(() => literacyLabelByLevel[financialLiteracy.value] || literacyLabelByLevel[3])
const riskLabel = computed(() => riskLabelByLevel[riskAppetite.value] || riskLabelByLevel[3])
const disciplineLabel = computed(() => disciplineLabelByLevel[savingsDiscipline.value] || disciplineLabelByLevel[3])

const saveQuestionnaire = () => {
  const questionnaire = {
    netMonthlySalary: Number(netMonthlySalary.value) > 0 ? Number(netMonthlySalary.value) : null,
    financialLiteracy: Number(financialLiteracy.value) || 3,
    riskAppetite: Number(riskAppetite.value) || 3,
    savingsDiscipline: Number(savingsDiscipline.value) || 3,
    labels: {
      financialLiteracy: literacyLabel.value,
      riskAppetite: riskLabel.value,
      savingsDiscipline: disciplineLabel.value
    },
    capturedAt: new Date().toISOString()
  }

  localStorage.setItem(QUESTIONNAIRE_STORAGE_KEY, JSON.stringify(questionnaire))
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
      errorMessage.value = payload.message || "CSV upload failed."
      return
    }

    saveQuestionnaire()

    const imported = payload.importedRows ?? 0
    const skipped = payload.skippedRows ?? 0
    successMessage.value = `Upload complete. Imported ${imported} row(s), skipped ${skipped}.`
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ""
    }

    // Navigate to dashboard after successful upload
    setTimeout(() => {
      router.push("/dashboard")
    }, 1000)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Unexpected upload error."
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg);
}

.home-container {
  width: 100%;
  max-width: 620px;
}

.home-content {
  display: grid;
  gap: 2rem;
  text-align: center;
}

.logo-section {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.home-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.text-section {
  display: grid;
  gap: 0.75rem;
}

.gradient-title {
  margin: 0;
  font-size: 3rem;
  font-weight: bold;
  background: linear-gradient(135deg, var(--primary-green), var(--primary-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  margin: 0;
  font-size: 1.2rem;
  color: var(--muted);
}

.home-upload-form {
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
}

.questionnaire-card {
  text-align: left;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem;
  display: grid;
  gap: 1rem;
}

.questionnaire-card h2 {
  margin: 0;
  font-size: 1.1rem;
}

.questionnaire-card p {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
}

.field-group {
  display: grid;
  gap: 0.45rem;
}

.field-group span {
  font-size: 0.92rem;
  color: var(--text);
}

.field-group small {
  color: var(--muted);
  font-size: 0.82rem;
}

.number-input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  font: inherit;
  color: var(--text);
  background: #fff;
}

.number-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.range-input {
  width: 100%;
  accent-color: var(--primary-green);
}

.upload-label {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  cursor: pointer;
}

.upload-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text);
}

.file-input {
  padding: 1rem;
  border: 2px dashed var(--primary-blue);
  border-radius: 12px;
  background: var(--primary-blue-light);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.file-input:hover {
  border-color: var(--primary-green);
  background: var(--primary-green-light);
}

.file-input:focus-visible {
  outline: none;
  border-color: var(--primary-green);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.upload-button {
  padding: 1rem;
  border: none;
  background: linear-gradient(135deg, var(--primary-green), var(--primary-blue));
  color: white;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.upload-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}

.upload-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.status {
  margin: 0;
  padding: 0.8rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.status.success {
  background: #edf9f0;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

@media (max-width: 600px) {
  .home-page {
    padding: 1rem;
  }

  .gradient-title {
    font-size: 2rem;
  }

  .tagline {
    font-size: 1rem;
  }

  .home-logo {
    width: 80px;
    height: 80px;
  }
}
</style>

