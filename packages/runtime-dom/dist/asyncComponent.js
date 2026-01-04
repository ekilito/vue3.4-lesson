    import { h }  from "./runtime-dom.js";

export default {
  name: 'AsyncComponent',
  render() {
    return h('div', 'This is an async component loaded dynamically.');
  }
}