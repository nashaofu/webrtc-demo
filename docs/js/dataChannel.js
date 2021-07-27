const msgInput = document.querySelector('#msg-input')
const sendBtn = document.querySelector('#send-btn')
const msg = document.querySelector('#msg')

const query = new URLSearchParams(location.search)
const room = query.get('room')

if (!room) {
  location.replace(`${location.pathname}?room=${Math.random().toString(36).substr(2, 9)}`)
}

const socket = io.connect()
// 存储通信方信息
const remotes = {}

// socket发送消息
function sendMsg(target, msg) {
  console.log('->:', msg.type)
  msg.socketId = socket.id
  socket.emit('message', target, msg)
}

// 创建RTC对象，一个RTC对象只能与一个远端连接
function createRTC(id) {
  const pc = new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302'
      }
    ]
  })

  const dataChannel = pc.createDataChannel('dataChannel')

  // 获取本地网络信息，并发送给通信方
  pc.addEventListener('icecandidate', event => {
    if (event.candidate) {
      // 发送自身的网络信息到通信方
      sendMsg(id, {
        type: 'candidate',
        candidate: {
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        }
      })
    }
  })

  pc.addEventListener('datachannel', event => {
    event.channel.addEventListener('message', event => {
      const message = event.data
      const p = document.createElement('p')
      p.setAttribute('class', 'msg-type-receive')
      p.innerHTML = message.split('\n').join('<br/>')
      msg.append(p)
    })
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

  remotes[id] = {
    pc,
    dataChannel
  }
}

sendBtn.addEventListener('click', event => {
  const message = msgInput.value
  msgInput.value = ''
  const p = document.createElement('p')
  p.setAttribute('class', 'msg-type-send')
  p.innerHTML = message.split('\n').join('<br/>')
  msg.append(p)
  Object.keys(remotes).forEach(key => {
    remotes[key].dataChannel.send(message)
  })
})

// 创建或者加入房间，具体是加入还是创建需看房间号是否存在
socket.emit('create or join', room)

socket.on('leaveed', function (id) {
  console.log('leaveed', id)
  if (remotes[id]) {
    remotes[id].pc.close()
    remotes[id].dataChannel.close()
    delete remotes[id]
  }
})

socket.on('full', function (room) {
  console.log('Room ' + room + ' is full')
  socket.close()
  alert('房间已满')
})

socket.on('message', async function (message) {
  console.log('<-:', message.type)
  switch (message.type) {
    case 'join': {
      // 有新的人加入就重新设置会话，重新与新加入的人建立新会话
      createRTC(message.socketId)
      const pc = remotes[message.socketId].pc
      const offer = await pc.createOffer()
      pc.setLocalDescription(offer)
      sendMsg(message.socketId, { type: 'offer', offer })
      break
    }
    case 'offer': {
      createRTC(message.socketId)
      const pc = remotes[message.socketId].pc
      pc.setRemoteDescription(new RTCSessionDescription(message.offer))
      const answer = await pc.createAnswer()
      pc.setLocalDescription(answer)
      sendMsg(message.socketId, { type: 'answer', answer })
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
