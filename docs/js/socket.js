const videos = document.querySelector('#videos')
const localVideo = document.querySelector('#localVideo')

const remotes = {}
const socket = io.connect()

function sendMsg(msg) {
  console.log('->:', msg.type)
  msg.socketId = socket.id
  socket.emit('message', msg)
}

function createRTC(stream, id) {
  const pc = new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302'
      }
    ]
  })

  pc.addEventListener('icecandidate', event => {
    if (event.candidate) {
      sendMsg({
        type: 'candidate',
        candidate: {
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        }
      })
    }
  })

  pc.addEventListener('addstream', event => {
    remotes[id].video.srcObject = event.stream
  })

  pc.addStream(stream)

  const video = document.createElement('video')
  video.setAttribute('autoplay', true)
  video.setAttribute('playsinline', true)
  videos.append(video)
  remotes[id] = {
    pc,
    video
  }
}

navigator.mediaDevices
  .getUserMedia({
    audio: false,
    video: true
  })
  .then(stream => {
    localVideo.srcObject = stream

    socket.emit('create or join', 'dataChannel')

    socket.on('joined', function (room, id) {
      sendMsg({ type: 'join' })
    })

    socket.on('leaveed', function (id) {
      if (remotes[id]) {
        remotes[id].pc.close()
        videos.removeChild(remotes[id].video)
        delete remotes[id]
      }
    })

    socket.on('full', function (room) {
      console.log('Room ' + room + ' is full')
    })

    socket.on('message', async function (message) {
      console.log('<-:', message.type)
      switch (message.type) {
        case 'join': {
          // 有新的人加入就重新设置会话，重新与新加入的人建立新会话
          createRTC(stream, message.socketId)
          const pc = remotes[message.socketId].pc
          const offer = await pc.createOffer()
          pc.setLocalDescription(offer)
          sendMsg({ type: 'offer', offer })
          break
        }
        case 'offer': {
          createRTC(stream, message.socketId)
          const pc = remotes[message.socketId].pc
          pc.setRemoteDescription(new RTCSessionDescription(message.offer))
          const answer = await pc.createAnswer()
          pc.setLocalDescription(answer)
          sendMsg({ type: 'answer', answer })
          break
        }
        case 'answer': {
          const pc = remotes[message.socketId].pc
          pc.setRemoteDescription(new RTCSessionDescription(message.answer))
          break
        }
        case 'candidate': {
          const pc = remotes[message.socketId].pc
          pc.addIceCandidate(new RTCIceCandidate(message.candidate))
          break
        }
        default:
          console.log(message)
          break
      }
    })
  })
