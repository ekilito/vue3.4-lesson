import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from './ref';

export const computed = (getterOrOptions) => {
  let onlyGetter = isFunction(getterOrOptions);

  let getter;
  let setter;

  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  //  console.log(getter, setter);
  return new ComputedRefImpl(getter, setter); // 计算属性 ref
};

class ComputedRefImpl {
  public _value;
  public effect;
  public dep;

  constructor(getter, public setter) {
    // 需要创建一个 effect 来关机当前计算属性的 dirty 属性

    // computed(() => state.name)

    this.effect = new ReactiveEffect(
      () => getter(this._value), // 用户写的 fn: (() => state.name) （会访问 state.name, 变化之后 会执行第二个函数）
      () => {
        // 计算属性依赖的值变化了，应该触发 渲染effect 重新执行
        // 依赖的属性变化后需要触发重新渲染，还需要将 dirty 变为 true
        triggerRefValue(this); 
      },
    );
  }

  //  让计算属性收集对应的 effect
  get value() {
    // 这里需要做处理

    // 默认取值一定是脏的，但是执行一次 run 后就不脏了
    if (this.effect.dirty) {
      this._value = this.effect.run(); // 运行 effect

      trackRefValue(this) // 把当前的effect 和这个属性关联起来
      // 如果当前在effect中访问了计算属性，计算属性是可以收集这个effect 的
      
    }
    return this._value; // 返回上一次的值
  }

  set value(newValue) {
    // 这个就是ref的setter
    this.setter(newValue);
  }
}

