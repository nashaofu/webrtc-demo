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
  iceServers: [
    { url: 'stun:stun01.sipphone.com' },
    { url: 'stun:stun.ekiga.net' },
    { url: 'stun:stun.fwdnet.net' },
    { url: 'stun:stun.ideasip.com' },
    { url: 'stun:stun.iptel.org' },
    { url: 'stun:stun.rixtelecom.se' },
    { url: 'stun:stun.schlund.de' },
    { url: 'stun:stun.l.google.com:19302' },
    { url: 'stun:stun1.l.google.com:19302' },
    { url: 'stun:stun2.l.google.com:19302' },
    { url: 'stun:stun3.l.google.com:19302' },
    { url: 'stun:stun4.l.google.com:19302' },
    { url: 'stun:stunserver.org' },
    { url: 'stun:stun.softjoys.com' },
    { url: 'stun:stun.voiparound.com' },
    { url: 'stun:stun.voipbuster.com' },
    { url: 'stun:stun.voipstunt.com' },
    { url: 'stun:stun.voxgratia.org' },
    { url: 'stun:stun.xten.com' },
    {
      url: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    },
    {
      url: 'turn:192.158.29.39:3478?transport=udp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    },
    {
      url: 'turn:192.158.29.39:3478?transport=tcp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    }
  ]
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
