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

// effectScope.stop() 停止所有的effect 不参加响应式处理

class ReactiveEffect {
  _trackId = 0; // 用于记录当前 effect 执行了几次
  deps = []; // 记录存放了哪些依赖
  _depsLength = 0;  // 存放依赖数组的个数

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
  stop() {
    this.active = false
  }
}

// 双向记忆
export const trackEffect = (effect, dep) =>{
   dep.set(effect, effect._trackId )
   // 让 effect 和 dep 关联起来
   effect.deps[effect._depsLength++] = dep

}

export const triggerEffects = (dep) => {
  for(const effect of dep.keys()) {
    if(effect.scheduler) {
      effect.scheduler();  // effect.fun()
    }
  }
}