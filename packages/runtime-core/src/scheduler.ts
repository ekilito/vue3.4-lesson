const queue = []; // 缓存队列
let isFlushing = false; // 是否正在刷新
const resolvePromise = Promise.resolve();

// 如果同时在一个组件中更新多个状态 job肯定是同一个
// 同时开启一个异步任务
export const queueJob = (job) => {
  console.log('job => ', job)
  if (!queue.includes(job)) {
    // 去重名的
    queue.push(job) // 让任务入队列
  }
  if (!isFlushing) {
    isFlushing = true

    resolvePromise.then(() => {
      isFlushing = false
      const copy = queue.slice(0) // 先拷贝 再执行
      queue.length = 0
      copy.forEach((job) => job())
      copy.length = 0
    })
  }
}
// 通过事件环的机制，延迟更新操作 先走宏任务 => 微任务
