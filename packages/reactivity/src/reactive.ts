import { isObject } from "@vue/shared";
import { mutableHandlers, ReactiveFlags } from './baseHandler';

// 用于记录 代理后 的结果， 可以复用
const reactiveMap = new WeakMap();

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

export const reactive = (target) => {
  return createReactiveObject(target);
};