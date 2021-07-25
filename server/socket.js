const socket = require('socket.io')

module.exports = server => {
  // 在https服务器上添加ws通信路径`/socket.io/`
  const io = socket.listen(server)

  io.sockets.on('connection', function (socket) {
    socket.on('disconnecting', () => {
      // 通知房间中的其他客户端断开连接
      Object.keys(socket.rooms).forEach(room => {
        socket.broadcast.to(room).emit('leaveed', socket.id)
      })
    })

    // 转发客户端消息
    socket.on('message', function (target, message) {
      if (target) {
        // 发送消息到指定客户端
        io.sockets.sockets[target]?.emit('message', message)
      }
    })

    // 房间创建与加入
    socket.on('create or join', function (room) {
      const clientsInRoom = io.sockets.adapter.rooms[room]
      const numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0

      if (numClients === 0) {
        // 创建房间
        socket.join(room)
        // 通知当前客户端创建房间成功
        socket.emit('created', room, socket.id)
      } else if (numClients < 10) {
        // 一个房间最多只能有10个人
        socket.join(room)
        // 通知当前客户端加入房间成功
        socket.emit('joined', room, socket.id)
        // 通知房间中的其他客户端有人加入
        socket.broadcast.to(room).emit('message', {
          socketId: socket.id,
          type: 'join'
        })
      } else {
        // max two clients
        socket.emit('full', room)
      }
    })
  })
}
