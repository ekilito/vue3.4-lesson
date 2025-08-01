import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";
import { isRef } from "./ref";

export const watch = (source, cb, options = {} as any) => {
  // watchEffect 也是基于doWatch 实现的
  return doWatch(source, cb, options);
};

export const watchEffect = (getter, options = {}) => {
  // 没有 cb 就是 watchEffect
  return doWatch(getter, null, options as any);
};

// 控制 depth 已经当前遍历到了哪一层
const traverse = (source, depth, currentDepth = 0, seen = new Set()) => {
  if (!isObject(source)) {
    return source;
  }
  if (depth) {
    if (currentDepth >= depth) {
      return source;
    }
    // 根据deep 属性来看是否深度
    currentDepth++;
  }
  if (seen.has(source)) {
    return source;
  }
  for (const key in source) {
    // seen.add(source);
    // 递归遍历
    traverse(source[key], depth, currentDepth, seen);
  }
  // 遍历就会触发每个属性的 getter
  return source;
};

const doWatch = (source, cb, { deep, immediate }) => {
  // source ? => getter

  const reactiveGetter = (source) => traverse(source, deep === false ? 1 : undefined);

  // 产生一个可以给ReactiveEffect 来使用的getter，需要对这个对象进行取值操作，会关联当前的 reactiveEffect
  let getter;

  if (isReactive(source)) {
    getter = () => reactiveGetter(source);
  } else if (isRef(source)) {
    getter = () => source.value;
  } else if (isFunction(source)) {
    getter = () => source();
  }

  let oldValue;

  let clean;
  const onCleanup = (fn) => {
    // 将清理函数保存起来
    clean = () => {
      fn();
      clean = null; // 清理掉
    };
  };


  const job = () => {
    if (cb) {
      const newValue = effect.run();

      if (clean) {
        // 如果有清理函数，先执行清理函数
        clean(); // 在执行回调前，先调用上一次的清理操作进行清理
      }

      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    } else {
      // watchEffect
      effect.run(); // 直接执行即可
    }
  };

  const effect = new ReactiveEffect(getter, job);

  if (cb) {
    if (immediate) {
      // 立即先执行一次用户的回调，传递新值和老值
      job();
    } else {
      oldValue = effect.run();
    }
  } else {
    // watchEffect
    effect.run(); // 直接执行即可
  }

  const unwatch = () => {
    console.log("unwatch");
    effect.stop();
  }

  return unwatch;
};

