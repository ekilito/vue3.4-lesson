import { isString, ShapeFlags } from '@vue/shared';

export const isVnode = (value) => {
  return value?.__v_isVnode;
};

export const createVnode = (type, props, children?) => {
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
  const vnode = {
    __v_isVnode: true, // 表示是 虚拟节点
    type,
    props,
    children,
    key: props?.key, // diff 算法中后面需要的 key
    el: null, // 虚拟节点需要对应的真实节点是谁
    shapeFlag,
  };

  if (children) {
    if (Array.isArray(children)) {
      // array
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else {
      // text
      children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }

  return vnode;
};
