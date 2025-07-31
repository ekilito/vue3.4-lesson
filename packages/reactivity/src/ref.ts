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
