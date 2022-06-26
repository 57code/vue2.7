// 导入Vue构造函数
import Vue from './runtime-with-compiler'
// 扩展的vue3相关接口
import * as vca from 'v3'
// 扩展工具方法
import { extend } from 'shared/util'

// 扩展Vue，拥有vca能力
extend(Vue, vca)

// 导入副作用函数，挂在Vue构造函数，作为静态方法
import { effect } from 'v3/reactivity/effect'
Vue.effect = effect

export default Vue
