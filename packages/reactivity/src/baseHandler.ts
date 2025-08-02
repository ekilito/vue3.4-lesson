import { isObject } from '@vue/shared';
import { activeEffect } from "./effect";
import { track, trigger } from "./reactiveEffect";
import { reactive } from "./reactive";
import { ReactiveFlags } from "./constants";

// proxy 需要搭配 Reflect 来使用
// (Reflect 作用： 可以在代码执行的时候修改代码执行时候的行为)

export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, recevier) {
    // recevier 是代理对象

    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

    // 当取值的时候，应该让响应式属性 和 effect 映射起来

    // 依赖收集
    // console.log("收集依赖", target , key)
    // 收集这个对象上的这个属性，和 effect 关联在一起
    track(target, key);
    // console.log(activeEffect, key)

    let res = Reflect.get(target, key, recevier);
    
    // 当取的值也是对象的时候，需要对这个对象再进行代理，递归代理
    if(isObject(res)) {
      return reactive(res)
    }

    return res
  },
  set(target, key, value, recevier) {
    // 找到属性，让对应的 effect 重新执行

    // 触发更新
    // console.log("触发更新",target , key , value);

    let oldValue = target[key];

    let result = Reflect.set(target, key, value, recevier);

    if (oldValue !== value) {
      // 触发更新
      trigger(target, key, value, oldValue);
    }

    return result;
  },
};

