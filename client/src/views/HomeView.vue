<template>
  <div class="home">
    <div class="bg-decor">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="floating-icons">
      <span class="float-icon icon-1">&#x1F3A8;</span>
      <span class="float-icon icon-2">&#x1F3A9;</span>
      <span class="float-icon icon-3">&#x270F;&#xFE0F;</span>
      <span class="float-icon icon-4">&#x1F308;</span>
      <span class="float-icon icon-5">&#x2B50;</span>
      <span class="float-icon icon-6">&#x1F3AD;</span>
    </div>
    <div class="paint-blob paint-blob-1"></div>
    <div class="paint-blob paint-blob-2"></div>
    <div class="paint-blob paint-blob-3"></div>

    <div v-if="game.joinPending" class="join-pending-overlay">
      <div class="join-pending-card">
        <div class="pending-spinner"></div>
        <p>正在等待房主审批...</p>
      </div>
    </div>

    <div class="hero">
      <div class="canvas-texture"></div>
      <div class="hero-brand">
        <h1 class="hero-title">
          <span class="title-line">
            <span class="paint-drip" aria-hidden="true"></span>
            <span class="t-char" v-for="(ch, i) in '你画'" :key="'a' + i" :style="{ '--i': i }">{{ ch }}</span>
          </span>
          <span class="brush-wrap">
            <svg viewBox="0 0 160 20" class="brush-svg">
              <path d="M4 10 Q20 2 40 10 Q60 18 80 10 Q100 2 120 10 Q140 18 156 10"
                stroke="url(#bGrad)" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.7"/>
              <circle cx="12" cy="10" r="3" fill="#f5a623" opacity="0"/>
              <circle cx="148" cy="10" r="3" fill="#4ecdc4" opacity="0"/>
              <defs>
                <linearGradient id="bGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#e94560"/>
                  <stop offset="40%" stop-color="#a855f7"/>
                  <stop offset="70%" stop-color="#4ecdc4"/>
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span class="title-line">
            <span class="t-char" v-for="(ch, i) in '我猜'" :key="'b' + i" :style="{ '--i': i + 2 }">{{ ch }}</span>
            <span class="paint-drip right" aria-hidden="true"></span>
          </span>
        </h1>
        <p class="hero-sub">
          <span class="sub-inner">用画笔和想象力，和朋友一起玩</span>
        </p>
        <div class="art-dots">
          <span class="a-dot"></span>
          <span class="a-dot"></span>
          <span class="a-dot"></span>
        </div>
      </div>

      <div class="hero-card">
        <div class="input-group">
          <div class="field">
            <input
              v-model="name"
              placeholder="你的昵称"
              maxlength="10"
              @keyup.enter="handleJoinOrCreate"
              @input="clearError"
            />
            <span class="field-icon">&#x1F3A8;</span>
          </div>
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        </div>

        <button class="btn-create" @click="handleCreateRoom">
          <svg viewBox="0 0 20 20" width="18" height="18" class="btn-icon">
            <path d="M10 3v14M3 10h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" />
          </svg>
          <span>创建房间</span>
        </button>

        <div class="divider">
          <span class="divider-line"></span>
          <span class="divider-text">或者加入已有房间</span>
          <span class="divider-line"></span>
        </div>

        <div class="join-row">
          <input
            v-model="roomCode"
            placeholder="房间号"
            maxlength="4"
            class="room-input"
            @keyup.enter="handleJoinRoom"
            @input="clearError"
          />
          <button class="btn-join" @click="handleJoinRoom">加入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGameStore } from '../stores/game.js'
import { useRoute } from 'vue-router'

const nicknames = ['皮皮虾', '小机灵', '画画怪', '猜词王', '灵魂画手', '摸鱼大师', '吃瓜群众', '无敌小可爱', '暴躁画笔', '佛系玩家']

function randomName() {
  return nicknames[Math.floor(Math.random() * nicknames.length)] + Math.floor(Math.random() * 1000)
}

const game = useGameStore()
const route = useRoute()
const name = ref('')
const roomCode = ref('')
const errorMsg = ref('')

onMounted(() => {
  const room = route.query.room
  if (room && !game.playerId) {
    const rname = randomName()
    name.value = rname
    game.joinRoom(room.toUpperCase(), rname)
  }
})

function clearError() {
  errorMsg.value = ''
}

function handleCreateRoom() {
  clearError()
  if (!name.value.trim()) {
    errorMsg.value = '请先输入昵称'
    return
  }
  game.createRoom(name.value.trim())
}

function handleJoinRoom() {
  clearError()
  if (!name.value.trim()) {
    errorMsg.value = '请先输入昵称'
    return
  }
  if (!roomCode.value.trim()) {
    errorMsg.value = '请输入房间号'
    return
  }
  game.joinRoom(roomCode.value.trim().toUpperCase(), name.value.trim())
}

function handleJoinOrCreate() {
  clearError()
  if (!name.value.trim()) {
    errorMsg.value = '请先输入昵称'
    return
  }
  if (roomCode.value.trim()) {
    handleJoinRoom()
  } else {
    handleCreateRoom()
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a4e 0%, #2d1b69 30%, #e94560 100%);
  position: relative;
  overflow: hidden;
}

.bg-decor {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.35;
  animation: blobFloat 18s ease-in-out infinite alternate;
}

.blob-1 {
  width: 600px;
  height: 600px;
  top: -200px;
  left: -200px;
  background: linear-gradient(135deg, #ff6b9d, #a855f7);
}

.blob-2 {
  width: 500px;
  height: 500px;
  bottom: -150px;
  right: -150px;
  background: linear-gradient(135deg, #4ecdc4, #fbbf24);
  animation-delay: -6s;
}

.blob-3 {
  width: 350px;
  height: 350px;
  top: 60%;
  left: 30%;
  background: linear-gradient(135deg, #a855f7, #4ecdc4);
  animation-delay: -12s;
}

@keyframes blobFloat {
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(40px, -40px) scale(1.12); }
  66%  { transform: translate(-30px, 30px) scale(0.92); }
  100% { transform: translate(25px, 35px) scale(1.06); }
}

.floating-icons {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.float-icon {
  position: absolute;
  font-size: 32px;
  opacity: 0.5;
  animation: floatAround 14s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
  transition: transform 0.3s;
}

.float-icon:hover {
  opacity: 0.8;
  transform: scale(1.3) !important;
}

.icon-1 { top: 10%; left: 6%;   animation-delay: 0s;    font-size: 38px; }
.icon-2 { top: 15%; right: 8%;  animation-delay: -2.5s; font-size: 34px; }
.icon-3 { bottom: 22%; left: 8%; animation-delay: -5s;   font-size: 36px; }
.icon-4 { bottom: 12%; right: 6%; animation-delay: -7.5s; font-size: 30px; }
.icon-5 { top: 48%; left: 3%;   animation-delay: -10s;  font-size: 28px; }
.icon-6 { top: 52%; right: 4%;  animation-delay: -12s;  font-size: 32px; }

@keyframes floatAround {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25%  { transform: translateY(-20px) rotate(6deg); }
  50%  { transform: translateY(-6px) rotate(-3deg); }
  75%  { transform: translateY(-14px) rotate(4deg); }
}

/* --- Paint blobs (watercolor stains) --- */
.paint-blob {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  filter: blur(3px);
  opacity: 0.12;
  animation: blobDrift 20s ease-in-out infinite alternate;
}

.paint-blob-1 {
  width: 120px; height: 100px;
  top: 20%; left: 60%;
  background: radial-gradient(ellipse, #e94560, transparent);
  border-radius: 60% 40% 70% 30%;
  animation-duration: 22s;
}

.paint-blob-2 {
  width: 80px; height: 90px;
  bottom: 25%; left: 20%;
  background: radial-gradient(ellipse, #4ecdc4, transparent);
  border-radius: 40% 60% 30% 70%;
  animation-duration: 18s;
  animation-delay: -7s;
}

.paint-blob-3 {
  width: 100px; height: 70px;
  top: 60%; right: 15%;
  background: radial-gradient(ellipse, #a855f7, transparent);
  border-radius: 50% 50% 40% 60%;
  animation-duration: 24s;
  animation-delay: -14s;
}

@keyframes blobDrift {
  0%   { transform: translate(0, 0) rotate(0deg) scale(1); }
  50%  { transform: translate(20px, -30px) rotate(180deg) scale(1.2); }
  100% { transform: translate(-15px, 15px) rotate(360deg) scale(0.9); }
}

.hero {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  width: 440px;
  max-width: 92vw;
}

.canvas-texture {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    repeating-conic-gradient(rgba(255,255,255,0.02) 0% 25%, transparent 0% 50%);
  background-size: 4px 4px;
  opacity: 0.3;
}

.hero-brand {
  text-align: center;
  position: relative;
  animation: brandIn 0.8s ease-out;
}

@keyframes brandIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* --- Paint drips --- */
.paint-drip {
  display: inline-block;
  width: 6px;
  height: 24px;
  border-radius: 0 0 50% 50%;
  background: linear-gradient(180deg, #e94560, rgba(233,69,96,0.2));
  animation: dripIn 0.6s ease-out 0.8s both;
  vertical-align: middle;
  margin-bottom: -4px;
}

.paint-drip.right {
  background: linear-gradient(180deg, #4ecdc4, rgba(78,205,196,0.2));
}

@keyframes dripIn {
  from { height: 0; opacity: 0; }
  to   { height: 24px; opacity: 1; }
}

/* --- Title --- */
.hero-title {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin-bottom: 16px;
}

.title-line {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 6px;
  padding: 0 12px;
}

.t-char {
  font-size: clamp(66px, 14vw, 96px);
  font-weight: 900;
  display: inline-block;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', sans-serif;
  letter-spacing: 8px;
  line-height: 1;
  text-shadow:
    0 2px 20px rgba(233, 69, 96, 0.15),
    0 4px 40px rgba(168, 85, 247, 0.1);
  background: linear-gradient(180deg, #fff 20%, #f5a623 45%, #e94560 65%, #a855f7 85%);
  background-size: 100% 200%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradSlide 3s ease-in-out infinite, charPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: 0s, calc(var(--i) * 0.12s + 0.2s);
  transition: transform 0.2s;
}

.t-char:hover {
  transform: scale(1.12) rotate(-3deg);
  text-shadow:
    0 2px 30px rgba(233, 69, 96, 0.3),
    0 8px 60px rgba(168, 85, 247, 0.2);
}

@keyframes gradSlide {
  0%, 100% { background-position: 0% 0%; }
  50%      { background-position: 0% 100%; }
}

@keyframes charPop {
  from { opacity: 0; transform: translateY(40px) scale(0.5) rotate(-8deg); }
  to   { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
}

/* --- Brush stroke --- */
.brush-wrap {
  width: 160px;
  height: 24px;
  margin: -4px 0;
  animation: brushReveal 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
  overflow: visible;
}

.brush-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

@keyframes brushReveal {
  from { width: 0; opacity: 0; }
  to   { width: 160px; opacity: 1; }
}

/* --- Subtitle --- */
.hero-sub {
  font-size: 17px;
  font-weight: 500;
  letter-spacing: 3px;
  color: transparent;
  margin-top: 4px;
}

.sub-inner {
  background: linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.8), rgba(255,255,255,0.5));
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { background-position: -200% 0; }
  50%      { background-position: 200% 0; }
}

/* --- Art dots --- */
.art-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}

.a-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  animation: dotPulse 2.4s ease-in-out infinite;
}

.a-dot:nth-child(1) { background: #e94560; }
.a-dot:nth-child(2) { background: #f5a623; animation-delay: 0.4s; }
.a-dot:nth-child(3) { background: #4ecdc4; animation-delay: 0.8s; }

@keyframes dotPulse {
  0%, 100% { transform: scale(1); opacity: 0.3; box-shadow: 0 0 0 rgba(0,0,0,0); }
  50%      { transform: scale(1.5); opacity: 1; box-shadow: 0 0 12px currentColor; }
}

@keyframes brandIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.splatter {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  animation: splatterPop 0.8s ease-out 0.6s both;
}

.splatter-1 {
  width: 14px; height: 14px;
  top: -8px; left: 10%;
  background: #e94560;
}

.splatter-2 {
  width: 8px; height: 8px;
  top: 4px; right: 15%;
  background: #f5a623;
}

.splatter-3 {
  width: 10px; height: 10px;
  bottom: 20px; left: 5%;
  background: #4ecdc4;
}

.splatter-4 {
  width: 6px; height: 6px;
  bottom: 10px; right: 8%;
  background: #a855f7;
}

@keyframes splatterPop {
  from { opacity: 0; transform: scale(0); }
  50%  { transform: scale(1.4); }
  to   { opacity: 0.7; transform: scale(1); }
}

.hero-title {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin-bottom: 12px;
}

.title-line {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.brush-stroke {
  width: 120px;
  height: 16px;
  margin: -2px 0;
  animation: strokeIn 0.8s ease-out 0.5s both;
}

.brush-svg {
  width: 100%;
  height: 100%;
  display: block;
}

@keyframes strokeIn {
  from { width: 0; opacity: 0; }
  to   { width: 120px; opacity: 1; }
}

.t-char {
  font-size: clamp(56px, 12vw, 80px);
  font-weight: 900;
  display: inline-block;
  background: linear-gradient(135deg, #f5a623, #e94560, #a855f7, #4ecdc4);
  background-size: 300% 300%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradShift 4s ease-in-out infinite, charBounce 0.5s ease-out both;
  animation-delay: calc(var(--i) * 0.1s), calc(var(--i) * 0.1s + 0.5s);
  letter-spacing: 4px;
  line-height: 1.15;
  transform: rotate(calc(var(--rot) * 1deg));
}

@keyframes gradShift {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}

@keyframes charBounce {
  from { opacity: 0; transform: translateY(30px) scale(0.6) rotate(calc(var(--rot) * 1deg + 10deg)); }
  to   { opacity: 1; transform: translateY(0) scale(1) rotate(calc(var(--rot) * 1deg)); }
}

.hero-sub {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 2px;
}

.hero-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: dotPulse 2s ease-in-out infinite;
}

.dot:nth-child(2) { animation-delay: 0.3s; background: #e94560; }
.dot:nth-child(3) { animation-delay: 0.6s; background: #f5a623; }
.dot:nth-child(4) { animation-delay: 0.9s; background: #4ecdc4; }

@keyframes dotPulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50%      { transform: scale(1.6); opacity: 1; }
}

.hero-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(24px);
  border-radius: 24px;
  padding: 32px 28px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    0 8px 48px rgba(255, 255, 255, 0.06),
    0 8px 40px rgba(0, 0, 0, 0.2);
  animation: cardSlide 0.6s ease-out 0.4s both;
}

@keyframes cardSlide {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.input-group {
  margin-bottom: 16px;
}

.field {
  position: relative;
}

.field input {
  width: 100%;
  padding: 16px 20px 16px 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 15px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.25s;
  text-align: left;
}

.field input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.field input:focus {
  border-color: rgba(124, 77, 255, 0.5);
  background: rgba(255, 255, 255, 0.09);
  box-shadow: 0 0 24px rgba(124, 77, 255, 0.12);
}

.field-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  opacity: 0.5;
  pointer-events: none;
}

.error-msg {
  color: #ff6b6b;
  font-size: 13px;
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 107, 0.15);
  animation: shake 0.3s ease-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.btn-create {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #7c4dff, #e94560);
  background-size: 200% 200%;
  color: white;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 20px rgba(124, 77, 255, 0.3);
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
}

.btn-create::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #e94560, #7c4dff);
  opacity: 0;
  transition: opacity 0.3s;
}

.btn-create:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 8px 30px rgba(124, 77, 255, 0.45);
}

.btn-create:hover::after {
  opacity: 1;
}

.btn-create:active {
  transform: translateY(0) scale(0.98);
}

.btn-icon {
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.btn-create span,
.btn-create svg {
  position: relative;
  z-index: 1;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

.divider-text {
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
  flex-shrink: 0;
  white-space: nowrap;
}

.join-row {
  display: flex;
  gap: 10px;
}

.room-input {
  flex: 1 1 0;
  min-width: 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 6px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.25s;
  font-weight: 700;
}

.room-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
  font-size: 14px;
  letter-spacing: 1px;
  font-weight: 400;
}

.room-input:focus {
  border-color: rgba(245, 166, 35, 0.5);
  background: rgba(255, 255, 255, 0.09);
  box-shadow: 0 0 20px rgba(245, 166, 35, 0.1);
}

.btn-join {
  padding: 14px 28px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5a623, #e94560);
  color: white;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(245, 166, 35, 0.25);
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-join:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(245, 166, 35, 0.35);
}

.btn-join:active {
  transform: translateY(0);
}

.join-pending-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.join-pending-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
}

.join-pending-card p {
  margin-top: 16px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.pending-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #f5a623;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .home {
    min-height: 100dvh;
  }

  .floating-icons,
  .paint-blob,
  .blob-2,
  .blob-3 {
    display: none;
  }

  .blob-1 {
    width: 300px;
    height: 300px;
    top: -100px;
    left: -100px;
  }

  .hero {
    gap: 16px;
  }

  .hero-card {
    padding: 18px 14px;
    border-radius: 18px;
  }

  .hero-brand {
    animation: none;
  }

  .field input {
    padding: 12px 14px 12px 36px;
    font-size: 13px;
    border-radius: 10px;
  }

  .field-icon {
    font-size: 15px;
    left: 12px;
  }

  .btn-create {
    padding: 12px;
    font-size: 14px;
    border-radius: 10px;
  }

  .divider {
    margin: 10px 0;
  }

  .divider-text {
    font-size: 11px;
  }

  .room-input {
    padding: 10px 10px;
    font-size: 14px;
    letter-spacing: 3px;
    border-radius: 10px;
  }

  .btn-join {
    padding: 10px 16px;
    font-size: 13px;
    border-radius: 10px;
  }

  .t-char {
    font-size: clamp(32px, 10vw, 52px);
    letter-spacing: 3px;
    animation: none;
  }

  .hero-sub {
    font-size: 12px;
    margin-top: 0;
  }

  .brush-wrap {
    width: 80px;
    height: 14px;
    margin: -2px 0;
  }

  .art-dots {
    margin-top: 8px;
  }

  .a-dot {
    width: 5px;
    height: 5px;
  }

  .paint-drip {
    width: 4px;
    height: 16px;
  }

  @keyframes dripIn {
    from { height: 0; opacity: 0; }
    to   { height: 16px; opacity: 1; }
  }
}
</style>
