// mini-vue
function Vue(options) {
  this._init(options)
}

Vue.prototype._init = function (options) {
  this.$options = options
  // _init() -> member init -> beforeCreate -> state init -> created
  this.$parent = options.parent
  callHook(this, 'beforeCreate')
  // state init
  // ...
  callHook(this, 'created')
}

function callHook(vm, hook) {
  const hooks = vm.$options[hook]
  if (hooks) {
    hooks.call(vm)
  }
}

Vue.prototype.$mount = function(el) {
  // parent
  const parent = document.querySelector(el)

  // data
  const data = this.$options.data()
  
  // append
  const node = this.$options.render.call(data)
  parent.appendChild(node)
}