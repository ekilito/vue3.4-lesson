// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  // 如果第三个元素不传递 === appendChild
  insert: (el, parent, anchor) => parent.insertBefore(el, anchor || null),
  // appendChild  parent.insertBefore(el,null)
  remove(el) {
    const parent = el.parentNode;
    parent && parent.removeChild(el);
  },
  createElement: (type) => document.createElement(type),
  createText: (text) => document.createTextNode(text),
  setText: (node, text) => node.nodeValue = text,
  // 设置文本
  setElementText: (el, text) => el.textContent = text,
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling
};

// packages/runtime-dom/src/modules/patchAttr.ts
function patchAttr(el, key, value) {
  if (value == null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}

// packages/runtime-dom/src/modules/patchClass.ts
function patchClass(el, value) {
  if (value == null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
}

// packages/runtime-dom/src/modules/patchEvent.ts
function createInvoker(value) {
  const invoker = (e) => invoker.value(e);
  invoker.value = value;
  return invoker;
}
function patchEvent(el, name, nextValue) {
  const invokers = el._vei || (el._vei = {});
  const eventName = name.slice(2).toLowerCase();
  const exisitingInvokers = invokers[name];
  if (nextValue && exisitingInvokers) {
    return exisitingInvokers.value = nextValue;
  }
  if (nextValue) {
    const invoker = invokers[name] = createInvoker(nextValue);
    return el.addEventListener(eventName, invoker);
  }
  if (exisitingInvokers) {
    el.removeEventListener(eventName, exisitingInvokers);
    invokers[name] = void 0;
  }
}

// packages/runtime-dom/src/modules/patchStyle.ts
function patchStyle(el, prevValue, nextValue) {
  let style = el.style;
  for (let key in nextValue) {
    style[key] = nextValue[key];
  }
  if (prevValue) {
    for (let key in prevValue) {
      if (nextValue) {
        if (nextValue[key] == null) {
          style[key] = null;
        }
      }
    }
  }
}

// packages/runtime-dom/src/patchProp.ts
function patchProp(el, key, prevValue, nextValue) {
  if (key === "class") {
    return patchClass(el, nextValue);
  } else if (key === "style") {
    return patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    return patchEvent(el, key, nextValue);
  } else {
    return patchAttr(el, key, nextValue);
  }
}

// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function isString(value) {
  return typeof value == "string";
}

// packages/runtime-core/src/createVnode.ts
var isVnode = (value) => {
  return value?.__v_isVnode;
};
var isSameVnode = (n1, n2) => {
  return n1.type === n2.type && n1.key === n2.key;
};
var createVnode = (type, props, children) => {
  const shapeFlag = isString(type) ? 1 /* ELEMENT */ : 0;
  const vnode = {
    __v_isVnode: true,
    // 表示是 虚拟节点
    type,
    props,
    children,
    key: props?.key,
    // diff 算法中后面需要的 key
    el: null,
    // 虚拟节点需要对应的真实节点是谁
    shapeFlag
  };
  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag |= 16 /* ARRAY_CHILDREN */;
    } else {
      children = String(children);
      vnode.shapeFlag |= 8 /* TEXT_CHILDREN */;
    }
  }
  return vnode;
};

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  let l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      } else {
        return createVnode(type, propsOrChildren);
      }
    }
    return createVnode(type, null, propsOrChildren);
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    }
    if (l == 3 && isVnode(children)) {
      children = [children];
    }
    return createVnode(type, propsOrChildren, children);
  }
}

// packages/runtime-core/src/renderer.ts
var createRenderer = (renderOptions2) => {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp
  } = renderOptions2;
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container);
    }
  };
  const mountElement = (vnode, container) => {
    console.log(vnode);
    const { type, children, props, shapeFlag } = vnode;
    const el = hostCreateElement(type);
    vnode.el = el;
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      hostSetElementText(el, children);
    } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      mountChildren(children, el);
    }
    hostInsert(el, container);
  };
  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      mountElement(n2, container);
    } else {
      patchElement(n1, n2, container);
    }
  };
  const patchProps = (oldProps, newProps, el) => {
    if (!el)
      return;
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      unmount(child);
    }
  };
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    console.log("\u6BD4\u5BF9\u8303\u56F4", "i =>", i, "e1 =>", e1, "e2 =>", e2);
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    console.log("\u6BD4\u5BF9\u8303\u56F4", "i =>", i, "e1 =>", e1, "e2 =>", e2);
  };
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          patchKeyedChildren(c1, c2, el);
        } else {
          unmountChildren(c1);
        }
      } else {
        if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
          hostSetElementText(el, "");
        }
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          mountChildren(c2, el);
        }
      }
    }
  };
  const patchElement = (n1, n2, container) => {
    let el = n2.el = n1.el;
    let oldProps = n1.props || {};
    let newProps = n2.props || {};
    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };
  const patch = (n1, n2, container) => {
    if (n1 == n2) {
      return;
    }
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    processElement(n1, n2, container);
  };
  const unmount = (vnode) => {
    const el = vnode.el;
    if (el && el.parentNode) {
      hostRemove(el);
    }
  };
  const render2 = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        console.log("remove element");
        unmount(container._vnode);
      }
    }
    patch(container._vnode || null, vnode, container);
    container._vnode = vnode;
  };
  return {
    render: render2
  };
};

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign({ patchProp }, nodeOps);
var render = (vNode, container) => {
  return createRenderer(renderOptions).render(vNode, container);
};
export {
  createRenderer,
  createVnode,
  h,
  isSameVnode,
  isVnode,
  render,
  renderOptions
};
//# sourceMappingURL=runtime-dom.js.map
