// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}

// packages/reactivity/src/effect.ts
var effect = (fn, options) => {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  return _effect;
};
var activeEffect;
var ReactiveEffect = class {
  // 默认创建的 effect 是响应式的
  // fn 用户编写的函数
  // 如果 fn 中依赖的数据发生变化后，需要重新调用 => run()
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this._trackId = 0;
    // 用于记录当前 effect 执行了几次
    this.deps = [];
    // 记录存放了哪些依赖
    this._depsLength = 0;
    // 存放依赖数组的个数
    this.active = true;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      return this.fn();
    } finally {
      activeEffect = lastEffect;
    }
  }
  stop() {
    this.active = false;
  }
};
var trackEffect = (effect2, dep) => {
  dep.set(effect2, effect2._trackId);
  effect2.deps[effect2._depsLength++] = dep;
};

// packages/reactivity/src/reactiveEffect.ts
var targetMap = /* @__PURE__ */ new WeakMap();
var createDep = (cleanup, key) => {
  const dep = /* @__PURE__ */ new Map();
  dep.cleanup = cleanup;
  dep.name = key;
  return dep;
};
var track = (target, key) => {
  if (activeEffect) {
    console.log(target, key, activeEffect);
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(
        key,
        dep = createDep(() => depsMap.delete(key), key)
        // 后面用于清理不需要的属性
      );
    }
    trackEffect(activeEffect, dep);
    console.log(targetMap);
  }
};

// packages/reactivity/src/baseHandler.ts
var mutableHandlers = {
  get(target, key, recevier) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    track(target, key);
    return Reflect.get(target, key, recevier);
  },
  set(target, key, value, recevier) {
    return Reflect.set(target, key, value, recevier);
  }
};

// packages/reactivity/src/reactive.ts
var reactiveMap = /* @__PURE__ */ new WeakMap();
var createReactiveObject = (target) => {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
    return target;
  }
  const exitsProxy = reactiveMap.get(target);
  if (exitsProxy) {
    return exitsProxy;
  }
  let proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
};
var reactive = (target) => {
  return createReactiveObject(target);
};
export {
  activeEffect,
  effect,
  reactive,
  trackEffect
};
//# sourceMappingURL=reactivity.js.map
