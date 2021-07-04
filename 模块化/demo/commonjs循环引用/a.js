var b = require("./b.js");
var age = 19;
var name = "a";
var getName = () => {
  console.log(this.name);
};
setTimeout(() => {
    name = 'a2'
    console.log('a模块中的timeout', getName())
}, 1000);
console.log("a模块中的b模块", b);
module.exports = {
  age,
  name,
  getName
};
