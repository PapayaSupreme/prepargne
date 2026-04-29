<template>
  <article class="card card-span-2 chatbot-card">
    <div class="chatbot-header">
      <div>
        <h2>Financial coach</h2>
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
        <span class="chatbot-bubble-label">{{ message.role === 'user' ? 'You' : 'Coach' }}</span>
        <p>{{ message.content }}</p>
      </div>
    </div>

    <form class="chatbot-form" @submit.prevent="sendMessage">
      <textarea
        v-model="question"
        rows="3"
        class="chatbot-input"
        placeholder="Ask a question about your spending or financial literacy..."
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

const question = ref("")
const sending = ref(false)
const errorMessage = ref("")
const statusMessage = ref("Ask me how to budget, save, or interpret the spending summary.")
const chatFeed = ref(null)
const messages = ref([
  {
    role: "assistant",
    content: "I can explain financial concepts and answer questions using the uploaded CSV data once it is available."
  }
])

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
      body: JSON.stringify({ question: prompt })
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
  gap: 1rem;
}

.chatbot-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.chatbot-header p {
  margin-top: 0.35rem;
}

.chatbot-pill {
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  background: #e0f2fe;
  color: #0369a1;
  white-space: nowrap;
}

.chatbot-feed {
  max-height: 320px;
  overflow-y: auto;
  display: grid;
  gap: 0.75rem;
  padding-right: 0.25rem;
}

.chatbot-bubble {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.75rem;
  background: #f9fafb;
}

.chatbot-bubble[data-role="user"] {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.chatbot-bubble[data-role="assistant"] {
  background: #f8fafc;
}

.chatbot-bubble-label {
  display: block;
  font-size: 0.78rem;
  color: var(--muted);
  margin-bottom: 0.35rem;
}

.chatbot-bubble p {
  margin: 0;
  white-space: pre-wrap;
}

.chatbot-form {
  display: grid;
  gap: 0.75rem;
}

.chatbot-input {
  width: 100%;
  resize: vertical;
  min-height: 90px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.75rem;
  font: inherit;
  color: var(--text);
  background: #fff;
}

.chatbot-actions {
  display: flex;
  justify-content: flex-end;
}

.chatbot-actions button {
  border: 1px solid var(--text);
  background: var(--text);
  color: #fff;
  border-radius: 8px;
  padding: 0.55rem 0.85rem;
  cursor: pointer;
}

.chatbot-actions button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.chatbot-status {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}
</style>


