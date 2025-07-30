import { activeEffect } from './effect'

export const track = (target , key) => {
   
  // activeEffect 有这个属性 说明这个key 是在 effect中访问的，没有 说明在effect 之外访问的 不用进行收集
  if(activeEffect) {
    console.log(key, activeEffect)
  }
}
