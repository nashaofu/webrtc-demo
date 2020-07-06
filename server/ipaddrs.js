const os = require('os')
const ifaces = Object.values(os.networkInterfaces())

module.exports = ifaces.reduce((ipaddrs, value = []) => {
  value.forEach(iface => {
    if (iface.family === 'IPv4' && iface.address !== '127.0.0.1') {
      ipaddrs.push(iface.address)
    }
  })
  return ipaddrs
}, [])
