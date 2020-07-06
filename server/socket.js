const socket = require('socket.io')

module.exports = (server) => {
  const io = socket.listen(server)

  io.sockets.on('connection', function (socket) {
    console.log('a user connected', socket.id)
    socket.on('disconnecting', () => {
      console.log(socket.rooms)
      console.log('user disconnected', socket.id)
    })
    socket.on('chat message', msg => {
      io.emit('chat message', msg)
    })
    socket.on('message', function (message) {
      // for a real app, would be room-only (not broadcast)
      if (message.type === 'ready') {
        socket.broadcast.emit('message', { type: 'ready' })
      } else if (message.type === 'offer') {
        socket.broadcast.emit('message', message)
      } else if (message.type === 'answer') {
        socket.broadcast.emit('message', message)
      } else if (message.type === 'candidate') {
        socket.broadcast.emit('message', message)
      } else {
        console.log(message)
      }
    })

    socket.on('create or join', function (room) {
      const clientsInRoom = io.sockets.adapter.rooms[room]
      const numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0
      console.log(socket.id)
      if (numClients === 0) {
        socket.join(room)
        socket.emit('created', room, socket.id)
      } else if (numClients === 1) {
        io.sockets.in(room).emit('join', room)
        socket.join(room)
        socket.emit('joined', room, socket.id)
        io.sockets.in(room).emit('ready')
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
