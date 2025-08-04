export default function patchClass(el, value) {
  if (value == null) {
    // 如果 class 的值是 null 或 undefined，移除该元素的 class 属性
    el.removeAttribute("class");
  } else {
    // 否则，直接将 className 设为新的值
    el.className = value;
  }
}
