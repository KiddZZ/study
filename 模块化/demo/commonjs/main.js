var c = require('./commonjs-require')
console.log(c)
require('./commonjs-require').message = 'hello'
console.log(c)
Object.keys(require.cache).forEach(function(key) {
  console.log(key)
  delete require.cache[key];
})
var d = require('./commonjs-require')
console.log(d)


