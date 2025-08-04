export default function patchAttr(el, key, value) {
  if (value == null) {
     // 如果属性值是 null 或 undefined，移除这个属性
    el.removeAttribute(key);
  } else {
    // 否则设置这个属性
    el.setAttribute(key, value);
  }
}
