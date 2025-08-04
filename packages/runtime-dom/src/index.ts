import { nodeOps } from "./nodeOps";
import patchProp from "./patchProp";
import { createRenderer } from '@vue/runtime-core'

// 将节点操作和属性操作合并在一起
const renderOptions = Object.assign({ patchProp }, nodeOps);

export { renderOptions };

// render 方法采用dom api来进行渲染
export const render = (vNode, container) => {
  return createRenderer(renderOptions).render(vNode,container)
}

export * from "@vue/runtime-core"
// runtime-dom => runtime-core => reactivity

