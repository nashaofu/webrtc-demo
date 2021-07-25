const msgInput = document.querySelector('#msg-input')
const sendBtn = document.querySelector('#send-btn')
const msg = document.querySelector('#msg')

let pc
let dataChannel

function createRTC() {
  if (pc) {
    pc.close()
  }
  pc = new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302'
      }
    ]
  })
  if (dataChannel) {
    dataChannel.close()
  }

  dataChannel = pc.createDataChannel('dataChannel')

  pc.addEventListener('datachannel', event => {
    event.channel.addEventListener('message', event => {
      const message = event.data
      const p = document.createElement('p')
      p.setAttribute('class', 'msg-type-receive')
      p.innerHTML = message.split('\n').join('<br/>')
      msg.append(p)
    })
  })

  pc.addEventListener('icecandidate', event => {
    if (event.candidate) {
      sendMsg(null, {
        type: 'candidate',
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        sdpMid: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      })
    }
  })

  dataChannel.addEventListener('open', event => {
    msgInput.disabled = false
    msgInput.focus()
    sendBtn.disabled = false
  })

  dataChannel.addEventListener('close', event => {
    msgInput.disabled = false
    sendBtn.disabled = false
  })
}

sendBtn.addEventListener('click', event => {
  const message = msgInput.value
  msgInput.value = ''
  const p = document.createElement('p')
  p.setAttribute('class', 'msg-type-send')
  p.innerHTML = message.split('\n').join('<br/>')
  msg.append(p)
  dataChannel.send(message)
})

const socket = io.connect()

socket.emit('create or join', 'dataChannel')

socket.on('joined', function (room) {
  sendMsg(null, { type: 'join' })
})

socket.on('full', function (room) {
  console.log('Room ' + room + ' is full')
})

function sendMsg(target, msg) {
  console.log('->:', msg.type)
  socket.emit('message', target, msg)
}

socket.on('message', async function (message) {
  console.log('<-:', message.type)
  switch (message.type) {
    case 'join': {
      // 有新的人加入就重新设置会话，重新与新加入的人建立新会话
      createRTC()
      const offer = await pc.createOffer()
      pc.setLocalDescription(offer)
      sendMsg(message.socketId, { type: 'offer', offer })
      break
    }
    case 'offer': {
      createRTC()
      pc.setRemoteDescription(new RTCSessionDescription(message.offer))
      const answer = await pc.createAnswer()
      pc.setLocalDescription(answer)
      sendMsg(message.socketId, { type: 'answer', answer })
      break
    }
    case 'answer': {
      pc.setRemoteDescription(new RTCSessionDescription(message.answer))
      break
    }
    case 'candidate': {
      pc.addIceCandidate(new RTCIceCandidate(message))
      break
    }
    default:
      console.log(message)
      break
  }
})
