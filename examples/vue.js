// mini-vue
function Vue(options) {
  this._init(options)
}

Vue.prototype._init = function (options) {
  // options
  this.$options = options
  // member init
  this.$parent = options.parent
  //...
  // beforeCreate
  callHook(this, 'beforeCreate')
  // state init
  initState(this)
  // created
  callHook(this, 'created')
}

function initState(vm) {
  const opts = vm.$options
  // props
  // setup
  // methods
  // data
  if (opts.data) {
    initData(vm)
  }
  // computed
  // watch
}

function initData(vm) {
  // 获取data函数返回值
  const data = vm._data = vm.$options.data.call(vm, vm)

  // 遍历data中所有key，对它们做代理
  const keys = Object.keys(data)
  let i = keys.length
  while (i--) {
    const key = keys[i]
    proxy(vm, '_data', key)
  }
  // 对data做响应式
  observe(data)
}

function callHook(vm, hook) {
  const hooks = vm.$options[hook]
  if (hooks) {
    hooks.call(vm)
  }
}

// Vue.prototype._update = function() {}
// Vue.prototype._render = function() {
//   this.
// }
Vue.prototype.$createElement = (tag, data, children) => {
  if (tag) {
    return { tag, data, children }
  } else {
    return { text: data }
  }
}
Vue.prototype.$mount = function (el) {
  // parent
  const parent = document.querySelector(el)
  // data
  // const data = this._data

  const updateComponent = () => {
    // 先清空宿主
    parent.innerHTML = ''
    // append
    // const node = this.$options.render.call(this)
    // parent.appendChild(node)

    const vnode = this.$options.render.call(this, this.$createElement)
    createElm(vnode, parent)
  }

  // 创建Watcher实例，作为组件渲染Watcher
  new Watcher(this, updateComponent)
}

function createElm(vnode, parentElm) {
  const data = vnode.data
  const children = vnode.children
  const tag = vnode.tag

  if (tag) {
    vnode.elm = document.createElement(tag, vnode)

    // 元素节点才有属性
    if (data) {
      // 用户设置了节点特性，则对节点执行setAttribute()操作
      if (data.attrs) {
        for (const attr in data.attrs) {
          vnode.elm.setAttribute(attr, data.attrs[attr])
        }
      }
    }
    
    // 递归处理子元素
    if (Array.isArray(children)) {
      for (const child of children) {
        createElm(child, vnode.elm)
      }
    } else {
      // text
      createElm({text: children}, vnode.elm)
    }
    
    parentElm.appendChild(vnode.elm)
  } else {
    vnode.elm = document.createTextNode(vnode.text)
    parentElm.appendChild(vnode.elm)
  }
}

// 代理指定对象的某个key到souceKey上
function proxy(target, sourceKey, key) {
  Object.defineProperty(target, key, {
    get() {
      return this[sourceKey][key]
    },
    set(val) {
      this[sourceKey][key] = val
    }
  })
}

// 将传入的obj，key做拦截，从而实现响应式
function defineReactive(obj, key, val = {}) {
  const dep = new Dep()

  // 递归处理
  const childOb = observe(val)
  Object.defineProperty(obj, key, {
    get() {
      console.log('get', key);
      // 测试依赖收集目标是否存在
      if (Dep.target) {
        dep.depend()
        console.log(dep.subs);
        // 嵌套对象的Observer实例中的dep也要和Watcher建立依赖关系
        if (childOb) {
          childOb.dep.depend()
          console.log('childOb dep', childOb.dep.subs);
          // 对数组做额外依赖收集
          if (Array.isArray(val)) {
            dependArray(val)
          }
        }
      }
      return val
    },
    set(newVal) {
      val = newVal
      console.log('set', key);
      // 变更通知
      dep.notify()
    }
  })
}

// 数组内所有对象都需要做依赖收集
function dependArray(items) {
  for (const item of items) {
    if (item && item.__ob__) {
      // 这个项是响应式对象，则对其半生ob内部的dep做依赖收集
      item.__ob__.dep.depend()
    }
    // 如果item又是数组，向下递归
    if (Array.isArray(item)) {
      dependArray(item)
    }
  }
}

function observe(obj) {
  // 传入的必须是对象
  if (!(obj !== null && typeof obj === 'object')) {
    return
  }

  // 创建的Observer实例，以防重复创建，我们先判断是否
  // 存在__ob__属性，存在则直接返回
  let ob
  if (Object.prototype.hasOwnProperty.call(obj, '__ob__')) {
    ob = value.__ob__
  } else {
    ob = new Observer(obj)
  }
  return ob
}

class Observer {
  constructor(value) {
    // 创建一个半生的Dep实例
    this.dep = new Dep()

    // 定义__ob__属性
    Object.defineProperty(value, '__ob__', {
      value: this,
      enumerable: false,
      writable: true,
      configurable: true
    })
    if (Array.isArray(value)) {
      // array
      // 覆盖数组实例的原型
      value.__proto__ = arrayMethods
      // 对当前数组实例做响应式
      this.observeArray(value)
    } else {
      // object
      this.walk(value)
    }
  }

  // 遍历数组内部所有项，对它们做响应式处理
  observeArray(items) {
    for (const item of items) {
      observe(item)
    }
  }

  walk(obj) {
    // 循环value对象所有key，依次进行拦截
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const val = obj[key]
      // 响应式处理
      defineReactive(obj, key, val)
    }
  }
}

let wid = 0
class Watcher {
  constructor(vm, expOrFn) {
    this.id = ++wid
    this.vm = vm
    this.getter = expOrFn

    // 保存管理的所有deps
    this.newDepIds = new Set()
    this.newDeps = []

    // 立刻触发getter函数执行
    this.get()
  }
  get() {
    // 0.设置依赖目标
    Dep.target = this
    const vm = this.vm
    // 1.调用getter
    try {
      this.getter.call(vm, vm)
    } catch (error) {
      throw error
    } finally {
      // 执行结束，还原依赖目标
      Dep.target = undefined
    }
  }
  addDep(dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)

      // 反过来将自己添加到dep中
      dep.addSub(this)
    }
  }
  update() {
    // this.get()
    // 异步更新
    // 排队
    queueWatcher(this)
  }
  run() {
    this.get()
  }
}
const queue = [] // 存放待执行watcher
const has = {}
let waiting = false
function queueWatcher(watcher) {
  const id = watcher.id
  // 去重
  if (has[id] != null) {
    return
  }
  // 不存在才入队
  queue.push(watcher)
  if (!waiting) {
    waiting = true
    // 异步执行flushSchedulerQueue
    nextTick(flushSchedulerQueue)
  }
}

const callbacks = [] // 用于存放异步任务
let pending = false
const timerFunc = () => Promise.resolve().then(flushCallbacks)
function nextTick(cb) {
  // 1.将cb存入callbacks数组中
  callbacks.push(cb)
  if (!pending) {
    pending = true
    // 异步启动
    timerFunc()
  }
}

function flushCallbacks() {
  pending = false

  const copies = callbacks.slice(0)
  callbacks.length = 0

  for (const cb of copies) {
    cb()
  }
}

let flushing = false
function flushSchedulerQueue() {
  let id
  flushing = true
  for (const watcher of queue) {
    // 去掉id，去重失效了
    id = watcher.id
    has[id] = null
    // 真正的更新函数被调用
    watcher.run()
  }

  // 还原状态标识符
  flushing = waiting = false
}

let uid = 0
class Dep {
  constructor() {
    this.id = uid++
    this.subs = []
  }
  // 通知Watch添加自己
  // 从而建立当前dep和watcher之间的关系
  depend() {
    Dep.target.addDep(this)
  }
  addSub(watcher) {
    this.subs.push(watcher)
  }
  notify() {
    for (const sub of this.subs) {
      sub.update()
    }
  }
}

// 全局注册api
Vue.set = set
Vue.delete = del
// 实例api
Vue.prototype.$set = set
Vue.prototype.$delete = del

function set(obj, key, val) {
  // 如果是数组的话, 可能需要扩容
  if (Array.isArray(obj)) {
    // 获取key和length之间的较大者，并对length扩容
    obj.length = Math.max(obj.length, key)
    obj.splice(key, 1, val)
    // 由于splice操作会自动通知更新，因此直接跳出
    return val
  }

  const ob = obj.__ob__
  if (!ob) {
    // 是普通对象
    obj[key] = val
  } else {
    // 1.设置动态属性拦截
    defineReactive(obj, key, val)
    // 2.变更通知
    ob.dep.notify()
  }
}
function del(obj, key) {
  // 数组直接删除该元素并跳出
  if (Array.isArray(obj)) {
    obj.splice(key, 1)
    return
  }

  const ob = obj.__ob__
  delete obj[key]
  if (ob) {
    ob.dep.notify()
  }
}

// 获取数组原型，做一份克隆
const arrayProto = Array.prototype
const arrayMethods = Object.create(arrayProto)
// 列出7个变更方法
const methodsToPatch = [
  'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'
]
// 扩展这7个方法，使之能够做变更通知
methodsToPatch.forEach(function (method) {
  // 原始方法
  const original = arrayProto[method]
  // 覆盖原始函数
  Object.defineProperty(arrayMethods, method, {
    value: function mutator(...args) {
      // 执行原始操作
      const result = original.apply(this, args)
      // 扩展：增加变更通知能力
      const ob = this.__ob__
      // 判断是否插入新元素进来
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
      if (inserted) {
        // 对它执行响应式处理
        ob.observeArray(inserted)
      }
      // 变更通知
      ob.dep.notify()
      return result
    }
  })
})