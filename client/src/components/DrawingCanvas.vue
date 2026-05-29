<template>
  <div class="drawing-canvas-container">
    <div class="canvas-toolbar" v-if="isDrawer">
      <div class="tool-group">
        <button
          v-for="c in colors"
          :key="c"
          class="color-btn"
          :class="{ active: currentColor === c }"
          :style="{ background: c }"
          @click="currentColor = c"
        ></button>
      </div>
      <div class="tool-group">
        <button
          v-for="s in sizes"
          :key="s"
          class="size-btn"
          :class="{ active: currentSize === s }"
          @click="currentSize = s"
        >
          <div class="size-dot" :style="{ width: s + 'px', height: s + 'px' }"></div>
        </button>
      </div>
      <button class="undo-btn" @click="$emit('undo')">撤销</button>
      <button class="clear-btn" @click="clearCanvas">清空</button>
    </div>
    <div class="canvas-wrapper" ref="wrapperRef">
      <canvas
        ref="canvasRef"
        @mousedown="startDraw"
        @mousemove="draw"
        @mouseup="endDraw"
        @mouseleave="endDraw"
        @touchstart.prevent="touchStart"
        @touchmove.prevent="touchMove"
        @touchend.prevent="endDraw"
      ></canvas>
    </div>
    <div v-if="!isDrawer && phase === 'drawing' && !wordHint" class="guessing-hint">
      等待画师作画...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'

const props = defineProps({
  isDrawer: Boolean,
  phase: String,
  wordHint: { type: Number, default: 0 }
})

const emit = defineEmits(['draw-line', 'complete-stroke', 'clear-canvas', 'undo'])

const canvasRef = ref(null)
const wrapperRef = ref(null)
const currentColor = ref('#ffffff')
const currentSize = ref(4)

const colors = ['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff', '#000000']
const sizes = [2, 4, 6, 10, 16]

let isDrawing = false
let lastPoint = null
let currentStroke = []
let strokeColor = ''
let strokeWidth = 0

function getCanvasPoint(e) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) / rect.width,
    y: (e.clientY - rect.top) / rect.height
  }
}

function startDraw(e) {
  if (!props.isDrawer) return
  isDrawing = true
  const point = getCanvasPoint(e)
  lastPoint = point
  currentStroke = [{ ...point }]
  strokeColor = currentColor.value
  strokeWidth = currentSize.value
}

function draw(e) {
  if (!isDrawing || !props.isDrawer) return
  const point = getCanvasPoint(e)
  if (!point || !lastPoint) return

  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height

  ctx.beginPath()
  ctx.moveTo(lastPoint.x * w, lastPoint.y * h)
  ctx.lineTo(point.x * w, point.y * h)
  ctx.strokeStyle = currentColor.value
  ctx.lineWidth = currentSize.value
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()

  emit('draw-line', [lastPoint, point], currentColor.value, currentSize.value / w)
  currentStroke.push({ ...point })
  lastPoint = point
}

function endDraw() {
  if (!isDrawing) return
  isDrawing = false
  lastPoint = null
  if (currentStroke.length >= 2) {
    const canvas = canvasRef.value
    const nw = canvas ? strokeWidth / canvas.width : 0.01
    emit('complete-stroke', currentStroke, strokeColor, nw)
  }
  currentStroke = []
}

function touchStart(e) {
  if (!e.touches[0]) return
  const touch = e.touches[0]
  startDraw(touch)
}

function touchMove(e) {
  if (!e.touches[0]) return
  const touch = e.touches[0]
  draw(touch)
}

function clearCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  emit('clear-canvas')
}

function resizeCanvas() {
  const canvas = canvasRef.value
  const wrapper = wrapperRef.value
  if (!canvas || !wrapper) return

  canvas.width = wrapper.clientWidth
  canvas.height = wrapper.clientHeight

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function drawRemoteLine(points, color, width) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx || points.length < 2) return
  const w = canvas.width
  const h = canvas.height

  ctx.beginPath()
  ctx.moveTo(points[0].x * w, points[0].y * h)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x * w, points[i].y * h)
  }
  ctx.strokeStyle = color
  ctx.lineWidth = width * w
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
}

function remoteClear() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function resetCanvas() {
  remoteClear()
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
})

defineExpose({ drawRemoteLine, remoteClear, resetCanvas })
</script>

<style scoped>
.drawing-canvas-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-wrap: wrap;
}

.tool-group {
  display: flex;
  gap: 6px;
  align-items: center;
}

.color-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: all 0.15s;
  cursor: pointer;
}

.color-btn.active {
  border-color: white;
  transform: scale(1.2);
}

.size-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-btn.active {
  border-color: #4ecdc4;
  background: rgba(78, 205, 196, 0.15);
}

.size-dot {
  background: white;
  border-radius: 50%;
}

.undo-btn {
  margin-left: auto;
  padding: 6px 16px;
  border-radius: 8px;
  background: rgba(78, 205, 196, 0.15);
  color: #4ecdc4;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.undo-btn:hover {
  background: rgba(78, 205, 196, 0.3);
}

.clear-btn {
  padding: 6px 16px;
  border-radius: 8px;
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(233, 69, 96, 0.3);
}

.canvas-wrapper {
  flex: 1;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}

.guessing-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #8899aa;
  font-size: 16px;
}

@media (max-width: 768px) {
  .canvas-toolbar {
    padding: 6px 8px;
    gap: 4px;
  }

  .color-btn {
    width: 20px;
    height: 20px;
  }

  .size-btn {
    padding: 3px;
  }

  .size-dot {
    width: 10px !important;
    height: 10px !important;
  }

  .undo-btn,
  .clear-btn {
    padding: 4px 10px;
    font-size: 11px;
  }
}
</style>
