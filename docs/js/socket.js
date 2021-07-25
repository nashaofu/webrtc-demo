const videos = document.querySelector('#videos')
const localVideo = document.querySelector('#localVideo')
const roomId = document.querySelector('#roomId')

const query = new URLSearchParams(location.search)
const room = query.get('room')

// 存储通信方信息
const remotes = {}
const socket = io.connect()

if (!room) {
  location.replace(`/socket.html?room=${Math.random().toString(36).substr(2, 9)}`)
}

function sendMsg(target, msg) {
  console.log('->:', msg.type)
  msg.socketId = socket.id
  socket.emit('message', target, msg)
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

  // 有远程视频流时，连接到远程视频流
  pc.addEventListener('track', event => {
    remotes[id].video.srcObject = event.streams[0]
  })

  // 添加本地视频流到会话中
  stream.getTracks().forEach(track => pc.addTrack(track, stream))

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
    roomId.innerHTML = room
    localVideo.srcObject = stream

    socket.emit('create or join', room)

    socket.on('joined', function (room, id) {
      sendMsg(undefined, { type: 'join' })
    })

    socket.on('leaveed', function (id) {
      console.log('leaveed', remotes, id)
      if (remotes[id]) {
        remotes[id].pc.close()
        videos.removeChild(remotes[id].video)
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
          createRTC(stream, message.socketId)
          const pc = remotes[message.socketId].pc
          const offer = await pc.createOffer()
          pc.setLocalDescription(offer)
          sendMsg(message.socketId, { type: 'offer', offer })
          break
        }
        case 'offer': {
          createRTC(stream, message.socketId)
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
  })
