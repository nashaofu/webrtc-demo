const createJoinSelect = document.querySelector('#create-join-select')
const createBtn = document.querySelector('#create-btn')
const joinBtn = document.querySelector('#join-btn')
const sessionContainer = document.querySelector('#session-conatiner')
const localVideo = document.querySelector('#localVideo')
const remoteVideo = document.querySelector('#remoteVideo')

const create = document.querySelector('#create')
const createOfferToken = document.querySelector('#create-offer-token')
const createAnswerToken = document.querySelector('#create-answer-token')
const createAnswerSubmit = document.querySelector('#create-answer-submit')

const join = document.querySelector('#join')
const joinOfferToken = document.querySelector('#join-offer-token')
const joinOfferSubmit = document.querySelector('#join-offer-submit')
const joinAnswerToken = document.querySelector('#join-answer-token')

let pc
let offer
let candidate = []

createBtn.addEventListener('click', () => {
  createJoinSelect.style.setProperty('display', 'none')
  sessionContainer.style.setProperty('display', 'block')
  create.style.setProperty('display', 'block')
  createRTCPeerConnection()
})

joinBtn.addEventListener('click', () => {
  createJoinSelect.style.setProperty('display', 'none')
  sessionContainer.style.setProperty('display', 'block')
  join.style.setProperty('display', 'block')
  joinRTCPeerConnection()
})

createAnswerSubmit.addEventListener('click', () => {
  const data = tokenDecode(createAnswerToken.value)
  console.log('被呼叫者的应答信息：', data)
  pc.setRemoteDescription(new RTCSessionDescription(data.offer))
  data.candidate.forEach(candidate => {
    pc.addIceCandidate(new RTCIceCandidate(candidate))
  })
})

joinOfferSubmit.addEventListener('click', async () => {
  const data = tokenDecode(joinOfferToken.value)
  console.log('被呼叫者收到的会话信息：', data)
  pc.setRemoteDescription(new RTCSessionDescription(data.offer))
  data.candidate.forEach(candidate => {
    pc.addIceCandidate(new RTCIceCandidate(candidate))
  })
  offer = await pc.createAnswer()
  pc.setLocalDescription(offer)
})

function tokenEncode(data) {
  return btoa(JSON.stringify(data))
}

function tokenDecode(token) {
  return JSON.parse(atob(token))
}

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
}

async function createRTCPeerConnection() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  })

  localVideo.srcObject = stream
  pc = new RTCPeerConnection(config)

  pc.addEventListener('icecandidate', event => {
    event.candidate && console.log('icecandidate', event)
    if (event.candidate) {
      candidate.push({
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        sdpMid: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      })
      console.log('呼叫者的信息：', { offer, candidate })
      createOfferToken.value = tokenEncode({ offer, candidate })
    }
  })
  pc.addEventListener('addstream', e => {
    remoteVideo.srcObject = event.stream
  })

  pc.addStream(stream)

  offer = await pc.createOffer()
  pc.setLocalDescription(offer)
}

async function joinRTCPeerConnection() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  })

  localVideo.srcObject = stream
  pc = new RTCPeerConnection(config)

  pc.addEventListener('icecandidate', event => {
    event.candidate && console.log('icecandidate', event)
    if (event.candidate) {
      candidate.push({
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        sdpMid: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      })
      console.log('被呼叫者的信息：', { offer, candidate })
      joinAnswerToken.value = tokenEncode({ offer, candidate })
    }
  })

  pc.addEventListener('addstream', e => {
    remoteVideo.srcObject = event.stream
  })

  pc.addStream(stream)
}
