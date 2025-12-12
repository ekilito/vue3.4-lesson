// 主要是对节点元素的增删改查

export const nodeOps = {
  // 如果第三个元素不传递 === appendChild
  // insert: (el, parent, anchor) => parent.insertBefore(el, anchor || null),
  insert: (el, parent, anchor) => {
    // 防御性编程：确保 anchor 是有效的 DOM 节点或 null
    const anchorNode = (anchor && anchor.nodeType === 1) ? anchor : null;
    parent.insertBefore(el, anchorNode);
  },
  // appendChild  parent.insertBefore(el,null)
  remove(el) {
    // 移除dom元素
    const parent = el.parentNode;
    parent && parent.removeChild(el);
  },
  createElement: (type) => document.createElement(type),
  createText: (text) => document.createTextNode(text),
  setText: (node, text) => (node.nodeValue = text), // 设置文本
  setElementText: (el, text) => (el.textContent = text),
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling,
};
