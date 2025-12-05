import { proxyRefs, reactive } from '@vue/reactivity'
import { hasOwn, isFunction, ShapeFlags } from '@vue/shared'

export const createComponentInstance = (vnode: any, parent) => {
  const instance = {
    data: null, // 状态
    vnode, // n2 组件的虚拟节点
    subTree: null, // 子树
    isMounted: false, // 是否挂载完成
    update: null, // 组件的更新函数
    props: {},
    attrs: {},
    slots: {},
    propsOptions: vnode.type.props || {}, // 用户传递的 props 配置
    component: null,
    proxy: null, // 用来代理 props attrs data
    setupState: {}, // setup 返回的状态
    exposed: null, // 暴露给外部的属性
    parent, // 父组件实例
    provides: parent ? parent.provides : Object.create(null), // 依赖注入
  }

  return instance
}

// 初始化更新
const initProps = (instance, rawProps) => {
  const props = {}
  const attrs = {}
  const propsOptions = instance.propsOptions || {} // 用户在组件中定义的

  if (rawProps) {
    for (let key in rawProps) { // 用所有的来分裂
      const value = rawProps[key]
      // todo 校验类型
      if (key in propsOptions) {
        props[key] = value // props 不需要深度代理，组件不能更改props
      } else {
        attrs[key] = value
      }
    }
  }
  instance.attrs = attrs
  instance.props = reactive(props)
}

const publicProperty = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots,
  // ...
}

const handler = {
  get(target, key) {
    const { data, props, setupState } = target
    if (data && hasOwn(data, key)) {
      return data[key]
    } else if (props && hasOwn(props, key)) {
      return props[key]
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key]
    }
    const getter = publicProperty[key]; // 通过不同的策略来访问对应的方法
    if (getter) {
      return getter(target);
    }
  },
  // 对于一些无法修改的属性， $slots $attrs ... $slots => instance.slots
  set(target, key, value) {
    const { data, props, setupState } = target
    if (data && hasOwn(data, key)) {
      data[key] = value
    } else if (props && hasOwn(props, key)) {
      // props[key] = value
      console.warn("props are readonly")
      return false
    } else if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value
    }
    return true
  }
}

export const initSlots = (instance, children) => {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children;
  } else {
    instance.slots = {};
  }
}


export const setupComponent = (instance: any) => {
  const { vnode } = instance;
  // 赋值属性
  initProps(instance, vnode.props);
  initSlots(instance, vnode.children); // instance.slots = children;

  // 赋值代理对象
  instance.proxy = new Proxy(instance, handler)

  const { data = () => { }, render, setup } = vnode.type // type children props
  if (setup) {
    const setupContext = {
      //...
      slots: instance.slots,
      attrs: instance.attrs,
      emit(event: string, ...args: any[]) {
        const eventName = `on${event[0].toUpperCase() + event.slice(1)}`
        const handler = instance.vnode.props && instance.vnode.props[eventName]
        if (handler) {
          handler(...args)
        }
      },
      expose(exposed) {
        instance.exposed = exposed || {}
      }
    }
    setCurrentInstance(instance); // 设置当前实例
    const setupResult = setup(instance.props, setupContext);
    unsetCurrentInstance(); // 清除当前实例

    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else if (typeof setupResult === 'object') {
      instance.setupState = proxyRefs(setupResult); // 代理 refs
    }
  }
  if (!isFunction(data)) {
    console.warn("data option must be a function")
  } else {
    // data 中可以拿到 props
    instance.data = reactive(data.call(instance.proxy)); // 组件的状态
  }
  if (!instance.render) {
    instance.render = render;
  }
}

export let currentInstance = null;
// 获取当前实例
export const getCurrentInstance = () => {
  return currentInstance;
}

export const setCurrentInstance = (instance) => {
  currentInstance = instance;
}

export const unsetCurrentInstance = () => {
  currentInstance = null;
}