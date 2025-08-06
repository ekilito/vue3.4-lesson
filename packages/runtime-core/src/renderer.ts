import { ShapeFlags } from '@vue/shared';

export const createRenderer = (renderOptions) => {
  // core 中不关心如何渲染

  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = renderOptions;

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      //  children[i] 可能是纯文本元素
      patch(null, children[i], container);
    }
  }

  const mountElement = (vnode , container) => {
    console.log(vnode)
    const { type , children , props , shapeFlag} = vnode

    const el = hostCreateElement(type)
    if(props) {
      for(let key in props) {
        hostPatchProp(el , key ,null , props[key])
      }
    }
    // 判断虚拟节点的 children 是否是文本类型 (9 & 8 >0 说明是文本元素)
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
       hostSetElementText(el , children)
    } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
       mountChildren(children , el)
    }

    hostInsert(el,container)
  }

  // 渲染走这里，更新也走这里
  const patch = (n1, n2, container) => {
    // 两次渲染同一个元素直接跳过即可
    if(n1 == n2) return
    // 初始化操作
    if(n1 === null) {
      mountElement(n2 , container)
    }
  };

  // 多次调用render 会进行虚拟节点的比较，在进行更新
  const render = (vnode, container) => {
    //  console.log("vnode => ",vnode)
    //  console.log("container => ", container)
    // todo 将虚拟节点变成真实节点进行渲染
    patch(container._vnode || null, vnode, container);
    container._vnode = vnode;
  };

  return {
    render,
  };
};