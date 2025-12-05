// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  // 如果第三个元素不传递 === appendChild
  insert: (el, parent, anchor) => parent.insertBefore(el, anchor || null),
  // appendChild  parent.insertBefore(el,null)
  remove(el) {
    const parent = el.parentNode;
    parent && parent.removeChild(el);
  },
  createElement: (type) => document.createElement(type),
  createText: (text) => document.createTextNode(text),
  setText: (node, text) => node.nodeValue = text,
  // 设置文本
  setElementText: (el, text) => el.textContent = text,
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling
};

// packages/runtime-dom/src/modules/patchAttr.ts
function patchAttr(el, key, value) {
  if (value == null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}

// packages/runtime-dom/src/modules/patchClass.ts
function patchClass(el, value) {
  if (value == null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
}

// packages/runtime-dom/src/modules/patchEvent.ts
function createInvoker(value) {
  const invoker = (e) => invoker.value(e);
  invoker.value = value;
  return invoker;
}
function patchEvent(el, name, nextValue) {
  const invokers = el._vei || (el._vei = {});
  const eventName = name.slice(2).toLowerCase();
  const exisitingInvokers = invokers[name];
  if (nextValue && exisitingInvokers) {
    return exisitingInvokers.value = nextValue;
  }
  if (nextValue) {
    const invoker = invokers[name] = createInvoker(nextValue);
    return el.addEventListener(eventName, invoker);
  }
  if (exisitingInvokers) {
    el.removeEventListener(eventName, exisitingInvokers);
    invokers[name] = void 0;
  }
}

// packages/runtime-dom/src/modules/patchStyle.ts
function patchStyle(el, prevValue, nextValue) {
  let style = el.style;
  for (let key in nextValue) {
    style[key] = nextValue[key];
  }
  if (prevValue) {
    for (let key in prevValue) {
      if (nextValue) {
        if (nextValue[key] == null) {
          style[key] = null;
        }
      }
    }
  }
}

// packages/runtime-dom/src/patchProp.ts
function patchProp(el, key, prevValue, nextValue) {
  if (key === "class") {
    return patchClass(el, nextValue);
  } else if (key === "style") {
    return patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    return patchEvent(el, key, nextValue);
  } else {
    return patchAttr(el, key, nextValue);
  }
}

// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function isFunction(value) {
  return typeof value == "function";
}
function isString(value) {
  return typeof value == "string";
}
var hasOwnProperty = Object.prototype.hasOwnProperty;
var hasOwn = (value, key) => hasOwnProperty.call(value, key);

// packages/runtime-core/src/components/Teleport.ts
var Teleport = {
  __isTeleport: true,
  remove(vnode, unmountChildren) {
    const { shapeFlag, children } = vnode;
    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      unmountChildren(children);
    }
  },
  process(n1, n2, container, anchor, parentComponent, internals) {
    let { mountChildren, patchChildren, move } = internals;
    if (!n1) {
      const target = n2.target = document.querySelector(n2.props.to);
      if (target) {
        mountChildren(n2.children, target, parentComponent);
      }
    } else {
      patchChildren(n1, n2, n2.target, parentComponent);
      if (n2.props.to !== n1.props.to) {
        const nextTarget = document.querySelector(n2.props.to);
        n2.children.forEach((child) => move(child, nextTarget, anchor));
      }
    }
  }
};
var isTeleport = (value) => value.__isTeleport;

// packages/runtime-core/src/createVnode.ts
var isVnode = (value) => {
  return value?.__v_isVnode;
};
var isSameVnode = (n1, n2) => {
  return n1.type === n2.type && n1.key === n2.key;
};
var Text = Symbol("Text");
var Fragment = Symbol("Fragment");
var createVnode = (type, props, children) => {
  const shapeFlag = isString(type) ? 1 /* ELEMENT */ : isTeleport(type) ? 64 /* TELEPORT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : isFunction(type) ? 2 /* FUNCTIONAL_COMPONENT */ : 0;
  const vnode = {
    __v_isVnode: true,
    // 表示是 虚拟节点
    type,
    props,
    children,
    key: props?.key,
    // diff 算法中后面需要的 key
    el: null,
    // 虚拟节点需要对应的真实节点是谁
    shapeFlag,
    ref: props?.ref
  };
  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag |= 16 /* ARRAY_CHILDREN */;
    } else if (isObject(children)) {
      vnode.shapeFlag |= 32 /* SLOTS_CHILDREN */;
    } else {
      children = String(children);
      vnode.shapeFlag |= 8 /* TEXT_CHILDREN */;
    }
  }
  return vnode;
};

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  let l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      } else {
        return createVnode(type, propsOrChildren);
      }
    }
    return createVnode(type, null, propsOrChildren);
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    }
    if (l == 3 && isVnode(children)) {
      children = [children];
    }
    return createVnode(type, propsOrChildren, children);
  }
}

// packages/runtime-core/src/seq.ts
function getSequence(arr) {
  const result = [0];
  const p = result.slice(0);
  let start;
  let end;
  let middle;
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      let resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        p[i] = result[result.length - 1];
        result.push(i);
        continue;
      }
    }
    start = 0;
    end = result.length - 1;
    while (start < end) {
      middle = (start + end) / 2 | 0;
      if (arr[result[middle]] < arrI) {
        start = middle + 1;
      } else {
        end = middle;
      }
    }
    if (arrI < arr[result[start]]) {
      p[i] = result[start - 1];
      result[start] = i;
    }
  }
  let l = result.length;
  let last = result[l - 1];
  while (l-- > 0) {
    result[l] = last;
    last = p[last];
  }
  return result;
}

// packages/reactivity/src/effect.ts
var effect = (fn, options) => {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  if (options) {
    Object.assign(_effect, options);
  }
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
};
var activeEffect;
function preCleanEffect(effect2) {
  effect2._depsLength = 0;
  effect2._trackId++;
}
function postCleanEffect(effect2) {
  if (effect2.deps.length > effect2._depsLength) {
    for (let i = effect2._depsLength; i < effect2.deps.length; i++) {
      cleanDepEffect(effect2.deps[i], effect2);
    }
    effect2.deps.length = effect2._depsLength;
  }
}
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
    this._running = 0;
    // 是否正在运行
    this._dirtyLevel = 4 /* Dirty */;
    // 默认是脏的，意味着需要重新执行 fn
    this.active = true;
  }
  get dirty() {
    return this._dirtyLevel === 4 /* Dirty */;
  }
  set dirty(value) {
    this._dirtyLevel = value ? 4 /* Dirty */ : 0 /* NoDirty */;
  }
  // 脏的 => 获取最新的值 => 不脏的 (缓存结果)
  // 多次取值 （缓存结果）
  run() {
    this._dirtyLevel = 0 /* NoDirty */;
    if (!this.active) {
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      preCleanEffect(this);
      this._running++;
      return this.fn();
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
};
var trackEffect = (effect2, dep) => {
  if (dep.get(effect2) !== effect2._trackId) {
    dep.set(effect2, effect2._trackId);
    let oldDep = effect2.deps[effect2._depsLength];
    if (oldDep !== dep) {
      if (oldDep) {
        cleanDepEffect(oldDep, effect2);
      }
      effect2.deps[effect2._depsLength++] = dep;
    } else {
      effect2._depsLength++;
    }
  }
};
var cleanDepEffect = (oldDep, effect2) => {
  oldDep.delete(effect2);
  if (oldDep.size == 0) {
    oldDep.cleanup();
  }
};
var triggerEffects = (dep) => {
  for (const effect2 of dep.keys()) {
    if (effect2._dirtyLevel < 4 /* Dirty */) {
      effect2._dirtyLevel = 4 /* Dirty */;
    }
    if (!effect2._running) {
      if (effect2.scheduler) {
        effect2.scheduler();
      }
    }
  }
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
  }
};
var trigger = (target, key, newValue, oldValue) => {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let dep = depsMap.get(key);
  if (dep) {
    triggerEffects(dep);
  }
};

// packages/reactivity/src/baseHandler.ts
var mutableHandlers = {
  get(target, key, recevier) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    track(target, key);
    let res = Reflect.get(target, key, recevier);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, recevier) {
    let oldValue = target[key];
    let result = Reflect.set(target, key, value, recevier);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return result;
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
var toReactive = (value) => {
  return isObject(value) ? reactive(value) : value;
};
function isReactive(value) {
  return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
}

// packages/reactivity/src/ref.ts
var ref = (value) => {
  return createRef(value);
};
var createRef = (value) => {
  return new RefImpl(value);
};
var RefImpl = class {
  // 用于收集对应的 effect
  constructor(rawValue) {
    this.rawValue = rawValue;
    this.__v_isRef = true;
    this._value = toReactive(rawValue);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue;
      this._value = newValue;
      triggerRefValue(this);
    }
  }
};
var trackRefValue = (ref2) => {
  if (activeEffect) {
    trackEffect(activeEffect, ref2.dep = ref2.dep || createDep(() => ref2.dep = void 0, "undefined"));
  }
};
var triggerRefValue = (ref2) => {
  let dep = ref2.dep;
  if (dep) {
    triggerEffects(dep);
  }
};
var toRef = (object, key) => {
  return new ObjectRefImpl(object, key);
};
var ObjectRefImpl = class {
  // 增加 ref 标识
  constructor(_object, _key) {
    this._object = _object;
    this._key = _key;
    this.__v_isRef = true;
  }
  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
};
var toRefs = (object) => {
  const result = {};
  for (const key in object) {
    result[key] = toRef(object, key);
  }
  return result;
};
var proxyRefs = (objectWithRef) => {
  return new Proxy(objectWithRef, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      return value && value.__v_isRef ? value.value : value;
    },
    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key, receiver);
      if (oldValue && oldValue.__v_isRef) {
        return oldValue.value = value;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    }
  });
};
var isRef = (value) => {
  return !!(value && value.__v_isRef);
};

// packages/reactivity/src/computed.ts
var computed = (getterOrOptions) => {
  let onlyGetter = isFunction(getterOrOptions);
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
};
var ComputedRefImpl = class {
  constructor(getter, setter) {
    this.setter = setter;
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      // 用户写的 fn: (() => state.name) （会访问 state.name, 变化之后 会执行第二个函数）
      () => {
        triggerRefValue(this);
      }
    );
  }
  //  让计算属性收集对应的 effect
  get value() {
    if (this.effect.dirty) {
      this._value = this.effect.run();
      trackRefValue(this);
    }
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue);
  }
};

// packages/reactivity/src/watch.ts
var watch = (source, cb, options = {}) => {
  return doWatch(source, cb, options);
};
var watchEffect = (getter, options = {}) => {
  return doWatch(getter, null, options);
};
var traverse = (source, depth, currentDepth = 0, seen = /* @__PURE__ */ new Set()) => {
  if (!isObject(source)) {
    return source;
  }
  if (depth) {
    if (currentDepth >= depth) {
      return source;
    }
    currentDepth++;
  }
  if (seen.has(source)) {
    return source;
  }
  for (const key in source) {
    traverse(source[key], depth, currentDepth, seen);
  }
  return source;
};
var doWatch = (source, cb, { deep, immediate }) => {
  const reactiveGetter = (source2) => traverse(source2, deep === false ? 1 : void 0);
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
    clean = () => {
      fn();
      clean = null;
    };
  };
  const job = () => {
    if (cb) {
      const newValue = effect2.run();
      if (clean) {
        clean();
      }
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    } else {
      effect2.run();
    }
  };
  const effect2 = new ReactiveEffect(getter, job);
  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect2.run();
    }
  } else {
    effect2.run();
  }
  const unwatch = () => {
    console.log("unwatch");
    effect2.stop();
  };
  return unwatch;
};

// packages/runtime-core/src/scheduler.ts
var queue = [];
var isFlushing = false;
var resolvePromise = Promise.resolve();
var queueJob = (job) => {
  console.log("job => ", job);
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    resolvePromise.then(() => {
      isFlushing = false;
      const copy = queue.slice(0);
      queue.length = 0;
      copy.forEach((job2) => job2());
      copy.length = 0;
    });
  }
};

// packages/runtime-core/src/component.ts
var createComponentInstance = (vnode) => {
  const instance = {
    data: null,
    // 状态
    vnode,
    // n2 组件的虚拟节点
    subTree: null,
    // 子树
    isMounted: false,
    // 是否挂载完成
    update: null,
    // 组件的更新函数
    props: {},
    attrs: {},
    slots: {},
    propsOptions: vnode.type.props || {},
    // 用户传递的 props 配置
    component: null,
    proxy: null,
    // 用来代理 props attrs data
    setupState: {},
    // setup 返回的状态
    exposed: null
    // 暴露给外部的属性
  };
  return instance;
};
var initProps = (instance, rawProps) => {
  const props = {};
  const attrs = {};
  const propsOptions = instance.propsOptions || {};
  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key];
      if (key in propsOptions) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  instance.attrs = attrs;
  instance.props = reactive(props);
};
var publicProperty = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots
  // ...
};
var handler = {
  get(target, key) {
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    }
    const getter = publicProperty[key];
    if (getter) {
      return getter(target);
    }
  },
  // 对于一些无法修改的属性， $slots $attrs ... $slots => instance.slots
  set(target, key, value) {
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (props && hasOwn(props, key)) {
      console.warn("props are readonly");
      return false;
    } else if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value;
    }
    return true;
  }
};
var initSlots = (instance, children) => {
  if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
    instance.slots = children;
  } else {
    instance.slots = {};
  }
};
var setupComponent = (instance) => {
  const { vnode } = instance;
  initProps(instance, vnode.props);
  initSlots(instance, vnode.children);
  instance.proxy = new Proxy(instance, handler);
  const { data = () => {
  }, render: render2, setup } = vnode.type;
  if (setup) {
    const setupContext = {
      //...
      slots: instance.slots,
      attrs: instance.attrs,
      emit(event, ...args) {
        const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
        const handler2 = instance.vnode.props && instance.vnode.props[eventName];
        if (handler2) {
          handler2(...args);
        }
      },
      expose(exposed) {
        instance.exposed = exposed || {};
      }
    };
    setCurrentInstance(instance);
    const setupResult = setup(instance.props, setupContext);
    unsetCurrentInstance();
    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else if (typeof setupResult === "object") {
      instance.setupState = proxyRefs(setupResult);
    }
  }
  if (!isFunction(data)) {
    console.warn("data option must be a function");
  } else {
    instance.data = reactive(data.call(instance.proxy));
  }
  if (!instance.render) {
    instance.render = render2;
  }
};
var currentInstance = null;
var getCurrentInstance = () => {
  return currentInstance;
};
var setCurrentInstance = (instance) => {
  currentInstance = instance;
};
var unsetCurrentInstance = () => {
  currentInstance = null;
};

// packages/runtime-core/src/apiLifecycle.ts
var LifeCycles = /* @__PURE__ */ ((LifeCycles2) => {
  LifeCycles2["BEFORE_MOUNT"] = "bm";
  LifeCycles2["MOUNTED"] = "m";
  LifeCycles2["BEFORE_UPDATE"] = "bu";
  LifeCycles2["UPDATED"] = "u";
  return LifeCycles2;
})(LifeCycles || {});
function createHook(type) {
  return (hook, target = currentInstance) => {
    if (target) {
      const hooks = target[type] || (target[type] = []);
      const wrapHook = () => {
        setCurrentInstance(target);
        hook.call(target);
        unsetCurrentInstance();
      };
      hooks.push(wrapHook);
    }
  };
}
var onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
var onMounted = createHook("m" /* MOUNTED */);
var onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
var onUpdated = createHook("u" /* UPDATED */);
function invokeArray(fns) {
  for (let i = 0; i < fns.length; i++) {
    fns[i]();
  }
}

// packages/runtime-core/src/renderer.ts
var createRenderer = (renderOptions2) => {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp
  } = renderOptions2;
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container);
    }
  };
  const mountElement = (vnode, container, anchor) => {
    console.log("vnode =>", vnode);
    const { type, children, props, shapeFlag } = vnode;
    const el = hostCreateElement(type);
    vnode.el = el;
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      hostSetElementText(el, children);
    } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      mountChildren(children, el);
    }
    hostInsert(el, container, anchor);
  };
  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2, container);
    }
  };
  const patchProps = (oldProps, newProps, el) => {
    if (!el)
      return;
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      unmount(child);
    }
  };
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = c2[nextPos] ? c2[nextPos].el : null;
        console.log("\u951A\u70B9\u5143\u7D20", anchor);
        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    } else {
      console.log("\u6BD4\u5BF9\u8303\u56F4", "i =>", i, "e1 =>", e1, "e2 =>", e2);
      let s1 = i;
      let s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      const toBePatched = e2 - s2 + 1;
      let newIndexToOldIndexMap = new Array(toBePatched).fill(0);
      for (let i2 = s2; i2 <= e2; i2++) {
        const vnode = c2[i2];
        keyToNewIndexMap.set(vnode.key, i2);
      }
      console.log("keyToNewIndexMap =>", keyToNewIndexMap);
      for (let i2 = s1; i2 <= e1; i2++) {
        const oldVnode = c1[i2];
        let newIndex = keyToNewIndexMap.get(oldVnode.key);
        if (newIndex === void 0) {
          unmount(oldVnode);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i2 + 1;
          console.log("newIndexToOldIndexMap =>", newIndexToOldIndexMap);
          patch(oldVnode, c2[newIndex], el);
        }
      }
      let increasingSeq = getSequence(newIndexToOldIndexMap);
      console.log("increasingSeq =>", increasingSeq);
      let j = increasingSeq.length - 1;
      for (let i2 = toBePatched - 1; i2 >= 0; i2--) {
        let newIndex = s2 + i2;
        let anchor = c2[newIndex + 1]?.el;
        let vnode = c2[newIndex];
        if (!vnode.el) {
          patch(null, vnode, el, anchor);
        } else {
          if (i2 == increasingSeq[j]) {
            j--;
          } else {
            hostInsert(vnode.el, el, anchor);
          }
        }
      }
    }
  };
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          patchKeyedChildren(c1, c2, el);
        } else {
          unmountChildren(c1);
        }
      } else {
        if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
          hostSetElementText(el, "");
        }
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          mountChildren(c2, el);
        }
      }
    }
  };
  const patchElement = (n1, n2, container) => {
    let el = n2.el = n1.el;
    let oldProps = n1.props || {};
    let newProps = n2.props || {};
    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };
  const processText = (n1, n2, container) => {
    if (n1 == null) {
      hostInsert(n2.el = hostCreateText(n2.children), container);
    } else {
      const el = n2.el = n1.el;
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  const processFragment = (n1, n2, container) => {
    if (n1 == null) {
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container);
    }
  };
  const updateComponentPreRender = (instance, next) => {
    instance.next = null;
    instance.vnode = next;
    updataProps(instance, instance.props, next.props || {});
  };
  const setupRenderEffect = (instance, container, anchor) => {
    const { render: render3 } = instance;
    const componentUpdateFn = () => {
      const { bm, m } = instance;
      if (!instance.isMounted) {
        if (bm) {
          invokeArray(bm);
        }
        const subTree = render3.call(instance.proxy, instance.proxy);
        patch(null, subTree, container, anchor);
        instance.isMounted = true;
        instance.subTree = subTree;
        if (m) {
          invokeArray(m);
        }
      } else {
        const { next, bu, u } = instance;
        if (next) {
          console.log("\u7EC4\u4EF6\u66F4\u65B0\u5566\uFF5E\uFF5E\uFF5E", next);
          updateComponentPreRender(instance, next);
        }
        if (bu) {
          invokeArray(bu);
        }
        const subTree = render3.call(instance.proxy, instance.proxy);
        patch(instance.subTree, subTree, container, anchor);
        instance.subTree = subTree;
        if (u) {
          invokeArray(u);
        }
      }
    };
    const effect2 = new ReactiveEffect(componentUpdateFn, () => queueJob(update));
    const update = instance.update = () => effect2.run();
    update();
  };
  const mountComponent = (vnode, container, anchor) => {
    const instance = vnode.component = createComponentInstance(vnode);
    console.log("instance => ", instance);
    setupComponent(instance);
    setupRenderEffect(instance, container, anchor);
  };
  const hasPropsChanged = (prevProps, nextProps) => {
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i];
      if (nextProps[key] !== prevProps[key]) {
        return true;
      }
    }
    return false;
  };
  const updataProps = (instance, prevProps, nextProps) => {
    if (hasPropsChanged(prevProps, nextProps)) {
      for (let key in nextProps) {
        instance.props[key] = nextProps[key];
      }
      for (let key in instance.props) {
        if (!(key in nextProps)) {
          delete instance.props[key];
        }
      }
    }
  };
  const shouldComponentUpdate = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;
    if (prevChildren || nextChildren)
      return true;
    if (prevProps === nextProps)
      return false;
    return hasPropsChanged(prevProps, nextProps || {});
  };
  const updateComponent = (n1, n2) => {
    const instance = n2.component = n1.component;
    if (shouldComponentUpdate(n1, n2)) {
      instance.next = n2;
      instance.update();
    }
  };
  const processComponent = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor);
    } else {
      updateComponent(n1, n2);
    }
  };
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 == n2) {
      return;
    }
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    const { type, shapeFlag, ref: ref2 } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        if (shapeFlag & 1 /* ELEMENT */) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & 64 /* TELEPORT */) {
          type.process(n1, n2, container, anchor, null, {
            mountChildren,
            patchChildren,
            move: (vnode, container2, anchor2) => {
              hostInsert(vnode.component ? vnode.component.subTree.el : vnode.el, container2, anchor2);
            }
          });
        } else if (shapeFlag & 6 /* COMPONENT */) {
          processComponent(n1, n2, container, anchor);
        }
    }
    if (ref2 !== null) {
      setRef(ref2, n2);
    }
  };
  const setRef = (rawRef, vnode) => {
    let value = vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */ ? vnode.component.exposed || vnode.component.proxy : vnode.el;
    if (isRef(rawRef)) {
      rawRef.value = value;
    }
  };
  const unmount = (vnode) => {
    const { shapeFlag } = vnode;
    if (vnode.type === Fragment) {
      unmountChildren(vnode.children);
    } else if (shapeFlag & 6 /* COMPONENT */) {
      debugger;
      unmount(vnode.component.subTree);
    } else {
      const el = vnode.el;
      if (el && el.parentNode) {
        hostRemove(el);
      }
    }
  };
  const render2 = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        console.log("remove element");
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
      container._vnode = vnode;
    }
  };
  return {
    render: render2
  };
};

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign({ patchProp }, nodeOps);
var render = (vNode, container) => {
  return createRenderer(renderOptions).render(vNode, container);
};
export {
  Fragment,
  LifeCycles,
  ReactiveEffect,
  Teleport,
  Text,
  activeEffect,
  computed,
  createComponentInstance,
  createRenderer,
  createVnode,
  currentInstance,
  effect,
  getCurrentInstance,
  h,
  initSlots,
  invokeArray,
  isReactive,
  isRef,
  isSameVnode,
  isTeleport,
  isVnode,
  onBeforeMount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
  proxyRefs,
  reactive,
  ref,
  render,
  renderOptions,
  setCurrentInstance,
  setupComponent,
  toReactive,
  toRef,
  toRefs,
  trackEffect,
  trackRefValue,
  triggerEffects,
  triggerRefValue,
  unsetCurrentInstance,
  watch,
  watchEffect
};
//# sourceMappingURL=runtime-dom.js.map
