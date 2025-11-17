import { proxyRefs, reactive } from '@vue/reactivity'
import { hasOwn, isFunction } from '@vue/shared'

export const createComponentInstance = (vnode: any) => {
  const instance = {
    data: null, // 状态
    vnode, // n2 组件的虚拟节点
    subTree: null, // 子树
    isMounted: false, // 是否挂载完成
    update: null, // 组件的更新函数
    props: {},
    attrs: {},
    propsOptions: vnode.type.props || {}, // 用户传递的 props 配置
    component: null,
    proxy: null, // 用来代理 props attrs data
    setupState: {}, // setup 返回的状态
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


export const setupComponent = (instance: any) => {
  const { vnode } = instance;
  // 赋值属性
  initProps(instance, vnode.props);
  // 赋值代理对象
  instance.proxy = new Proxy(instance, handler)

  const { data = () => { }, render, setup } = vnode.type // type children props
  if (setup) {
    const setupContext = {

    }
    const setupResult = setup(instance.props, setupContext);

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