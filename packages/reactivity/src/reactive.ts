import { isObject } from "@vue/shared";

// 用于记录 代理后 的结果， 可以复用
const reactiveMap = new WeakMap();

enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive' // 基本上唯一
}

const mutableHandlers: ProxyHandler<any> = {
  get(target, key, recevier) {
    if(key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
  },
  set(target, key, value, recevier) {
    return true;
  },
};

export const reactive = (target) => {
  return createReactiveObject(target);
};

const createReactiveObject = (target) => {
  // 统一做判断，响应式对象必须是对象才可以
  if (!isObject(target)) {
    return target;
  }

  if(target[ReactiveFlags.IS_REACTIVE]) {
     return target
  }

  // 取缓存，如果有直接返回
  const exitsProxy = reactiveMap.get(target);
  if (exitsProxy) {
    return exitsProxy;
  }

  let proxy = new Proxy(target, mutableHandlers);
  // 根据对象缓存， 代理后的结果
  reactiveMap.set(target, proxy);
  return proxy;
};

