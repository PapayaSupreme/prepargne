<template>
  <article class="card chatbot-card">
    <div class="chatbot-header">
      <div>
        <h2>Prepargne AI</h2>
        <p>Ask about budgeting, saving, debt, or your uploaded transactions.</p>
      </div>
      <span class="chatbot-pill">Data-aware</span>
    </div>

    <div ref="chatFeed" class="chatbot-feed" aria-live="polite">
      <div
        v-for="(message, index) in messages"
        :key="`${message.role}-${index}`"
        :class="'chatbot-bubble'"
        :data-role="message.role"
      >
        <span class="chatbot-bubble-label">{{ message.role === 'user' ? 'You' : 'AI' }}</span>
        <div class="chatbot-bubble-content" v-html="renderMarkdown(message.content)"></div>
      </div>
    </div>

    <form class="chatbot-form" @submit.prevent="sendMessage">
      <textarea
        v-model="question"
        rows="3"
        class="chatbot-input"
        placeholder="Ask me something about..."
      ></textarea>
      <div class="chatbot-actions">
        <button type="submit" :disabled="sending || !question.trim()">
          {{ sending ? 'Thinking...' : 'Send question' }}
        </button>
      </div>
    </form>

    <p v-if="statusMessage" class="chatbot-status">{{ statusMessage }}</p>
    <p v-if="errorMessage" class="status error">{{ errorMessage }}</p>
  </article>
</template>

<script setup>
import { nextTick, ref } from "vue"
import { marked } from "marked"
import DOMPurify from "dompurify"

const QUESTIONNAIRE_STORAGE_KEY = "prepargne.questionnaire"

const question = ref("")
const sending = ref(false)
const errorMessage = ref("")
const statusMessage = ref("Ask me how to budget, save, or interpret the spending summary.")
const chatFeed = ref(null)
const messages = ref([
  {
    role: "assistant",
    content: "I can explain financial concepts and answer questions."
  }
])

const renderMarkdown = (content) => {
  try {
    const html = marked(content, {
      breaks: true,
      gfm: true
    })
    return DOMPurify.sanitize(html)
  } catch (error) {
    console.error("Markdown rendering error:", error)
    return DOMPurify.sanitize(content)
  }
}

const updateAssistantMessage = async (index, content) => {
  if (messages.value[index]) {
    messages.value[index].content = content
  }

  await scrollToBottom()
}

const readStreamedResponse = async (response, assistantIndex) => {
  if (!response.body) {
    const text = await response.text()
    await updateAssistantMessage(assistantIndex, text || "I could not generate a reply.")
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let accumulated = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      break
    }

    accumulated += decoder.decode(value, { stream: true })
    await updateAssistantMessage(assistantIndex, accumulated)
  }

  accumulated += decoder.decode()
  await updateAssistantMessage(assistantIndex, accumulated || "I could not generate a reply.")
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatFeed.value) {
    chatFeed.value.scrollTop = chatFeed.value.scrollHeight
  }
}

const getQuestionnaireContext = () => {
  try {
    const raw = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

const sendMessage = async () => {
  const prompt = question.value.trim()
  if (!prompt || sending.value) {
    return
  }

  sending.value = true
  errorMessage.value = ""
  statusMessage.value = ""
  messages.value.push({ role: "user", content: prompt })
  messages.value.push({ role: "assistant", content: "" })
  const assistantIndex = messages.value.length - 1
  question.value = ""
  await scrollToBottom()

  try {
    const response = await fetch("/invest-info/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: prompt,
        questionnaire: getQuestionnaireContext()
      })
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      errorMessage.value = payload.message || "Chat request failed."
      await updateAssistantMessage(assistantIndex, `Sorry, I could not answer that right now. ${errorMessage.value}`)
      return
    }

    await readStreamedResponse(response, assistantIndex)
    statusMessage.value = "Response received."
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected chat error."
    errorMessage.value = message
    await updateAssistantMessage(assistantIndex, `Sorry, I could not answer that right now. ${message}`)
  } finally {
    sending.value = false
    await scrollToBottom()
  }
}
</script>

<style scoped>
.chatbot-card {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  gap: 1rem;
  height: 100%;
  overflow: hidden;
}

.chatbot-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  flex-shrink: 0;
}

.chatbot-header p {
  margin-top: 0.35rem;
}

.chatbot-pill {
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  background: var(--primary-blue-light);
  color: var(--primary-blue);
  white-space: nowrap;
}

.chatbot-feed {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: grid;
  gap: 0.75rem;
  padding: 0.75rem 0.25rem 0 0;
}

/* Scrollbar styling */
.chatbot-feed::-webkit-scrollbar {
  width: 6px;
}

.chatbot-feed::-webkit-scrollbar-track {
  background: transparent;
}

.chatbot-feed::-webkit-scrollbar-thumb {
  background: var(--primary-blue);
  border-radius: 3px;
}

.chatbot-feed::-webkit-scrollbar-thumb:hover {
  background: var(--primary-green);
}

.chatbot-bubble {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.75rem;
  background: #f9fafb;
  transition: all 0.2s ease;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.chatbot-bubble[data-role="user"] {
  background: var(--primary-blue-light);
  border-color: var(--primary-blue);
}

.chatbot-bubble[data-role="assistant"] {
  background: var(--primary-green-light);
  border-color: var(--primary-green);
}

.chatbot-bubble-label {
  display: block;
  font-size: 0.78rem;
  color: var(--muted);
  margin-bottom: 0.35rem;
  font-weight: 600;
}

.chatbot-bubble-content {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Markdown styling */
.chatbot-bubble-content p {
  margin: 0.5rem 0;
}

.chatbot-bubble-content p:first-child {
  margin-top: 0;
}

.chatbot-bubble-content p:last-child {
  margin-bottom: 0;
}

.chatbot-bubble-content h1,
.chatbot-bubble-content h2,
.chatbot-bubble-content h3,
.chatbot-bubble-content h4,
.chatbot-bubble-content h5,
.chatbot-bubble-content h6 {
  margin: 0.75rem 0 0.5rem;
  font-weight: 600;
  line-height: 1.3;
}

.chatbot-bubble-content h1 {
  font-size: 1.3rem;
}

.chatbot-bubble-content h2 {
  font-size: 1.15rem;
}

.chatbot-bubble-content h3 {
  font-size: 1.05rem;
}

.chatbot-bubble-content h4,
.chatbot-bubble-content h5,
.chatbot-bubble-content h6 {
  font-size: 0.95rem;
}

.chatbot-bubble-content strong,
.chatbot-bubble-content b {
  font-weight: 700;
}

.chatbot-bubble-content em,
.chatbot-bubble-content i {
  font-style: italic;
}

.chatbot-bubble-content code {
  background: rgba(0, 0, 0, 0.08);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.chatbot-bubble-content pre {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.75rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.chatbot-bubble-content pre code {
  background: none;
  padding: 0;
  font-size: 0.85rem;
  line-height: 1.4;
}

.chatbot-bubble-content ul,
.chatbot-bubble-content ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.chatbot-bubble-content li {
  margin: 0.25rem 0;
}

.chatbot-bubble-content blockquote {
  margin: 0.5rem 0;
  padding-left: 0.75rem;
  border-left: 3px solid var(--border);
  color: var(--muted);
}

.chatbot-bubble-content a {
  color: var(--primary-blue);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

.chatbot-bubble-content a:hover {
  border-bottom-color: var(--primary-blue);
}

.chatbot-bubble-content hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 0.75rem 0;
}

.chatbot-form {
  display: grid;
  gap: 0.75rem;
  flex-shrink: 0;
}

.chatbot-input {
  width: 100%;
  resize: none;
  max-height: 120px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.75rem;
  font: inherit;
  color: var(--text);
  background: #fff;
  transition: all 0.2s ease;
}

.chatbot-input:focus {
  outline: none;
  border-color: var(--primary-green);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.chatbot-actions {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.chatbot-actions button {
  border: 1px solid var(--primary-green);
  background: var(--primary-green);
  color: #fff;
  border-radius: 8px;
  padding: 0.55rem 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chatbot-actions button:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.chatbot-actions button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.chatbot-status {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
  flex-shrink: 0;
}

.status.error {
  color: #991b1b;
}
</style>

