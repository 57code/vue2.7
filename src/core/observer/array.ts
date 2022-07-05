/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { TriggerOpTypes } from '../../v3'
import { def } from '../util/index'

// 获取原始的数组原型
// 复制一份到arrayMethods
const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
// 扩展7个变更方法，使他们具有变更通知能力
methodsToPatch.forEach(function (method) {
  // cache original method
  // 获取原始操作函数
  const original = arrayProto[method]
  // 覆盖并扩展原始函数
  def(arrayMethods, method, function mutator(...args) {
    // 执行原来操作
    const result = original.apply(this, args)
    // 后面就是变更通知的实现
    const ob = this.__ob__
    // 以下三个方法可能有新元素添加进来
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 对新加入对象做响应式处理
    if (inserted) ob.observeArray(inserted)
    // notify change
    if (__DEV__) {
      ob.dep.notify({
        type: TriggerOpTypes.ARRAY_MUTATION,
        target: this,
        key: method
      })
    } else {
      ob.dep.notify()
    }
    return result
  })
})
