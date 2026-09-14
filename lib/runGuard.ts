/**
 * 「这一轮还有效吗」的小计数器，给异步的朗读流程用。
 * 每次开始新一轮（play）或作废（stop、切换、离开页面）就 next() 一次；
 * 在途的请求和音频回调把自己开始时拿到的编号带着，回来时 isCurrent(run) 为假就直接退出，
 * 这样迟到的 TTS 响应不会在用户已经停止或离开后突然出声，也不会被计入指标。
 */
export interface RunGuard {
  /** 当前轮次编号 */
  current(): number;
  /** 开新一轮：旧编号全部失效，返回新编号 */
  next(): number;
  /** 手里的编号还是当前轮吗 */
  isCurrent(run: number): boolean;
}

export function createRunGuard(): RunGuard {
  let n = 0;
  return {
    current: () => n,
    next: () => ++n,
    isCurrent: (run) => run === n,
  };
}
