var name = 'a'
exports.name = name
var b = require('./b.js')
name = 'a-changed'
exports.name = name

