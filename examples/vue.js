// mini-vue
function Vue(options) {
  this._init(options)
}

Vue.prototype._init = function(options) {
  // options
  this.$options = options
  // member init
  this.$parent = options.parent
  //...
  // beforeCreate
  callHook(this, 'beforeCreate')
  // state init
  // ...
  // created
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