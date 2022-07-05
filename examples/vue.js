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

Vue.prototype.$mount = function (el) {
  // parent
  const parent = document.querySelector(el)
  // data
  // const data = this._data

  const updateComponent = () => {
    // 先清空宿主
    parent.innerHTML = ''
    // append
    const node = this.$options.render.call(this)
    parent.appendChild(node)
  }

  // 创建Watcher实例，作为组件渲染Watcher
  new Watcher(this, updateComponent)
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
    } else {
      // object
      this.walk(value)
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

class Watcher {
  constructor(vm, expOrFn) {
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
    this.get()
  }
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
  const ob = obj.__ob__
  delete obj[key]
  if (ob) {
    ob.dep.notify()
  }
}