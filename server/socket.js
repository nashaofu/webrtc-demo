const socket = require('socket.io')

module.exports = server => {
  const io = socket.listen(server)

  io.sockets.on('connection', function (socket) {
    socket.on('message', function (message) {
      console.log(message.type)
      switch (message.type) {
        case 'create':
          socket.broadcast.emit('message', message)
          break
        case 'join':
          socket.broadcast.emit('message', message)
          break
        case 'offer':
          socket.broadcast.emit('message', message)
          break
        case 'answer':
          socket.broadcast.emit('message', message)
          break
        case 'candidate':
          socket.broadcast.emit('message', message)
          break
        default:
          break
      }
    })

    socket.on('create or join', function (room) {
      const clientsInRoom = io.sockets.adapter.rooms[room]
      const numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0
      console.log(numClients)
      if (numClients === 0) {
        socket.join(room)
        socket.emit('created', room, socket.id)
      } else if (numClients === 1) {
        io.sockets.in(room).emit('join', room)
        socket.join(room)
        socket.emit('joined', room, socket.id)
      } else {
        // max two clients
        socket.emit('full', room)
      }
    })

    socket.on('ipaddr', function () {
      ipaddrs.forEach(ipaddr => {
        socket.emit('ipaddr', ipaddr)
      })
    })

    socket.on('bye', function () {
      console.log('received bye')
    })
  })
}
