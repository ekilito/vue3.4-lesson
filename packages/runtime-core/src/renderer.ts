import { ShapeFlags } from '@vue/shared';
import { isSameVnode } from './createVnode';

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

    // 第一次渲染的时候让虚拟节点和真实dom 创建关联 vnode.el = 真实dom
    // 第二次渲染新的 vnode， 可以和上一次的vnode 做对比，之后更新对应的el元素，可以后续再复用这个dom元素
    const el = hostCreateElement(type)
    vnode.el = el // ✅ 关键：建立 vnode 和真实 DOM 的绑定
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

  const processElement = (n1 , n2 , container) => {
    if(n1 === null) {
      // 初始化操作
      mountElement(n2 , container)
    }else {
      patchElement(n1 , n2 , container)
    }
  }

  const patchProps = ( oldProps , newProps , el) => {
    if (!el) return; // 防止空 DOM
    // 新的要全部生效
    for(let key in newProps) {
      hostPatchProp(el , key , oldProps[key] , newProps[key])
    }
    // 老的有新的没有需要删除
    for(let key in oldProps) {
      if(!(key in newProps)) {
        hostPatchProp(el , key , oldProps[key] , null)
      }
    }
  }

  const unmountChildren = (children) => {
    for(let i = 0; i < children.length; i++) {
      const child = children[i]
      unmount(child)
    }
  }

  // 比较 n1 和 n2 的 children text array null
  const patchChildren = (n1 , n2 , el) => {
    const c1 = n1.children
    const c2 = n2.children

    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag
    // 1. 新的是文本, 老的是数组移除老的
    // 2. 新的是文本, 老的也是文本, 内容不相同直接替换
    // 3. 老的是数组, 新的是数组, 全量 diff 算法
    // 4. 老的是数组，新的不是数组，移除老的子节点
    // 5. 老的是文本，新的是空
    // 6. 老的是文本，新的是数组

    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
       unmountChildren(c1)
     }
      if(c1 !== c2) {
        hostSetElementText(el, c2)
      }
   }else{
      // 老的是数组
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 全量 diff 算法，两个数组的比对
        }else{
          // 老的是数组 新的不是数组
          unmountChildren(c1)
        }
      }else {
        // 老的是文本
        if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el , '')
        }
        // 老的是文本 新的是数组
        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2 , el)
        }
      }
   }
 }


  const patchElement = (n1 , n2 , container) => {
    // 1. 比较元素的差异，需要复用dom元素
    // 2. 比较属性和元素的子节点
    let el = (n2.el = n1.el); // 复用老节点 对dom元素的复用 n2.el n3.el n4

    let oldProps = n1.props || {};
    let newProps = n2.props || {};
   
    // hostPatchProp 只针对某一个属性来处理 class style event attr
    patchProps( oldProps , newProps , el)

    patchChildren(n1 , n2 , el)
  }

  // 渲染走这里，更新也走这里
  const patch = (n1, n2, container) => {
   
    if(n1 == n2) {
      // 两次渲染同一个元素直接跳过即可
      return
    }

    // 直接移除老的dom元素，初始化新的dom元素
    if(n1 && !isSameVnode(n1, n2)) {
      // 如果不是同一个元素，需要删除老的换新的
      unmount(n1);
      n1 = null; // 让n1 变成null 就会执行n2的初始化逻辑
    }

    // 对元素的处理
    processElement(n1 , n2 , container)
  };

  const unmount = (vnode) => {
  const el = vnode.el;
  if (el && el.parentNode) {
    hostRemove(el);
  }
};

  // 多次调用render 会进行虚拟节点的比较，在进行更新
  const render = (vnode, container) => {
    //  console.log("vnode => ",vnode)
    //  console.log("container => ", container)
    if(vnode == null) { 
      // 移除当前容器中的dom元素
      if(container._vnode) {
        console.log("remove element");
        unmount(container._vnode);
      }
    }
    // todo 将虚拟节点变成真实节点进行渲染
    patch(container._vnode || null, vnode, container);
    container._vnode = vnode;
  };

  return {
    render,
  };
};