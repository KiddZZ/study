var a = require('./a.js')
exports.age = 17
exports.name = 'b'
console.log('b模块中的a', a)
setTimeout(() => {
    console.log('b模块中3秒后的a', a)
}, 3000)