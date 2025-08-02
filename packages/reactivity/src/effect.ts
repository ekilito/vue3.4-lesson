import { DirtyLevels } from "./constants";

export const effect = (fn, options?) => {
  // 创建一个响应式 effect 数据变化后可以重新执行

  // 创建一个 effect，只要依赖的属性变化了就要执行回调
  const _effect = new ReactiveEffect(fn, () => {
    // scheduler 调度函数
    _effect.run();
  });

  _effect.run();

  if (options) {
    Object.assign(_effect, options); // 用用户传递的覆盖掉内置的
  }

  const runner = _effect.run.bind(_effect);
  runner.effect = _effect; // 可以在run方法上获取到effect的引用
  return runner; // 外界可以自己让其重新 run
};

export let activeEffect;

function preCleanEffect(effect) {
  effect._depsLength = 0;
  effect._trackId++; // 每次执行id 都是+1， 如果当前同一个effect执行，id就是相同的
}
function postCleanEffect(effect) {
  // [flag,a,b,c]
  // [flag]  -> effect._depsLength = 1
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect); // 删除映射表中对应的effect
    }
    effect.deps.length = effect._depsLength; // 更新依赖列表的长度
  }
}

// effectScope.stop() 停止所有的effect 不参加响应式处理
export class ReactiveEffect {
  _trackId = 0; // 用于记录当前 effect 执行了几次
  deps = []; // 记录存放了哪些依赖
  _depsLength = 0; // 存放依赖数组的个数
  _running = 0; // 是否正在运行
  _dirtyLevel = DirtyLevels.Dirty; // 默认是脏的，意味着需要重新执行 fn

  public active = true; // 默认创建的 effect 是响应式的
  // fn 用户编写的函数
  // 如果 fn 中依赖的数据发生变化后，需要重新调用 => run()
  constructor(public fn, public scheduler) {}

  public get dirty() {
    // 如果是脏的，意味着需要重新执行 fn
    return this._dirtyLevel === DirtyLevels.Dirty;
  }
  public set dirty(value) {
    // 设置脏值
    this._dirtyLevel = value ? DirtyLevels.Dirty : DirtyLevels.NoDirty;
  }

  // 脏的 => 获取最新的值 => 不脏的 (缓存结果)
  // 多次取值 （缓存结果）

  run() {
    this._dirtyLevel = DirtyLevels.NoDirty; // 每次运行后effect 变为no_dirty

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
      this._running++;
      return this.fn(); // 依赖收集 => state.age
    } finally {
      this._running--;
      postCleanEffect(this);
      activeEffect = lastEffect;
    }
  }
  stop() {
    if (this.active) {
      console.log("stop effect");
      this.active = false;
      preCleanEffect(this);
      postCleanEffect(this);
    }
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
  // dep:(name) => 收集计算属性 => 调用计算属性的 scheduler => 触发计算属性收集的effect
  for (const effect of dep.keys()) {
    // 如果当前这个值是不脏的，但是触发更新需要将值变为脏值
    // 属性依赖了计算属性，需要让计算属性的 dirty 在变为 true
    if (effect._dirtyLevel < DirtyLevels.Dirty) {
      effect._dirtyLevel = DirtyLevels.Dirty; // 变为脏值
    }

    // 如果不是正在执行，才能执行
    if (!effect._running) {
      if (effect.scheduler) {
        effect.scheduler(); // => effect.fun()
      }
    }
  }
};

