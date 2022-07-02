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
  while(i--) {
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

  // append
  const node = this.$options.render.call(this)
  parent.appendChild(node)
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
  // 递归处理
  observe(val)
  Object.defineProperty(obj, key, {
    get() {
      console.log('get', key);
      return val
    },
    set(newVal) {
      val = newVal
      console.log('set', key);
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
    new Observer(obj)
  }
  return ob
}

class Observer {
  constructor(value) {
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