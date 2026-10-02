# Word / PPT 目的位置定位验收（2026-10-02）

变量面板现在支持三种文档的来源与 Render 目的位置。点击地址经 `POST /api/navigate` → 固定 `navigate` RPC 定位，不执行保存的 Transform/Render，不更新变量值或执行时间。一个 Render 的多个目的位置分别显示为蓝色按钮，鼠标与 Enter 均使用对应的 `locationIndex`。

## 地址格式

| 文档 | targetRef / sourceRef 示例 | 定位行为 |
| --- | --- | --- |
| 表格 | `Summary!A1:B4` | 切换工作簿/工作表、选中并滚动到区域 |
| PPT | `SlideID:257!ShapeID:4` | 根据稳定 ID 找到幻灯片与形状，幻灯片重排后仍使用原 ID |
| PPT | `Slide:2!Shape:表格 3` / `Slide:2` | 按页码与形状名称，或仅定位幻灯片 |
| Word | `Paragraph:4` / `Table:1` | 选中主文档的指定段落/表格 |
| Word | `Heading:本周概况!Paragraph` | 匹配完整标题文字，选中紧随其后的非空段落 |
| Word | `Heading:团队进展!Table` | 匹配完整标题文字，选中紧随其后的表格 |
| Word | `Heading:本周概况` | 选中标题本身 |
| Word | `Bookmark:名称` / `Range:0:20` | 选中书签或主文档字符范围 |

Word/PPT 多个目的地用 `+` 连接，每个填写完整位置，最多 20 个。对象名称不能包含 `+`、`!` 或控制字符；包含这些字符时使用 ID、序号、书签或字符范围。字符范围仅覆盖主文档，不支持页眉页脚等其他 story。

兼容既有 `第2页 项目跟进表`、`第4页 重点关注文本框`、`第4页 下周工作与资源协调文本框`、`本周概况段落+团队进展表格` 等地址。旧 PPT 表格地址仅在该页只有一个表格时选中；旧文本框地址匹配对象完整名称或文字第一行。重复标题、重复形状名称、多个表格均报告歧义，不任取第一项。Word 标题后表格已删除时不会跳到更后面的表格。

地址仅作为定位数据解析，不执行地址内容或保存的代码。Word/PPT 没有明确 targetRef 时，不从长 description 或 Render 代码推断写入位置。

## macOS 前台标签切换

WPS macOS 的整合标签模式下，组件 `Window.Activate` / `Document.Activate` 能选中组件内部目标，却可能保持原组件的前台标签。已验证此行为：表格面板点击 PPT 目的地址，后台形状选择成功，但前台仍显示表格。

桥接服务在 macOS 对已注册、存在的绝对文件路径，通过 `/usr/bin/open -b com.kingsoft.wpsoffice.mac <path>` 请求 WPS 显示其已打开的文档标签，再发送定位命令。导航请求不接受文件路径；命令使用参数数组，不经过 shell。未保存文档和其他系统使用宿主定位 API。

## 验证

`npm run check` 通过。最终 `node --test --test-concurrency=1 test/*.test.mjs` 全部 85 项通过；并行全量测试曾遇到 stdio 日志测试读取未完整 JSON 的启动时序问题，该项单独运行及最终顺序全量运行均通过。

- 自动化覆盖位置格式与边界、create/update 类型一致性、同名文档按身份路由、稳定 SlideID 重排、多个目的地、重复/删除对象、越界字符范围、书签、原有表格定位、变量值及执行时间不变。
- macOS 实机运行实际 `addon/main.js` 导航消息处理器，验证 PPT 第 2 页表格、第 3 页安排1/2/3、第 4 页重点关注/下周工作/资源协调；Word 概况、变化、关注事项、下周安排段落以及两个表格、序号及字符范围。临时规则结束后删除，测试不修改文档内容。
- 真实面板显示新的蓝色地址；点击 Word“本周概况段落”后，前台切换到 `项目交付周报-测试版.docx`，实际 Selection 为 Start=38、End=120。PPT 前台切换到第 2 页并显示表格选择框。
- 该会话 `render_016` 原地址“第3页 本周变化文本框”实际指三个不同对象，已保持原 Render ID 与代码，将 targetRef 补成“第3页 本周完成文本框+第3页 计划调整文本框+第3页 新增关注文本框”。更新元数据按既有规则清除该 Render 的 lastRun，未重写文档。

## 当前运行环境

常用 LaunchAgent 运行目录为 `/Users/huyongsheng/.codex/worktrees/a9c3/wps-assistant`。已只同步本次导航相关修改到该目录，构建、重启桥接服务，并重新加载三个组件插件及既有助手窗格。更新前文件保存在 `~/Library/Application Support/wps-mcp/backups/navigation-2026-10-02/`。

实机验证脚本：`node scripts/test-document-navigation-live.mjs`，依赖上述已打开的测试文档及其已核实的 Slide/Shape ID，仅用于该测试样本。
