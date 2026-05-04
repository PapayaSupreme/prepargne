<template>
  <div class="floating-chat-container">
    <button
      class="floating-chat-button"
      @click="toggleChat"
      :aria-label="isOpen ? 'Close chat' : 'Open chat'"
      :class="{ active: isOpen }"
    >
      <svg v-if="!isOpen" class="chat-icon" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
      <svg v-else class="close-icon" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    </button>

    <Transition name="chat-slide">
      <div v-if="isOpen" class="floating-chat-panel">
        <ChatbotPanel :key="chatbotKey" />
      </div>
    </Transition>

    <div v-if="isOpen" class="chat-overlay" @click="toggleChat"></div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import ChatbotPanel from "./ChatbotPanel.vue"

const isOpen = ref(false)
const chatbotKey = ref(0)

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    chatbotKey.value += 1
  }
}
</script>

<style scoped>
.floating-chat-container {
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 1000;
  pointer-events: none;
}

.floating-chat-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-green), var(--primary-blue));
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
  transition: all 0.3s ease;
  pointer-events: all;
  z-index: 1001;
}

.floating-chat-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}

.floating-chat-button.active {
  background: linear-gradient(135deg, var(--primary-blue), var(--primary-green));
}

.floating-chat-button:active {
  transform: scale(0.95);
}

.chat-icon,
.close-icon {
  width: 28px;
  height: 28px;
}

.floating-chat-panel {
  position: fixed;
  bottom: 6rem;
  right: 2rem;
  width: 420px;
  max-height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  pointer-events: all;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  pointer-events: all;
}

.v-chat-slide-enter-active,
.v-chat-slide-leave-active {
  transition: all 0.3s ease;
}

.v-chat-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) translateX(20px) scale(0.9);
}

.v-chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) translateX(20px) scale(0.9);
}

@media (max-width: 768px) {
  .floating-chat-button {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 54px;
    height: 54px;
  }

  .floating-chat-panel {
    bottom: 5.5rem;
    right: 1.5rem;
    width: 100%;
    max-width: calc(100% - 3rem);
    max-height: 70vh;
  }

  .chat-icon,
  .close-icon {
    width: 24px;
    height: 24px;
  }
}

@media (max-width: 480px) {
  .floating-chat-button {
    bottom: 1rem;
    right: 1rem;
    width: 50px;
    height: 50px;
  }

  .floating-chat-panel {
    bottom: 5rem;
    right: 1rem;
    width: calc(100% - 2rem);
    border-radius: 12px;
  }
}
</style>


