export const effect = (fn, options?) => {
  // 创建一个响应式 effect 数据变化后可以重新执行

  // 创建一个 effect，只要依赖的属性变化了就要执行回调
  const _effect = new ReactiveEffect(fn, () => {
    // scheduler 调度函数
    _effect.run();
  });

  _effect.run();

  return _effect;
};

export let activeEffect;

class ReactiveEffect {
  public active = true; // 默认创建的 effect 是响应式的
  // fn 用户编写的函数
  // 如果 fn 中依赖的数据发生变化后，需要重新调用 => run()
  constructor(public fn, public scheduler) {}
  run() {
    // 让 fn 执行
    if (!this.active) {
      // 不是激活的，执行后，什么都不用做 不用做额外的处理
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      return this.fn(); // 依赖收集 => state.age
    } finally {
      activeEffect = lastEffect;
    }
  }
}

