function createInvoker(value) {
  const invoker = (e) => invoker.value(e);
  // 将传入的函数绑定到 invoker.value 上，之后可以更改 value 而不需要解绑事件
  invoker.value = value; // 更改invoker中的value属性 可以修改对应的调用函数
  return invoker;
}

export default function patchEvent(el, name, nextValue) {
  // vue_event_invoker
  // 获取当前 DOM 元素上存储的事件 invokers（_vei 是自定义的属性名）
  const invokers = el._vei || (el._vei = {});

  // 提取事件名称，如 "onClick" -> "click"
  const eventName = name.slice(2).toLowerCase();

  // 查找之前是否绑定过这个事件 是否存在同名的事件绑定
  const exisitingInvokers = invokers[name];

  if (nextValue && exisitingInvokers) {
    // 事件换绑定
    // 如果新的事件处理函数存在，并且之前也绑定过这个事件
    // 只需要替换 invoker 中的 value 即可，无需重新绑定
    return (exisitingInvokers.value = nextValue);
  }

  if (nextValue) {
    // 新的事件存在，之前没有绑定过这个事件
    const invoker = (invokers[name] = createInvoker(nextValue)); // 创建一个调用函数，并且内部会执行nextValue
    // 绑定事件监听器
    return el.addEventListener(eventName, invoker);
  }

  if (exisitingInvokers) {
    // 现在没有，以前有
    // 新的事件不存在，之前存在事件，解绑
    el.removeEventListener(eventName, exisitingInvokers);
    invokers[name] = undefined;
  }
}

