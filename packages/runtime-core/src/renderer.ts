import { hasOwn, ShapeFlags } from '@vue/shared';
import { Fragment, isSameVnode, Text } from './createVnode';
import getSequence from './seq';
import { reactive, ReactiveEffect } from '@vue/reactivity';
import { queueJob } from './scheduler';
import { createComponentInstance, setupComponent } from './component';

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

  const mountElement = (vnode, container, anchor) => {
    console.log("vnode =>", vnode)
    const { type, children, props, shapeFlag } = vnode

    // 第一次渲染的时候让虚拟节点和真实dom 创建关联 vnode.el = 真实dom
    // 第二次渲染新的 vnode， 可以和上一次的vnode 做对比，之后更新对应的el元素，可以后续再复用这个dom元素
    const el = hostCreateElement(type)
    vnode.el = el // ✅ 关键：建立 vnode 和真实 DOM 的绑定
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    // 判断虚拟节点的 children 是否是文本类型 (9 & 8 >0 说明是文本元素)
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }

    hostInsert(el, container, anchor)
  }

  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      // 初始化操作
      mountElement(n2, container, anchor)
    } else {
      patchElement(n1, n2, container)
    }
  }

  const patchProps = (oldProps, newProps, el) => {
    if (!el) return; // 防止空 DOM
    // 新的要全部生效
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key])
    }
    // 老的有新的没有需要删除
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }
  }

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      unmount(child)
    }
  }

  // vue 中分为两种， 全量diff （递归diff） 快速diff（靶向更新）-> 基于模版编译的
  const patchKeyedChildren = (c1, c2, el) => {
    // 比较两个儿子的差异更新 el
    // appendChild removeChild insertBefore
    // [a,b,c] 
    // [a,b,d,e]

    // 1. 减少对比范围，先从头开始比，再从尾部开始比，确定不一样的范围
    // 2. 从头比对，再从尾部对比，如果有多余的或者新增的直接操作即可

    let i = 0; // 开始比对的索引
    let e1 = c1.length - 1; // 老的数组的尾部索引
    let e2 = c2.length - 1; // 新的数组的尾部索引

    // 1️⃣ 从头开始对比
    while (i <= e1 && i <= e2) {
      // 有任何一方循环结束了 就要终止对比
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVnode(n1, n2)) {
        // 说明是同一个节点 更新当前子节点的属性和儿子 递归比对子节点
        patch(n1, n2, el)
      } else {
        break
      }
      i++
    }
    // 到 c 的位置终止了
    // 到 d 的位置终止了
    // c
    // d e
    // console.log('比对范围', 'i =>' , i , 'e1 =>' , e1 , 'e2 =>' , e2)

    // 2️⃣ 从尾部对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      //   [a,b,c]
      // [d,e,b,c]
      if (isSameVnode(n1, n2)) {
        // 说明是同一个节点 更新当前子节点的属性和儿子 递归比对子节点
        patch(n1, n2, el)
      } else {
        break
      }
      e1--
      e2--
    }
    //  console.log('比对范围', 'i =>' , i , 'e1 =>' , e1 , 'e2 =>' , e2)

    // 处理增加和删除的特殊情况 [a,b,c] => [a,b]  [c,a,b] => [a,b] [a,b] => [a,b,c]

    // 最终对比乱序的情况

    // a b
    // a b c  ->  i = 2 , e1 = 1 , e2 = 2  i>e1 && i<=e2

    //   a b
    // c a b  ->  i = 0 , e1 = -1 , e2 = 0  i>e1 && i<=e2

    // 3️⃣ 新的比老的多 => 挂载新节点
    if (i > e1) { // 说明新的多
      if (i <= e2) {
        // 说明有插入的部分
        // insert
        const nextPos = e2 + 1; // 下一个元素的位置 看一下当前下一个元素是否存在
        const anchor = c2[nextPos] ? c2[nextPos].el : null;
        console.log('锚点元素', anchor)
        while (i <= e2) {
          patch(null, c2[i], el, anchor) // 可能有锚点元素
          i++
        }
      }
    }

    // a b c  i = 2 , e1 = 2 , e2 = 1  i<=e1 && i>e2 
    // a b 

    // c a b  i = 0 , e1 = 0 , e2 = -1  i<=e1 && i>e2
    //   a b
    // 4️⃣ 老的比新的多 => 卸载多余节点
    else if (i > e2) { // 说明老的多
      if (i <= e1) {
        // 说明有需要删除的部分
        while (i <= e1) {
          unmount(c1[i]) // 将元素一个一个删除
          i++
        }
      }
    } else {
      // 以上确认不变化的节点，并且对插入和移除做了处理
      // 后面就是特殊的对比方式了

      // 5️⃣ 中间对比
      console.log('比对范围', 'i =>', i, 'e1 =>', e1, 'e2 =>', e2) // 2 4 5
      let s1 = i // 老的起始索引
      let s2 = i // 新的起始索引

      // 构建 映射表 用于快速查找，看老的是否在新的里面存在，没有就删除，有的话就更新
      const keyToNewIndexMap = new Map()
      const toBePatched = e2 - s2 + 1 // 新的元素个数 要倒叙插入
      // 创建一个数组，来记录新的元素对应老的位置索引
      let newIndexToOldIndexMap = new Array(toBePatched).fill(0) // [0,0,0,0] 代表还没有处理过

      // [5, 3, 4, 0] 代表新的元素对应老的位置索引
      // [5, 3, 4, 0] -> [1, 2] 根据最长递增子序列求出对应的 索引结果

      // 根据新的节点，找到对应老的位置
      for (let i = s2; i <= e2; i++) {
        const vnode = c2[i]
        keyToNewIndexMap.set(vnode.key, i)
      }
      console.log('keyToNewIndexMap =>', keyToNewIndexMap) //  {'e' => 2, 'c' => 3, 'd' => 4, 'h' => 5}

      for (let i = s1; i <= e1; i++) {
        const oldVnode = c1[i]
        let newIndex = keyToNewIndexMap.get(oldVnode.key) // 通过 key 快速找到新的索引
        if (newIndex === undefined) {
          // 老的在新的里面不存在 需要删除
          unmount(oldVnode)
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1; // +1 是为了区分0已经处理过了
          console.log('newIndexToOldIndexMap =>', newIndexToOldIndexMap) // [5, 3, 4, 0]
          // 老的在新的里面存在 需要更新 比较前后节点的差异，更新属性和儿子
          patch(oldVnode, c2[newIndex], el) // 复用
        }
      }
      // 调整顺序
      // 可以按照新的队列 倒序插入 insertBefore 通过参照物往前面插入

      let increasingSeq = getSequence(newIndexToOldIndexMap)
      console.log('increasingSeq =>', increasingSeq) // [1, 2]

      let j = increasingSeq.length - 1; // 索引

      // 插入的过程中，可能新的元素多， 需要创建
      for (let i = toBePatched - 1; i >= 0; i--) {
        // 3 2 1 0
        // 参照物
        let newIndex = s2 + i; // h 对应的索引，找它的下一个元素作为参照物，来进行插入
        let anchor = c2[newIndex + 1]?.el;
        let vnode = c2[newIndex];
        // console.log('keyToNewIndexMap =>', keyToNewIndexMap , newIndex) 
        if (!vnode.el) { // 新列表中xi新增的元素
          patch(null, vnode, el, anchor); // 创建 h 插入
        } else {
          // 
          if (i == increasingSeq[j]) {
            j--; // 做了diff 算法的优化
          } else {
            hostInsert(vnode.el, el, anchor); // 倒序插入
          }
        }
      }
      // 倒序比对每一个元素，做插入操作
    }
  }

  // 比较 n1 和 n2 的 children text array null
  const patchChildren = (n1, n2, el) => {
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

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1)
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2)
      }
    } else {
      // 老的是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 全量 diff 算法，两个数组的比对

          patchKeyedChildren(c1, c2, el)

        } else {
          // 老的是数组 新的不是数组
          unmountChildren(c1)
        }
      } else {
        // 老的是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '')
        }
        // 老的是文本 新的是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el)
        }
      }
    }
  }


  const patchElement = (n1, n2, container) => {
    // 1. 比较元素的差异，需要复用dom元素
    // 2. 比较属性和元素的子节点
    let el = (n2.el = n1.el); // 复用老节点 对dom元素的复用 n2.el n3.el n4

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    // hostPatchProp 只针对某一个属性来处理 class style event attr
    patchProps(oldProps, newProps, el)

    patchChildren(n1, n2, el)
  }

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      // 1. 虚拟节点要关联真实节点
      // 2. 将节点插入要页面中
      hostInsert(n2.el = hostCreateText(n2.children), container)
    } else {
      const el = n2.el = n1.el;
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children)
      }
    }
  }

  const processFragment = (n1, n2, container) => {
    if (n1 == null) {
      // 处理碎片的挂载逻辑，把children 挂载到容器中
      mountChildren(n2.children, container)
    } else {
      // 处理碎片的更新逻辑
      patchChildren(n1, n2, container)
    }
  };

  const updateComponentPreRender = (instance, next) => {
    instance.next = null;
    instance.vnode = next;
    updataProps(instance, instance.props, next.props || {});
  };


  const setupRenderEffect = (instance, container, anchor) => {
    const { render } = instance;
    const componentUpdateFn = () => {
      // 我们要在这里区分，是第一次还是之后的
      if (!instance.isMounted) {
        const subTree = render.call(instance.proxy, instance.proxy) // 通过状态渲染虚拟节点
        // vnode -> patch
        patch(null, subTree, container, anchor)
        instance.isMounted = true
        instance.subTree = subTree
      } else {
        // 基于状态的组件更新
        const { next } = instance;
        if (next) {
          // 更新属性和插槽
          debugger;
          console.log("组件更新啦～～～", next);
          updateComponentPreRender(instance, next);
          // slots, props
        }
        const subTree = render.call(instance.proxy, instance.proxy)
        patch(instance.subTree, subTree, container, anchor)
        instance.subTree = subTree
      }
    }

    const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(update))

    const update = (instance.update = () => effect.run())
    update() // 组件的首次渲染
  }


  const mountComponent = (vnode, container, anchor) => {
    // 1. 先创建组件实例
    const instance = (vnode.component = createComponentInstance(vnode));
    console.log("instance => ", instance)

    // 2. 给组件的实例赋值
    setupComponent(instance);

    // 3. 创建一个 effect
    setupRenderEffect(instance, container, anchor);
  }

  const hasPropsChanged = (prevProps, nextProps) => {
    const nextKeys = Object.keys(nextProps)
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true
    }
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i]
      if (nextProps[key] !== prevProps[key]) {
        return true
      }
    }
    return false
  }

  const updataProps = (instance, prevProps, nextProps) => {
    // instance.props  ->

    if (hasPropsChanged(prevProps, nextProps)) {
      // 看属性是否存在变化
      for (let key in nextProps) {
        // 用新的覆盖掉所有老的
        instance.props[key] = nextProps[key]; // 更新
      }
      for (let key in instance.props) {
        // 删除老的多于的
        if (!(key in nextProps)) {
          delete instance.props[key];
        }
      }
      // instance.props.address = '上海'
    }
  };

  const shouldComponentUpdate = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;

    if (prevChildren || nextChildren) return true; // 有插槽直接走重新渲染即可

    if (prevProps === nextProps) return false;

    // 如果属性不一致实则更新
    return hasPropsChanged(prevProps, nextProps || {});

    // updataProps(instance, prevProps, nextProps); // children   instance.component.proxy
  };

  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component); // 复用组件的实例
    if (shouldComponentUpdate(n1, n2)) {
      instance.next = n2; // 如果调用update 有next属性，说明是属性更新，插槽更新
      instance.update(); // 让更新逻辑统一
    }
  }

  const processComponent = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // 组件的挂载
      mountComponent(n2, container, anchor)
    } else {
      // 组件的更新
      updateComponent(n1, n2)
      // n1.component.props.address = "珊瑚海"
    }
  }

  // 渲染走这里，更新也走这里
  const patch = (n1, n2, container, anchor = null) => {

    if (n1 == n2) {
      // 两次渲染同一个元素直接跳过即可
      return
    }

    // 直接移除老的dom元素，初始化新的dom元素
    if (n1 && !isSameVnode(n1, n2)) {
      // 如果不是同一个元素，需要删除老的换新的
      unmount(n1);
      n1 = null; // 让n1 变成null 就会执行n2的初始化逻辑
    }

    const { type, shapeFlag } = n2;

    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 对元素的处理
          processElement(n1, n2, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 对组件的处理, vue3中函数式组件，已经废弃了， 没有性能节约
          processComponent(n1, n2, container, anchor)
        }
    }
  };

  const unmount = (vnode) => {
    if (vnode.type === Fragment) {
      // 如果是碎片 需要卸载子节点
      unmountChildren(vnode.children);
    } else {
      const el = vnode.el;
      if (el && el.parentNode) {
        hostRemove(el);
      }
    }
  };

  // 多次调用render 会进行虚拟节点的比较，在进行更新
  const render = (vnode, container) => {
    //  console.log("vnode => ",vnode)
    //  console.log("container => ", container)
    if (vnode == null) {
      // 移除当前容器中的dom元素
      if (container._vnode) {
        console.log("remove element");
        unmount(container._vnode);
      }
    } else {
      // todo 将虚拟节点变成真实节点进行渲染
      patch(container._vnode || null, vnode, container);
      container._vnode = vnode;
    }
  };

  return {
    render,
  };
};