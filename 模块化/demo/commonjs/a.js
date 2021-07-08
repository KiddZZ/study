let count = 0
let obj = {
  a: 0
}
exports.count = count
exports.obj = obj
exports.add = () => {
  count++
}
setTimeout(() => {
  obj.a++
}, 1000)