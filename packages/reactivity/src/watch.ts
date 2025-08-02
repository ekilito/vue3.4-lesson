import { ReactiveEffect } from "./effect";

export const watch = (source, cb, options = {} as any) => {
  // watchEffect 也是基于doWatch 实现的
  return doWatch(source, cb, options);
};

// 控制 depth 已经当前遍历到了哪一层
const traverse = (source, depth , currentDepth = 0) => {};


const doWatch = (source, cb, { deep }) => {
  // source ? => getter

  const reactiveGetter = (source) => traverse(source, deep === false ? 1 : undefined);

  // 产生一个可以给ReactiveEffect 来使用的getter，需要对这个对象进行取值操作，会关联当前的 reactiveEffect
  let getter = () => reactiveGetter(source);

  new ReactiveEffect(getter, () => {
    cb();
  });
};

