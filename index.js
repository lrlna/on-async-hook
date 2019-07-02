var assert = require('assert')
var NS_PER_SEC = 1e9

module.exports = onAsyncHook

function onAsyncHook (opts, cb) {
  if (!cb) {
    cb = opts
    opts = {}
  }

  assert.equal(typeof opts, 'object', 'on-async-hook: opts should be type object')
  assert.equal(typeof cb, 'function', 'on-async-hook: cb should be type function')

  // catch this if we are not in node 8
  try {
    var asyncHooks = require('async_hooks')
  } catch (e) {
    return function () {}
  }

  var links = {}
  var traces = {}
  var spans = {}

  var hooks = {
    init: init,
    destroy: destroy
  }

  var asyncHook = asyncHooks.createHook(hooks)
  asyncHook.enable()

  return function () {
    asyncHook.disable()
  }

  function init (asyncId, type, triggerId) {
    var currentId = asyncHooks.executionAsyncId()
    // don't want the initial start TCPWRAP
    if (currentId === 1 && type === 'TCPWRAP') return
    if (triggerId === 0) return

    var time = process.hrtime()
    var span = createSpan(asyncId, type, triggerId, time)
    var traceId = links[triggerId]
    var trace = null

    if (!traceId) {
      traceId = asyncId
      trace = createTrace(time, traceId)
    } else {
      trace = traces[traceId]
    }
    traces[asyncId] = trace
    links[asyncId] = traceId
    spans[asyncId] = span
    trace.spans.push(span)
  }

  function destroy (asyncId) {
    var time = process.hrtime()
    var span = spans[asyncId]
    if (!span) return
    span.endTime = time[0] * NS_PER_SEC + time[1]
    span.duration = span.endTime - span.startTime
    var trace = traces[asyncId]
    if (!trace) return
    trace.endTime = time[0] * NS_PER_SEC + time[1]
    trace.duration = trace.endTime - trace.startTime
    links[asyncId] = null
    traces[asyncId] = null
    trace.spans.forEach(function (span) {
      var id = span.id
      links[id] = null
      spans[id] = null
    })
    cb(trace)
  }

  function createSpan (id, type, parent, time) {
    return {
      id: id,
      type: type,
      parent: parent,
      startTime: time[0] * NS_PER_SEC + time[1]
    }
  }

  function createTrace (time, id) {
    return {
      startTime: time[0] * NS_PER_SEC + time[1],
      id: id,
      spans: []
    }
  }
}
