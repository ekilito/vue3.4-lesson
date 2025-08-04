// 主要是对节点元素的属性操作 class style event 普通属性

import patchAttr from "./modules/patchAttr";
import patchClass from "./modules/patchClass";
import patchEvent from "./modules/patchEvent";
import patchStyle from "./modules/patchStyle";

// diff

// div onClick=fn1     div click=fn2

// div onClick=()=>invoker.value()

// 通用属性打补丁函数，根据不同属性种类调用不同的处理函数
// el：el 是目标 DOM 元素节点，即你要操作的 HTML 元素。
// key：当前需要设置或更新的 属性名。
// prevValue： 该属性 之前的值，也可以是 null。
// nextValue：该属性的 新值
export default function patchProp(el, key, prevValue, nextValue) {
  if (key === "class") {
    // class 属性
    return patchClass(el, nextValue);
  } else if (key === "style") {
    // style 样式
    return patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    // 事件绑定，比如 onClick、onMouseenter 等（排除 onload、onerror 等小写字母开头的原生事件属性）
    // el.addEventerListener(key,prevValue)  // ()=> nextValue()
    return patchEvent(el, key, nextValue);
  } else {
    // 普通的 DOM 属性，如 id、title、data-* 等
    return patchAttr(el, key, nextValue);
  }
}

// el 是目标 DOM 元素节点，即你要操作的 HTML 元素。
// HTMLElement
// const el = document.createElement("div"); // <div></div>
// patchProp(el, "class", null, "my-class");
// 操作后 el => <div class="my-class"></div>

// key：当前需要设置或更新的 属性名。
// 类型：string
// 作用：决定你要处理的是 class、style、事件（onClick）还是普通属性（id、title 等），patchProp 会根据这个值分发到不同的模块。
// patchProp(el, "style", null, { color: "red" });
// patchProp(el, "onClick", null, () => alert("clicked"));
// patchProp(el, "title", null, "hello");

// prevValue：该属性 之前的值，也可以是 null。
// 类型：任意类型（string、object、function...）
// 作用：用于比较是否需要更新；如果旧值存在，新值为 null，则应清除旧值；对于样式和事件来说，特别重要。
// patchProp(el, "style", { color: "red" }, { color: "blue" });
// 旧值是 red，新值是 blue，会将 red 替换为 blue

// nextValue：该属性的 新值
// 类型：任意类型（与属性类型对应）
// 作用：你希望这个属性最终变成什么值，就传什么；若为 null，表示要删除该属性。
// patchProp(el, "class", "old-class", "new-class");
// class 会从 "old-class" 变成 "new-class"
// patchProp(el, "onClick", oldFn, null);
// 表示解绑点击事件
