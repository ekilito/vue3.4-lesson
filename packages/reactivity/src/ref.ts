import { activeEffect, trackEffect, triggerEffects } from "./effect";
import { toReactive } from "./reactive";
import { createDep } from "./reactiveEffect";

export const ref = (value) => {
  return createRef(value);
};

const createRef = (value) => {
  return new RefImpl(value);
};

class RefImpl {
  public __v_isRef = true; // 增加 ref 标识
  public _value; // 内部存储值 保存 ref 值的
  public dep; // 用于收集对应的 effect

  constructor(public rawValue) {
    this._value = toReactive(rawValue); // 确保值是响应式的
  }

  get value() {
    trackRefValue(this); // 依赖收集
    return this._value;
  }

  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue;
      this._value = newValue;
      // 触发依赖收集
      triggerRefValue(this);
    }
  }
}

const trackRefValue = (ref) => {
  if (activeEffect) {
    trackEffect(activeEffect, (ref.dep = createDep(() => (ref.dep = undefined), "undefined")));
  }
};

const triggerRefValue = (ref) => {
  let dep = ref.dep;
  if (dep) {
    // 触发依赖更新
    triggerEffects(dep);
  }
};


// toRef 
export const toRef = (object, key) => {

  return new ObjectRefImpl(object, key);
};

class ObjectRefImpl {
  public __v_isRef = true; // 增加 ref 标识
  constructor(public _object, public _key) {

  }

  get value() {
    return this._object[this._key]; // 访问对象的属性
  }

  set value(newValue) {
    this._object[this._key] = newValue; // 设置对象的属性
  }
}


// toRefs
export const toRefs = (object) => {
  // 将对象的每个属性转换为 ref
  const result = {};
  for (const key in object) {
    result[key] = toRef(object, key);
  }
  return result;
};

// proxyRefs
export const proxyRefs = (objectWithRef) => {
  return new Proxy(objectWithRef, {
    get(target , key , receiver) {
      const value = Reflect.get(target, key, receiver);
      // 如果是 ref 类型，直接返回其 value
      return value && value.__v_isRef ? value.value : value;
    },

    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key, receiver);
      // 如果是 ref 类型，直接设置其 value
      if (oldValue && oldValue.__v_isRef) {
        return (oldValue.value = value);
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    }
  })
}