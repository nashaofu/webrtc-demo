const localVideo = document.querySelector('#localVideo')
const remoteVideo = document.querySelector('#remoteVideo')

navigator.mediaDevices
  .getUserMedia({
    audio: false,
    video: true
  })
  .then(stream => {
    localVideo.srcObject = stream
    const pc = new RTCPeerConnection()
    let i
    pc.addEventListener('icecandidate', event => {
      if (event.candidate && !i) {
        i = true
        axios
          .post(!location.hash ? '/candidate?i=true' : '/candidate', {
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
            candidate: event.candidate.candidate
          })
          .then(({ data }) => {
            var candidate = new RTCIceCandidate(data)
            pc.addIceCandidate(candidate)
          })
      }
    })
    pc.addEventListener('addstream', e => {
      remoteVideo.srcObject = event.stream
      remoteVideo.onloadedmetadata = function (e) {
        remoteVideo.play()
      }
    })
    pc.addStream(stream)

    if (!location.hash) {
      pc.createOffer()
        .then(offer => {
          pc.setLocalDescription(offer)
          return axios.post('/api?i=true', offer)
        })
        .then(({ data }) => {
          pc.setRemoteDescription(new RTCSessionDescription(data))
        })
    } else {
      axios.get('/get').then(({ data }) => {
        pc.setRemoteDescription(new RTCSessionDescription(data))
        pc.createAnswer().then(offer => {
          pc.setLocalDescription(offer)
          return axios.post('/api', offer)
        })
      })
    }
  })
