import { isObject } from "@vue/shared";
import { mutableHandlers } from './baseHandler';
import { ReactiveFlags } from "./constants";

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

// 主要做一件事，传reactive之后，把对象变成响应式的？
// 核心 new Proxy 
// 防止一个对象被重复的被代理 new WeakMap放到缓存里 取值的时候如果缓存里有 取来用 
// 如果返回的代理对象再一次被代理 直接返回

export const toReactive = (value) => {
  return isObject(value) ? reactive(value) : value;
}

// 判断一个对象是否是响应式的
export function isReactive(value) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}