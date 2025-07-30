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

// packages/reactivity/src/reactiveEffect.ts
var track = (target, key) => {
  if (activeEffect) {
    console.log(key, activeEffect);
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
  reactive
};
//# sourceMappingURL=reactivity.js.map
