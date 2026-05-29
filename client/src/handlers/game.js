import { useGameStore } from '../stores/game.js'
import { useNotificationStore } from '../stores/notification.js'
import router from '../router/index.js'

export function register(socket) {

  socket.on('game_started', () => {
    const store = useGameStore()
    store.phase = 'playing'
    store.messages = []
    store.scores = {}
    store.guessedPlayers = []
    router.push(`/game/${store.roomId}`)
  })

  socket.on('round_started', (data) => {
    const store = useGameStore()
    store.round = data.round
    store.maxRounds = data.maxRounds
    store.drawerId = data.drawerId
    store.drawerName = data.drawerName
    store.myTurn = data.drawerId === store.playerId
    store.phase = data.phase
    store.selectTime = data.selectTime
    store.timer = data.selectTime
    store.guessedPlayers = []
    store.currentWord = ''
    store.messages = [...store.messages, { type: 'system', text: `第 ${data.round}/${data.maxRounds} 轮 - ${data.drawerName} 正在选择词语...` }]
  })

  socket.on('word_options', (data) => {
    useGameStore().wordOptions = data.words
  })

  socket.on('word_selected', (data) => {
    const store = useGameStore()
    store.wordLength = data.wordLength
    store.phase = 'drawing'
    store.timer = 60
    store.messages = [...store.messages, { type: 'system', text: `画师已选好词语（${data.wordLength}个字），开始画画！` }]
  })

  socket.on('your_word', (data) => {
    useGameStore().currentWord = data.word
  })

  socket.on('timer_tick', (time) => {
    useGameStore().timer = time
  })

  socket.on('correct_guess', (data) => {
    const store = useGameStore()
    store.scores = data.scores
    store.guessedPlayers = data.guessedPlayers
    store.messages = [...store.messages, { type: 'system', text: `${data.playerName} ${data.isFirst ? '猜对了！+100分！' : '也猜对了！+50分！'}` }]
  })

  socket.on('round_ended', (data) => {
    const store = useGameStore()
    store.phase = 'round_end'
    store.timer = 0
    if (data.scores) store.scores = data.scores
    store.messages = [...store.messages, { type: 'system', text: `本轮结束！答案是：${data.word}` }]
  })

  socket.on('game_over', (data) => {
    const store = useGameStore()
    store.phase = 'game_over'
    store.gameOverScores = data.scores
  })

  socket.on('game_interrupted', () => {
    const store = useGameStore()
    store.phase = 'waiting'
    store.round = 0
    store.drawerId = ''
    store.drawerName = ''
    store.currentWord = ''
    store.wordLength = 0
    store.wordOptions = []
    store.myTurn = false
    store.scores = {}
    store.timer = 0
    store.guessedPlayers = []
    store.messages = [...store.messages, { type: 'system', text: '游戏中断：玩家不足，已返回房间' }]
    useNotificationStore().showToast('游戏中断：玩家不足', 'warning')
    router.push(`/room/${store.roomId}`)
  })

  socket.on('room_reset', () => {
    const store = useGameStore()
    store.phase = 'waiting'
    store.round = 0
    store.drawerId = ''
    store.drawerName = ''
    store.currentWord = ''
    store.wordLength = 0
    store.wordOptions = []
    store.myTurn = false
    store.scores = {}
    store.timer = 0
    store.messages = []
    store.guessedPlayers = []
    store.gameOverScores = []
    store.pendingRequests = []
    router.push(`/room/${store.roomId}`)
  })

  socket.on('items_update', (data) => {
    const store = useGameStore()
    store.items = data.items
    if (data.newItems?.length > 0) {
      store.lastItemReward = data.newItems
    }
  })

}
