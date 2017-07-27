var onAsyncHooks = require('./')
var http = require('http')

onAsyncHooks(function (data) {
  console.log(data)
})

http.createServer(function (req, res) {
  res.end('Hello qts')
}).listen(8080)
