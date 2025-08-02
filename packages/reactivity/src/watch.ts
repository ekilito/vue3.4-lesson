import { isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";

export const watch = (source, cb, options = {} as any) => {
  // watchEffect 也是基于doWatch 实现的
  return doWatch(source, cb, options);
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

const doWatch = (source, cb, { deep }) => {
  // source ? => getter

  const reactiveGetter = (source) => traverse(source, deep === false ? 1 : undefined);

  // 产生一个可以给ReactiveEffect 来使用的getter，需要对这个对象进行取值操作，会关联当前的 reactiveEffect
  let getter = () => reactiveGetter(source);

  let oldValue;

  const job = () => {
    const newValue = effect.run();
    cb(newValue, oldValue);
    oldValue = newValue;
  };

  const effect = new ReactiveEffect(getter, job);

  oldValue = effect.run();
};

