function waitFn(delay) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(delay)
    }, delay)
  })
}

function asyncFunc(generator) {
  let iterator = generator()
  const next = (data) => {
    const { value, done } = iterator.next(data)
    if (done) return
    value.then((res) => {
      next(res)
    })
  }
  next()
}

asyncFunc(function* () {
  const a = yield waitFn(1000)
  console.log(a)
  const b = yield waitFn(1500)
  console.log(b)
})
