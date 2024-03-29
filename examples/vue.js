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

Vue.prototype.$createElement = (tag, data, children) => {
  // 根据tag处理元素和文本两种情况
  if (tag) {
    // element
    return { tag, data, children }
  } else {
    // text
    return { text: data }
  }
}

Vue.prototype.$mount = function (el) {
  // parent
  // const parent = document.querySelector(el)
  this.$el = document.querySelector(el)
  // data
  // const data = this._data

  const updateComponent = () => {
    // 先清空宿主
    // parent.innerHTML = ''
    // append
    // const node = this.$options.render.call(this)
    // parent.appendChild(node)

    // vnode实现
    const vnode = this.$options.render.call(this, this.$createElement)
    // createElm(vnode, parent)
    this._update(vnode)
  }

  // 创建Watcher实例，作为组件渲染Watcher
  new Watcher(this, updateComponent)
}

Vue.prototype._update = function(vnode) {
  // 获取上次计算出的vnode
  const prevVnode = this._vnode
  // 保存最新的计算结果
  this._vnode = vnode
  if (!prevVnode) {
    // init
    this.patch(this.$el, vnode)
  } else {
    // update
    this.patch(prevVnode, vnode)
  }
}

Vue.prototype.patch = function(oldVnode, vnode) {
  // 如果是真实dom传入，则走初始化
  if (oldVnode.nodeType) {
    // real element
    createElm(vnode, oldVnode)
  } else {
    // update
    patchVnode(oldVnode, vnode)
  }
}

function patchVnode(oldVnode, vnode) {
  // 更新目标dom
  const elm = vnode.elm = oldVnode.elm
  
  // 获取双方孩子元素
  const oldCh = oldVnode.children
  const ch = vnode.children

  if (isUndef(vnode.text)) {
    if (isDef(ch) && isDef(oldCh)) {
      // 双方都是子元素
      // diff: 比对传入的两组子元素
      updateChildren(elm, oldCh, ch)
    }
  } else if (oldVnode.text !== vnode.text) {
    // 双方都是文本且不相等
    elm.textContent = vnode.text
  }
}

function updateChildren(
  parentElm,
  oldCh,
  newCh
) {
  // 新旧首尾4个索引和对应节点
  let oldStartIdx = 0
  let newStartIdx = 0
  let oldEndIdx = oldCh.length - 1
  let oldStartVnode = oldCh[0]
  let oldEndVnode = oldCh[oldEndIdx]
  let newEndIdx = newCh.length - 1
  let newStartVnode = newCh[0]
  let newEndVnode = newCh[newEndIdx]
  // 查找相同节点时所需变量
  // oldKeyToIdx缓存节点key，优化查找速度；idxInOld保存查找节点索引；
  // vnodeToMove保存要更新节点；refElm是参考节点，节点应该移动的文职；
  let oldKeyToIdx, idxInOld, vnodeToMove, refElm

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      oldStartVnode = oldCh[++oldStartIdx] // Vnode has been moved left
    } else if (isUndef(oldEndVnode)) {
      oldEndVnode = oldCh[--oldEndIdx]
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(
        oldStartVnode,
        newStartVnode,
      )
      oldStartVnode = oldCh[++oldStartIdx]
      newStartVnode = newCh[++newStartIdx]
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(
        oldEndVnode,
        newEndVnode
      )
      oldEndVnode = oldCh[--oldEndIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // Vnode moved right
      patchVnode(
        oldStartVnode,
        newEndVnode
      )
      parentElm.insertBefore(oldStartVnode.elm, oldEndVnode.elm.nextSibling)
      oldStartVnode = oldCh[++oldStartIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // Vnode moved left
      patchVnode(
        oldEndVnode,
        newStartVnode
      )
      parentElm.insertBefore(oldEndVnode.elm, oldStartVnode.elm.nextSibling)
      oldEndVnode = oldCh[--oldEndIdx]
      newStartVnode = newCh[++newStartIdx]
    } else {
      if (isUndef(oldKeyToIdx))
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
      idxInOld = isDef(newStartVnode.key)
        ? oldKeyToIdx[newStartVnode.key]
        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
      if (isUndef(idxInOld)) {
        // New element
        createElm(
          newStartVnode,
          parentElm,
          oldStartVnode.elm,
        )
      } else {
        vnodeToMove = oldCh[idxInOld]
        patchVnode(
          vnodeToMove,
          newStartVnode
        )
        oldCh[idxInOld] = undefined

        parentElm.insertBefore(
          vnodeToMove.elm,
          oldStartVnode.elm
        )
      }
      newStartVnode = newCh[++newStartIdx]
    }
  }
  // 后续操作
  if (oldStartIdx > oldEndIdx) {
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
    for (; newStartIdx <= newEndIdx; ++newStartIdx) {
      createElm(
        vnodes[newStartIdx],
        parentElm,
        refElm
      )
    }
  } else if (newStartIdx > newEndIdx) {
    for (; oldStartIdx <= oldEndIdx; ++oldStartIdx) {
      const el = oldCh[oldStartIdx]
      const parent = el.parentNode
      // element may have already been removed due to v-html / v-text
      if (isDef(parent)) {
        parent.removeChild(el)
      }
    }
  }
}

function sameVnode(oldVnode, vnode) {
  return oldVnode.key === vnode.key && oldVnode.tag === vnode.tag
}
function createKeyToOldIdx(children, beginIdx, endIdx) {
  let i, key
  const map = {}
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key
    if (isDef(key)) map[key] = i
  }
  return map
}
function findIdxInOld(node, oldCh, start, end) {
  for (let i = start; i < end; i++) {
    const c = oldCh[i]
    if (isDef(c) && sameVnode(node, c)) return i
  }
}

function isUndef(v) {
  return v === undefined || v === null
}
function isDef(v) {
  return v !== undefined && v !== null
}

// 递归便利vnode，创建dom树，添加到parentElm上
function createElm(vnode, parentElm, refElm = null) {
  // 1.获取tag并创建元素
  const tag = vnode.tag
  // 2.获取children情况，递归处理它们
  const children = vnode.children
  // 3.处理属性
  const data = vnode.data

  if (tag) {
    // elm
    vnode.elm = document.createElement(tag, vnode)
    // 先递归处理子元素
    if (typeof children === 'string') {
      // 文本情况
      createElm({ text: children }, vnode.elm)
    } else if (Array.isArray(children)) {
      // 若干子元素
      for (const child of children) {
        createElm(child, vnode.elm)
      }
    }

    // 处理元素属性
    if (data) {
      // 对元素作setAttrubute()
      if (data.attrs) {
        for (const attr in data.attrs) {
          vnode.elm.setAttribute(attr, data.attrs[attr])
        }
      }
    }
    
    // parentElm.appendChild(vnode.elm)
  } else {
    // text
    vnode.elm = document.createTextNode(vnode.text)
    // parentElm.appendChild(vnode.elm)
  }
  parentElm.insertBefore(vnode.elm, refElm)
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