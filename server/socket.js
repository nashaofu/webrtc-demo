const socket = require('socket.io')

module.exports = server => {
  const io = socket.listen(server)

  io.sockets.on('connection', function (socket) {
    socket.on('disconnecting', () => {
      // 通知房间中的其他客户端断开连接
      Object.keys(socket.rooms).forEach(room => {
        socket.broadcast.to(room).emit('leaveed', socket.id)
      })
    })

    socket.on('message', function (target, message) {
      if (target) {
        // 发送消息到指定客户端
        io.sockets.sockets[target]?.emit('message', message)
      } else {
        // 发送信息给所有客户端
        Object.keys(socket.rooms).forEach(room => {
          socket.broadcast.to(room).emit('message', message)
        })
      }
    })

    socket.on('create or join', function (room) {
      const clientsInRoom = io.sockets.adapter.rooms[room]
      const numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0

      if (numClients === 0) {
        // 创建房间
        socket.join(room)
        socket.emit('created', room, socket.id)
      } else if (numClients < 10) {
        // 一个房间最多只能有10个人
        socket.join(room)
        socket.broadcast.to(room).emit('join', room, socket.id)
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
