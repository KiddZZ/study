// Promise 的状态
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class MyPromise {
  constructor(fn) {
    // 状态
    this._status = PENDING
    // 据因
    this.reason = null
    // 终值
    this.value = null
    // 成功回调数组
    this.onFilFulledCallbacks = []
    // 失败回调数组
    this.onRejectedCallbacks = []

    const resolve = (value) => {
      if (this.status === PENDING) {
        this.value = value
        this.status = FULFILLED
      }
    }
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.reason = reason
        this.status = REJECTED
      }
    }
    try {
      fn(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }

  get status() {
    return this._status
  }

  set status(newStatus) {
    this._status = newStatus
    switch (newStatus) {
      case FULFILLED:
        // 执行resolve的时候，如果有缓存的成功回调，全部按顺序执行
        this.onFilFulledCallbacks.forEach((fn) => {
          fn(this.value)
        })
        break
      case REJECTED:
        // 执行reject的时候，如果有换成的失败回调，全部按顺序执行
        this.onRejectedCallbacks.forEach((fn) => {
          fn(this.reason)
        })
        break
    }
  }

  //   一个 promise 必须提供一个 then 方法以访问其当前值、终值和据因。
  then(onFulfilled, onRejected) {
    // 参数可选 并且不是函数将被忽略, 我们重写下两个方法，如果不是function就给个默认的function
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (value) => value
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : (error) => {
            throw error
          }

    const promise2 = new MyPromise((resolve, reject) => {
      const fulfilledMicrotask = () => {
        // 我们使用queueMicrotask，使其异步，并进入微任务队列
        queueMicrotask(() => {
          try {
            const x = onFulfilled(this.value)
            this.resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      const rejectedMicrotask = () => {
        queueMicrotask(() => {
          try {
            const x = onRejected(this.reason)
            this.resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      // 如果状态已经被改变，则直接调用
      if (this.status === FULFILLED) {
        fulfilledMicrotask()
      }
      if (this.status === REJECTED) {
        rejectedMicrotask()
      }
      // 如果状态还未改变，缓存到数组中
      if (this.status === PENDING) {
        this.onFilFulledCallbacks.push(fulfilledMicrotask)
        this.onRejectedCallbacks.push(rejectedMicrotask)
      }
    })
    //then 方法可以被同一个 promise 调用多次
    return promise2
  }

  catch(onRejected) {
    return this.then(null, onRejected)
  }

  static resolve(value) {
    if (value instanceof MyPromise) return value
    if (typeof value === 'object' || typeof value === 'function') {
      try {
        let then = value.then
        if (typeof then === 'function') {
          return new MyPromise(then.call(value))
        }
      } catch (e) {
        return new MyPromise((resolve, reject) => {
          reject(e)
        })
      }
    }
    return new MyPromise((resolve) => {
      resolve(value)
    })
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason)
    })
  }

  static race(promiseList) {
    if (!Array.isArray(promiseList)) {
      return new TypeError(`${promiseList}需要是数组`)
    }
    return new MyPromise((resolve, reject) => {
      if (!promiseList.length) return
      for (let i = 0; i < promiseList.length; i++) {
        MyPromise.resolve(promiseList[i]).then(resolve, reject)
      }
    })
  }

  static all (promiseList) {
    if (!Array.isArray(promiseList)) {
      return new TypeError(`${promiseList}需要是数组`)
    }
    return new MyPromise((resolve, reject) => {
      if (!promiseList.length) return
      let resultArr = []
      let count = 0
      for (let i = 0; i < promiseList.length; i++) {
        MyPromise.resolve(promiseList[i]).then((res) => {
          resultArr[i] = res
          if (++count === promiseList.length) {
            resolve(resultArr)
          }
        }, reject)
      }
    })
  }

  // 如果返回一个 promise 会等待这个 promise 也执行完毕。
  // 如果返回的是成功的 promise，会采用上一次的结果；
  // 如果返回的是失败的 promise，会用这个失败的结果，传到 catch 中。
  finally(callback) {
    return this.then(
      (value) => Promise.resolve(callback()).then(() => value),
      (reason) =>
        Promise.resolve(callback()).then(() => {
          throw reason
        })
    )
  }

  resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) {
      // 如果 promise 和 x 指向同一对象，以 TypeError 为据因拒绝执行 promise
      return reject(new TypeError('循环引用'))
    }
    if (x instanceof MyPromise) {
      // 如果 x 为 Promise ，则使 promise 接受 x 的状态
      // 如果 x 处于等待态， promise 需保持为等待态直至 x 被执行或拒绝
      queueMicrotask(() => {
        if (x.status === PENDING) {
          x.then((y) => {
            this.resolvePromise(promise2, y, resolve, reject)
          }, reject)
        } else {
          // 如果 x 处于执行态，用相同的值执行 promise
          // 如果 x 处于拒绝态，用相同的据因拒绝 promise
          x.then(resolve, reject)
        }
      })
    } else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
      // 确保x为引用类型， 如果 x 为对象或者函数，
      // 如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
      // 我们声明一个called防止多次调用
      let called = false
      try {
        // 把 x.then 赋值给 then
        let then = x.then
        if (typeof then === 'function') {
          // 如果 then 是函数，将 x 作为函数的作用域 this 调用之。传递两个回调函数作为参数，
          // 第一个参数叫做 resolvePromise ，第二个参数叫做 rejectPromise:
          // then.call(x, resolvePromise, rejectPromise)
          // 如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)
          // 如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise
          then.call(
            x,
            (y) => {
              if (called) return
              called = true
              this.resolvePromise(promise2, y, resolve, reject)
            },
            (r) => {
              if (called) return
              called = true
              reject(r)
            }
          )
        } else {
          // 如果 then 不是函数，以 x 为参数执行 promise
          resolve(x)
        }
      } catch (e) {
        // 如果取 x.then 的值时抛出错误 e ，则以 e 为据因拒绝 promise
        // 如果调用 then 方法抛出了异常 e : 如果 resolvePromise 或 rejectPromise 已经被调用，则忽略之
        if (called) return
        called = true
        reject(e)
      }
    } else {
      // 如果 x 不为对象或者函数，以 x 为参数执行 promise
      resolve(x)
    }
  }
}
