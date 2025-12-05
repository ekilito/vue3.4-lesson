import { isObject, isString, isFunction, ShapeFlags } from '@vue/shared';
import { isTeleport } from "./components/Teleport";

export const isVnode = (value) => {
  return value?.__v_isVnode;
};

export const isSameVnode = (n1, n2) => {
  return n1.type === n2.type && n1.key === n2.key;
}

export const Text = Symbol("Text")
export const Fragment = Symbol("Fragment")

export const createVnode = (type, props, children?) => {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT // 元素
    : isTeleport(type)
      ? ShapeFlags.TELEPORT
      : isObject(type)
        ? ShapeFlags.STATEFUL_COMPONENT // 组件
        : isFunction(type)
          ? ShapeFlags.FUNCTIONAL_COMPONENT // 函数式组件
          : 0;

  const vnode = {
    __v_isVnode: true, // 表示是 虚拟节点
    type,
    props,
    children,
    key: props?.key, // diff 算法中后面需要的 key
    el: null, // 虚拟节点需要对应的真实节点是谁
    shapeFlag,
    ref: props?.ref,
  };

  if (children) {
    if (Array.isArray(children)) {
      // array
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else if (isObject(children)) {
      // 组件的插槽 object
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    } else {
      // text
      children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }

  return vnode;
};
