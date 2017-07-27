# on-async-hook 🔍
[![npm version][1]][2] [![build status][3]][4]
[![downloads][5]][6] [![js-standard-style][7]][8]

[async_hook](https://nodejs.org/api/async_hooks.html) trace emitter to help you with your tracing needs. Fair warning, async_hook api is only available in node 8, and is an under an experimental flag.

## Usage

```js
var onAsyncHook = require('on-async-hook')

onAsyncHook(function (data) {
  console.log(data)
})
```

## API
### `stop = onAsyncHook([opts], cb(data))`
Create an instance of `onAsyncHook`. Calls a callback with data you can add to your logger. 

### `stop()`
Disable `onAsyncHook` instance. 

# Install
```bash
npm install on-async-hook 
```
[MIT](https://tldrlegal.com/license/mit-license)

[1]: https://img.shields.io/npm/v/on-async-hook.svg?style=flat-square
[2]: https://npmjs.org/package/on-async-hook
[3]: https://img.shields.io/travis/lrlna/on-async-hook/master.svg?style=flat-square
[4]: https://travis-ci.org/lrlna/on-async-hook
[5]: http://img.shields.io/npm/dm/on-async-hook.svg?style=flat-square
[6]: https://npmjs.org/package/on-async-hook
[7]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[8]: https://github.com/feross/standard
