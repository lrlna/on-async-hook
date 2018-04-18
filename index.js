const assert = require('assert')
const NS_PER_SEC = 1e9

function onAsyncHook(opts, cb) {
  if (!cb) {
    cb = opts
    opts = {}
  }

  assert.equal(typeof opts, 'object', 'on-async-hook: opts should be type object')
  assert.equal(typeof cb, 'function', 'on-async-hook: cb should be type function')

  // catch this if we are not in node 8
  let asyncHooks;
  try {
    asyncHooks = require('async_hooks')
  } catch (e) {
    return function () { }
  }

  const links = {}
  const traces = {}
  const spans = {}

  const hooks = {
    init: init,
    before: before, 
    after: after,
    destroy: destroy
  }

  const asyncHook = asyncHooks.createHook(hooks)
  asyncHook.enable()

  return function () {
    asyncHook.disable()
  }

  function init(asyncId, type, triggerId) {
    const currentId = asyncHooks.executionAsyncId()
    // don't want the initial start TCPWRAP
    if (currentId === 1 && type === 'TCPWRAP') return
    if (triggerId === 0) return

    const time = process.hrtime()
    const span = createSpan(asyncId, type, triggerId, time)
    let traceId = links[triggerId]
    let trace = null

    if (!traceId) {
      traceId = asyncId
      trace = createTrace(time, traceId)
      traces[asyncId] = trace
    } else {
      trace = traces[traceId]
    }
    links[asyncId] = traceId
    spans[asyncId] = span
    trace.spans.push(span)
  }

  function before(asyncId, type, triggerId) {
    const time = process.hrtime()
    let span = spans[asyncId]

    if (!span) {
      span = createSpan(asyncId, type, triggerId, time)
    }
    span.beforeTime = time[0] * NS_PER_SEC + time[1]
    span.durationBefore = span.beforeTime - span.startTime
  }

  function after(asyncId, type, triggerId) {
    const time = process.hrtime()
    let span = spans[asyncId]

    if (!span) {
      span = createSpan(asyncId, type, triggerId, time)
    }
    span.afterTime = time[0] * NS_PER_SEC + time[1]
    span.durationAfter = span.afterTime - span.startTime
  }

  function destroy(asyncId) {
    const time = process.hrtime()
    const span = spans[asyncId]
    if (!span) return

    span.endTime = time[0] * NS_PER_SEC + time[1]
    span.duration = span.endTime - span.startTime
    const trace = traces[asyncId]
    if (!trace) return

    trace.endTime = time[0] * NS_PER_SEC + time[1]
    trace.duration = trace.endTime - trace.startTime
    links[asyncId] = null
    traces[asyncId] = null
    trace.spans.forEach((span) => {
      const id = span.id
      links[id] = null
      spans[id] = null
    })
    cb(trace)
  }

  function createSpan(id, type, parent, time) {
    return {
      id: id,
      type: type,
      parent: parent,
      startTime: time[0] * NS_PER_SEC + time[1]
    }
  }

  function createTrace(time, id) {
    return {
      startTime: time[0] * NS_PER_SEC + time[1],
      id: id,
      spans: []
    }
  }
}

module.exports = onAsyncHook
