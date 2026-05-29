<template>
  <div class="chat-panel">
    <div class="chat-messages" ref="messagesRef">
      <div
        v-for="(msg, i) in game.messages"
        :key="i"
        class="message"
        :class="msg.type"
      >
        <template v-if="msg.type === 'image'">
          <span class="msg-name">{{ msg.name }}: </span>
          <img :src="msg.imageData" class="chat-image" @click="previewImage(msg.imageData)" />
        </template>
        <template v-else-if="msg.type === 'sticker'">
          <span class="msg-name">{{ msg.name }}: </span>
          <span class="sticker-display">{{ msg.sticker }}</span>
        </template>
        <template v-else>
          <span v-if="msg.type === 'guess'" class="msg-name">{{ msg.name }}: </span>
          <span class="msg-text">{{ msg.text }}</span>
        </template>
      </div>
    </div>
    <div class="chat-input-row" v-if="canGuess">
      <div class="chat-actions">
        <button class="items-btn" @click="toggleItems" title="道具">
          <span class="btn-icon">&#x1F392;</span>
          <span class="btn-label">道具</span>
        </button>
          <button class="image-btn" @click="triggerImageUpload" title="图片">
            <span class="btn-icon">&#x1F4F8;</span>
            <span class="btn-label">图片</span>
          </button>
          <button class="sticker-btn" @click="blurInput(); showSticker = !showSticker" title="表情包" ref="stickerBtnRef">
            <span class="btn-icon">&#x1F3AD;</span>
            <span class="btn-label">表情包</span>
          </button>
          <input type="file" accept="image/*" ref="imageInputRef" @change="onImageSelected" style="display:none" />
          <button class="emoji-btn" @click="blurInput(); showEmoji = !showEmoji" title="表情" ref="emojiBtnRef">
          <span class="btn-icon">&#x1F600;</span>
          <span class="btn-label">表情</span>
        </button>
      </div>
      <div class="chat-input-bar">
        <input
          v-model="guess"
          :placeholder="game.phase === 'selecting_word' ? '输入消息...' : game.myTurn ? '输入消息...' : '输入你的猜测...'"
          @keyup.enter="submitGuess"
          :disabled="!canGuess"
          class="guess-input"
          ref="inputRef"
        />
        <button class="send-btn" @click="submitGuess" :disabled="!guess.trim()">
          {{ game.myTurn ? '发送' : '猜' }}
        </button>
      </div>
      <Transition name="emoji">
        <div v-if="showEmoji" class="emoji-picker">
          <button
            v-for="e in emojis"
            :key="e"
            class="emoji-item"
            @click="insertEmoji(e)"
          >{{ e }}</button>
        </div>
      </Transition>
      <Transition name="emoji">
        <div v-if="showSticker" class="sticker-picker">
          <button
            v-for="s in stickers"
            :key="s"
            class="sticker-item"
            @click="sendSticker(s)"
          >{{ s }}</button>
        </div>
      </Transition>
    </div>
    <div v-if="previewImg" class="image-preview-overlay" @click.self="previewImg = ''">
      <img :src="previewImg" class="image-preview-full" @click.self="previewImg = ''" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'

import { useGameStore } from '../stores/game.js'

const game = useGameStore()
const guess = ref('')
const messagesRef = ref(null)
const inputRef = ref(null)
const showEmoji = ref(false)
const showSticker = ref(false)
const emojiBtnRef = ref(null)
const stickerBtnRef = ref(null)
const imageInputRef = ref(null)
const previewImg = ref('')

function blurInput() {
  inputRef.value?.blur()
}

function toggleItems() {
  blurInput()
  game.showItems = !game.showItems
  if (!game.showItems) {
    game.activeDragItem = ''
  }
}

const emojis = ['😀','😂','😍','🥰','😎','🤔','😢','😤','😱','🤗','😴','🤡','👍','👎','👌','✌️','🤞','💪','🙏','🎉','🎨','🔥','⭐','💯','❤️','💔','💀','👻','🙈','🐶','🐱','🎮','🍕','🍺','☕','🌙','✨','🎵','💩']

const stickers = ['😂','🔥','💀','🎉','❤️','😍','👍','💩','🙏','🎨','👻','✨','⭐','💯','😱','🤡','💪','🐶','🍕','🎵','🥰','😎','🤔','💔']

function triggerImageUpload() {
  blurInput()
  imageInputRef.value?.click()
}

function onImageSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const img = new Image()
  img.onload = () => {
    let w = img.naturalWidth
    let h = img.naturalHeight
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const compress = (maxDim, quality) => {
      let tw = w, th = h
      if (tw > maxDim || th > maxDim) {
        if (tw > th) { th = th * maxDim / tw; tw = maxDim }
        else { tw = tw * maxDim / th; th = maxDim }
      }
      canvas.width = Math.round(tw)
      canvas.height = Math.round(th)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/jpeg', quality)
    }
    let dataUrl = compress(400, 0.7)
    while (dataUrl.length > 200 * 1024) {
      const ratio = 200 * 1024 / dataUrl.length
      let q = Math.max(0.1, parseFloat((0.7 * ratio).toFixed(2)))
      let dim = Math.min(400, Math.round(400 * Math.sqrt(ratio)))
      dim = Math.max(100, dim)
      dataUrl = compress(dim, q)
      if (q <= 0.1 && dim <= 100) break
    }
    game.sendImage(dataUrl, file.name)
    e.target.value = ''
  }
  img.src = URL.createObjectURL(file)
}

function sendSticker(sticker) {
  game.sendSticker(sticker)
  showSticker.value = false
}

function previewImage(src) {
  previewImg.value = src
}

function insertEmoji(e) {
  guess.value += e
}

function onClickOutside(e) {
  if (showEmoji.value && !e.target.closest('.emoji-btn') && !e.target.closest('.emoji-picker')) {
    showEmoji.value = false
  }
  if (showSticker.value && !e.target.closest('.sticker-btn') && !e.target.closest('.sticker-picker')) {
    showSticker.value = false
  }
  if (game.showItems && !e.target.closest('.items-btn') && !e.target.closest('.items-panel')) {
    game.showItems = false
    game.activeDragItem = ''
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

const canGuess = computed(() => {
  if (game.phase === 'selecting_word') return true
  return game.phase === 'drawing'
})

function submitGuess() {
  if (!guess.value.trim() || !canGuess.value) return
  const text = guess.value.trim()
  game.sendChat(text)
  guess.value = ''
}

watch(() => game.messages.length, async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
})
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.message {
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-all;
}

.message.system {
  color: #f5a623;
  text-align: center;
  font-size: 12px;
  background: rgba(245, 166, 35, 0.08);
}

.message.guess {
  color: #ccc;
}

.msg-name {
  color: #4ecdc4;
  font-weight: 600;
}

.chat-input-row {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.chat-input-bar {
  display: flex;
  gap: 8px;
}

.guess-input {
  flex: 1;
  padding: 9px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 14px;
  line-height: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
}

.guess-input:focus {
  border-color: #4ecdc4;
}

.guess-input:disabled {
  opacity: 0.4;
}

.send-btn {
  padding: 9px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4ecdc4, #44b3ab);
  color: white;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  transition: all 0.2s;
  border: none;
  box-sizing: border-box;
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.emoji-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 12px 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.emoji-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.image-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 12px 6px;
  border-radius: 10px;
  background: rgba(78, 205, 196, 0.1);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
  border: 1px solid rgba(78, 205, 196, 0.2);
}

.image-btn:hover {
  background: rgba(78, 205, 196, 0.2);
}

.sticker-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 12px 6px;
  border-radius: 10px;
  background: rgba(245, 166, 35, 0.1);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
  border: 1px solid rgba(245, 166, 35, 0.2);
}

.sticker-btn:hover {
  background: rgba(245, 166, 35, 0.2);
}

.items-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 12px 6px;
  border-radius: 10px;
  background: rgba(245, 166, 35, 0.1);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
  border: 1px solid rgba(245, 166, 35, 0.2);
}

.items-btn:hover {
  background: rgba(245, 166, 35, 0.2);
}

.btn-icon { font-size: 18px; line-height: 1; }
.btn-label { font-size: 11px; line-height: 1; color: #fff; }

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
  z-index: 50;
  margin-bottom: 8px;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
}

.emoji-item {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.1s;
  line-height: 1;
}

.emoji-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sticker-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
  margin-bottom: 8px;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
}

.sticker-item {
  background: rgba(255, 255, 255, 0.06);
  border: none;
  font-size: 32px;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: background 0.1s, transform 0.1s;
  line-height: 1;
}

.sticker-item:hover {
  background: rgba(255, 255, 255, 0.14);
  transform: scale(1.2);
}

.chat-image {
  max-width: 160px;
  max-height: 120px;
  border-radius: 8px;
  cursor: pointer;
  display: block;
  margin-top: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.sticker-display {
  font-size: 40px;
  line-height: 1;
  display: block;
  margin-top: 2px;
}

.image-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: pointer;
}

.image-preview-full {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 8px;
}

.chat-input-row {
  position: relative;
}

.emoji-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.emoji-leave-active {
  transition: opacity 0.1s ease;
}

.emoji-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.emoji-leave-to {
  opacity: 0;
}
</style>
