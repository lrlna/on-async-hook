const onAsyncHooks = require('./')
const http = require('http')

onAsyncHooks(data => {
  console.log(data)
})

http.createServer((req, res) => {
  res.end('Hello qts')
}).listen(8080)
