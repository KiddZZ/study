const { count, add, obj } = require('./a.js')

console.log(count) //0
console.log(obj)
add()
console.log(count) //0 执行add之后，count并没有被改变，说明commonJs是值的拷贝
setTimeout(() => {
  console.log(obj)
}, 2000)