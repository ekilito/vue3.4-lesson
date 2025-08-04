export const createRenderer = (renderOptions) => {
  // core 中不关心如何渲染

  const render = (vnode, container) => {};

  return {
    render,
  };
};
