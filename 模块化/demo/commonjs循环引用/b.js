var name = 'b'
var a = require('./a.js')
console.log('b模块中的a', a.name)
name = 'b-changed'

exports.name = name