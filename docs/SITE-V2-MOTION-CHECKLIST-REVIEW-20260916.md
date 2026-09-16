# 动效执行清单技术复核

日期：2026-09-16。对象：docs/SITE-V2-MOTION-EXECUTION-CHECKLIST-20260916.md。
状态：范围通过，执行细节需修订；不构成用户批准。未修改原清单或页面代码。请Claude将下列修正合入原清单，继续以原清单为唯一执行文件，不把本复核另当一套并行指令。

实际文件位于 D:/AI_Projects/tourguide/docs/，用户消息中的 D:/AI_Projects/docs/ 路径未找到同名文件。

## 1. 已对齐部分

B音频、简化D、按钮与页内导航；取消A/C；地图不阻塞；入场/操作/播放分开定义生命周期；手机不入场；减少动态效果与无JS回退；提供动态证据。这些无需再讨论方向。

## 2. 合入原清单的必要修正

### R1 入场初始化与“无闪烁”相冲突

当前做法是服务端先显示opacity=1，客户端挂载后加pending降到0.8，再恢复1。首屏Hero已经被用户看到，可能出现先暗后亮；这是所写实现与验收要求冲突。

推荐明确取舍：取消M-D1首屏主卡显现，保持Hero静态。修改相关范围表与实现段，不能只在备注里说取消。M-D2–D4仅对初始化时完全在视口下方的展示组设置pending；初始化时已可见或已滚过的组直接标done、保持1。只有pending组首次达到30%可见才做300ms显现并标done。组件本次挂载期间不重播；重新完整加载允许重新判定。

若快速滚动/锚点跳转跨过组，或组内元素获得键盘焦点，直接标done并设为1，不补播。观察器不可用、断点变为手机、减少动态效果开启时同样直接1，已经done的组不能因切回桌面重新变pending。无JS默认1。

这是对前稿Hero轻显现的明确收敛，优先保首屏稳定，不新增预加载脚本解决小装饰。

### R2 波形接口不能只有active

active=false可能是暂停，也可能是idle/done/error。按当前“非active无动画”实现，暂停会移除animation，无法冻结当前帧。

替换为明确的视觉模式static/running/paused：running与paused保留同一animation声明，paused只改animation-play-state；static才移除动画并恢复原始柱高。真实播放暂停、页面不可见/组件离开视口均可导致视觉paused，但不应改变音频状态；真正idle/done/error/被切换则static。减少动态效果始终static。

Guides判断使用mine && status：两张卡共用hook，并非两套独立实例，切换key必须复位旧卡动画。

参数固定以便复核：第i柱的单程时长1100+(i mod 5)*100ms，相位延迟-(i mod 7)*100ms；scaleY在0.7与1之间，中心为变换原点，alternate，ease-in-out。已有静态柱高不变。避免“每柱1.1–1.5s随机”留下多套理解。

参照：CSS暂停后从原位置恢复的行为见 https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-play-state 。

### R3 按钮内部缩放需要完整包裹，文字链接另列

active:[&>*]只选元素子节点，直接写在按钮中的文字节点不在选择范围；也会让图标各自缩放而不是整组内容反馈。

真实按钮/胶囊链接将图标与文字放在同一个内部视觉容器，统一scale(0.98)，外部命中区域与焦点框保持不变。普通页脚文字链接只做颜色/下划线/焦点反馈，不强加缩放。缩放过渡明确为150ms，不能仅配置transition-colors。hover限定支持hover的精细指针；键盘Space/Enter按原生控件语义验证，不改变链接行为。

### R4 平滑滚动的作用对象需纠正

当前SiteV2Landing的.rr2是内容容器，并非已确认的实际滚动容器。scroll-behavior作用于滚动容器；文档视口应由根元素控制，仅给.rr2设置不等于页面平滑滚动。

实施时确认实际滚动元素。若为文档视口，只在/site-v2挂载期间给documentElement添加专属标记，CSS对该标记设置smooth，卸载移除自身标记，减少动态效果设auto；保留原生锚点与hash，不覆盖其他页面规则，不做自定义滚动循环。若真实滚动容器不同则记录实测对象，不新增嵌套滚动容器。

依据：https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-behavior 。

### R5 状态语义统一，不等于每处新增同一排文字

M-B4应逐处注明现有UI：Hero状态行使用Ready/Preparing/Speaking/Paused/Voice unavailable；SeeHear和Guides沿用现有播放按钮的Hear…/Preparing/Pause/Resume/Retry表达，不额外增加状态行撑高卡片。done可重播。loading不可重复触发，error可重试。状态变化即时，颜色过渡不延迟操作。

当前M-B2沿用M-B1验证步骤并不能独立验证SeeHear暂停恢复；实际回归要覆盖Hero、SeeHear、Mia、Milo四个入口，各自一次暂停恢复，以及跨区域切换。

## 3. 验收方案修订

- 首次进入画面与滚动回放保留。录屏不可声称CDP天然固定25fps；Page.startScreencast没有fps参数，应采集实际帧事件/时间戳、及时ack，再按时间戳编码。输出可为25fps，但不能用简单等间隔拼帧伪造原始时间。说明浏览器帧采集不含声音；需要证明“实际发声”时使用含系统声音的录屏，或明确以媒体playing事件日志验证状态，不声称听到了音频。协议依据：https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-startScreencast 。
- 受控TTS失败测试需使用新会话或清空相关内存音频缓存，证明本次请求实际被拦截。避免命中缓存仍播放而误判错误处理。
- 对比基线改为“同一代码/同一素材、关闭本轮动效”与“开启动效”，不再固定§43旧截图。地图换图等已授权变化会让旧基线失效。
- 静态比对锁定视口/DPR、加载完成、空闲音频状态、动效结束。检查元素位置、尺寸、换行、可见性无变化；像素差仅作辅助，允许字形栅格化细小差异，不能用“动效元素允许任意差异”放过永久变形。
- 性能用同一生产构建预热后做开启/关闭对比，避免dev热更新干扰。先做一对；发现新增长任务、布局或明显掉帧再重复定位，不默认要求六次重型trace。可播放录屏不当性能采样，录制本身有开销。
- 工程检查保留现有tsc、eslint、断点和溢出核查；动画动效的执行不自动代表静态地图接入已验收。

## 4. 当前结论

清单方向已收敛，不必再开一轮动效创意。合入R1–R5和验收修订后，形成可批准的同一份清单。工期为估算，保留待用户批准状态；不操作06:15任务、不提交、不发布。
