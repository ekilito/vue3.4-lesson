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

const preCleanEffect = (effect) => {
  effect._depsLength = 0;
  effect._trackId++; // 每次执行id都是加1，如果当前同一个 effect 执行，id 就是相同的
};

const postCleanEffect = (effect) => {
  // [flag,age,xxx,aaa,bbb]
  // [flag]
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length, i++; ) {
      // 删除映射表中对应的 effect
      cleanDepEffect(effect.deps[i], effect);
    }
    // 更新依赖列表的长度
    effect.deps.length = effect._depsLength;
  }
};

// effectScope.stop() 停止所有的effect 不参加响应式处理
class ReactiveEffect {
  _trackId = 0; // 用于记录当前 effect 执行了几次
  deps = []; // 记录存放了哪些依赖
  _depsLength = 0; // 存放依赖数组的个数

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

      // effect 重新执行前，需要将上一次的依赖清空 effect.deps
      preCleanEffect(this);

      return this.fn(); // 依赖收集 => state.age
    } finally {
      postCleanEffect(this);
      activeEffect = lastEffect;
    }
  }
  stop() {
    this.active = false;
  }
}

// 双向记忆

// 1. _trackId 用于记录执行次数(防止一个属性在当前effect 中多次依赖收集) 只收集一次
// 2. 拿到上一次依赖的最后一个和这次的比较
// { flag , name }
// { flag , age }

export const trackEffect = (effect, dep) => {
  // 收集时是一个个收集的
  // 需要重新的去收集依赖，将不需要的移除掉

  // console.log(dep.get(effect) , effect._trackId) undefined 1
  if (dep.get(effect) !== effect._trackId) {
    // 更新 id
    dep.set(effect, effect._trackId);

    // { flag , name }
    // { flag , age }

    let oldDep = effect.deps[effect._depsLength];

    // 如果没有存过
    if (oldDep !== dep) {
      if (oldDep) {
        // 删除掉旧的
        cleanDepEffect(oldDep, effect);
      }
      // 换成新的 永远按照本次最新的来存放
      effect.deps[effect._depsLength++] = dep;
    } else {
      effect._depsLength++;
    }
  }

  //  dep.set(effect, effect._trackId )
  //  // 让 effect 和 dep 关联起来
  //  effect.deps[effect._depsLength++] = dep
};

const cleanDepEffect = (oldDep, effect) => {
  oldDep.delete(effect);
  if (oldDep.size == 0) {
    oldDep.cleanup(); // 如果Map 为空，则删除这个属性
  }
};

export const triggerEffects = (dep) => {
  for (const effect of dep.keys()) {
    if (effect.scheduler) {
      effect.scheduler(); // effect.fun()
    }
  }
};

