import { activeEffect, trackEffect, triggerEffects } from "./effect";

// 存放依赖收集的关系
const targetMap = new WeakMap();

// 创建依赖
export const createDep = (cleanup , key) => {
  const dep = new Map() as any; // 创建的收集器还是一个Map
  dep.cleanup = cleanup; // 清理方法
  dep.name = key; // 自定义标识 这个映射表是给哪个属性服务的
  return dep;
};

export const track = (target, key) => {
  // activeEffect 有这个属性 说明这个key 是在 effect中访问的，没有 说明在effect 之外访问的 不用进行收集
  if (activeEffect) {
    // console.log(target, key, activeEffect);

    let depsMap = targetMap.get(target);

    if (!depsMap) {
      // 新增的
      targetMap.set(target, (depsMap = new Map()));
    }

    let dep = depsMap.get(key);

    if (!dep) {
      depsMap.set(
        key,
        dep = createDep(() => depsMap.delete(key), key), // 后面用于清理不需要的属性
      );
    }

    // 将当前的 effect 放入到 dep(映射表)中，后续可以根据值的变化触发此 dep 中存放的 effect
    trackEffect(activeEffect, dep)

    // console.log('收集依赖:',targetMap)
  }
// Map: {obj: {属性：Map: {effect, effect}}}
// {
//   {name: 'wdl', age: 18} : {
//     age: {
//       effect
//     },
//     name: {
//       effect, effect
//     }
//   }
// }
};



export const trigger = (target , key , newValue , oldValue) => {
   // 依赖收集器的映射表
    const depsMap = targetMap.get(target)

    // 找不到对象 直接return 即可
    if(!depsMap) {
      return
    }

   let dep = depsMap.get(key)
   if(dep) { // 修改的属性对应了 effect
     triggerEffects(dep)
   }
}