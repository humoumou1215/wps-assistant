# 文字操作指引

## 定位与读取

`wpsDocument.Content` / `Range(start,end)` / `Paragraphs` / `Tables` 访问绑定文档。段落/表格集合通常为 1-based；Range 字符位置按宿主返回的坐标，不能由预览长度推算。查询结果仅返回文本及明确位置，不返回原生代理。

```js
return {名称: wpsDocument.Name, 段落数: wpsDocument.Paragraphs.Count,
  表格数: wpsDocument.Tables.Count, 预览: wpsDocument.Content.Text.slice(0, 800)};
```

用户选区按 [选区章节](common.md) 中的 start/end/storyType/caret 处理。重算读取完整范围，超长内容按已保存坐标分段读。长期绑定优先使用实际书签/标题锚点，序号或字符范围可能随编辑漂移。

## 更新

仅 Render 写 Range.Text 或调用插入/表格修改方法。替换精确目标，保留选区之外内容与样式；插入点与范围替换不同。先验证书签/标题唯一、表格存在和单元格范围，缺失时报错，避免回退到整个 Content。写后读回目标文本、邻近内容和关键样式。

跨源报告按 [报告绑定](report-sync.md) 建立可复用规则。字段和样式更新分开，行列变化按实际表头映射，避免全篇重建。

## 历史诊断的查阅边界

以下为历史 UOS 诊断，成员存在不证明当前宿主签名/效果；按需分页。当前平台验证见 [验证范围](validation.md)。

# Writer / WPS API guide

诊断环境：UnionTech UOS 20 (1060) / WPS Office 2026 Summer Update 12.8.2.26885；WPS文字 12.0 Build 12.1.2.26885。

## API 根对象与常用入口

文字宿主：`wpsDocument` 是本次调用绑定的原生 Writer 文档，从它的 `Content`/`Range`/`Tables` 调查文本与结构。选区使用引用快照中的明确范围；写入段落、表格、格式必须放进 Render。`Application.ActiveDocument` 仅代表活动文档，不能代替绑定对象。

```js
const doc = wpsDocument;
return { name: doc.Name, text: doc.Content.Text };
```

## 显式探测结果（逐项）

状态说明：`支持`=报告中的探测成功；`缺失`=成员未提供；`存在但调用失败`=存在但报告所用调用失败。以下为历史报告，不能保证当前宿主可调用；只读成员可用查询检查，写操作成员的检查及调用只放进 Render，不能按表中通用建议在只读通道探测。

| 组 | 探测项目 / API | 结果 | 诊断细节 | 用法/建议 |
| --- | --- | --- | --- | --- |
| common | Application.Name | 支持 | string | `return Application.Name;` |
| common | Application.Version | 支持 | string | `return Application.Version;` |
| common | Application.Build | 支持 | string | `return Application.Build;` |
| common | Application.Path | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.StartupPath | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.OperatingSystem | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.UserName | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.ActiveWindow | 支持 | object | 活动窗口/选区的历史观测；绑定位置按 `wps_get_document` 或引用快照中的坐标从 `wpsDocument` 读取。 |
| common | Application.Windows | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Selection | 支持 | object | 活动窗口/选区的历史观测；绑定位置按 `wps_get_document` 或引用快照中的坐标从 `wpsDocument` 读取。 |
| common | Application.ApiEvent | 支持 | object | API 事件注册/注销；报告中“listener registration succeeded”表示注册成功，不代表具体事件参数结构已验证。 |
| common | Application.CommandBars | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.COMAddIns | 支持 | null | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Visible | 支持 | boolean | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.DisplayAlerts | 支持 | number | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.ScreenUpdating | 支持 | boolean | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.StatusBar | 支持 | null | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Caption | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.LanguageSettings | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Options | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.RecentFiles | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.FileDialog | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Undo | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Redo | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Run | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.OnTime | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.SendKeys | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Quit | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Activate | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Calculate | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.CalculateFull | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Documents | 支持 | object | 文字：`return Application.Documents.Count;` |
| common | Application.ActiveDocument | 支持 | object | 活动对象的历史观测；当前绑定文档使用 `wpsDocument`，不是此成员。 |
| common | Application.Workbooks | 缺失 | undefined | 本宿主诊断中未提供；不要直接使用。若目标版本不同，可在只读守卫允许时检查成员类型。 |
| common | Application.ActiveWorkbook | 缺失 | undefined | 活动对象的历史观测；当前绑定文档使用 `wpsDocument`，不是此成员。 |
| common | Application.Presentations | 缺失 | undefined | 本宿主诊断中未提供；不要直接使用。若目标版本不同，可在只读守卫允许时检查成员类型。 |
| common | Application.ActivePresentation | 缺失 | undefined | 活动对象的历史观测；当前绑定文档使用 `wpsDocument`，不是此成员。 |
| common | Application.Slides | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Sheets | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.AddCustomFunction | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.CreateTaskPane | 支持 | function | `Application.CreateTaskPane(url, title)` 创建任务窗格；报告仅验证成员存在，按需确认参数并避免信任不受信任 URL。 |
| common | Application.GetTaskPane | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.CreateWebDialog | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.GetWebDialog | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.ShowDialog | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.UpdateRibbon | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.FileSystem | 支持 | object | FileSystem 是本机文件能力；只在明确授权的流程使用，文件写入不是文档查询。 |
| common | Application.PluginStorage | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.WpsAddonMgr | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Execute | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.EtApplication | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.WppApplication | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.WpsApplication | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.GetApplication | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Application | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Enum | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.ApiEvent | 支持 | object | API 事件注册/注销；报告中“listener registration succeeded”表示注册成功，不代表具体事件参数结构已验证。 |
| common | Application.GetInstalledFonts | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.GetSystemInfo | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.GetEnvironment | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Invoke | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.InvokeAsHttp | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.InvokeAsHttps | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.CreateXHR | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.WpsInvoke | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.WpsClient | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.GetCustomFunctions | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.RemoveCustomFunction | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.RemoveAllCustomFunctions | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | ApiEvent.AddApiEventListener | 支持 | function | API 事件注册/注销；报告中“listener registration succeeded”表示注册成功，不代表具体事件参数结构已验证。 |
| common | ApiEvent.RemoveApiEventListener | 支持 | function | API 事件注册/注销；报告中“listener registration succeeded”表示注册成功，不代表具体事件参数结构已验证。 |
| events | DocumentOpen | 支持 | listener registration succeeded | 事件名 `DocumentOpen`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | DocumentBeforeClose | 支持 | listener registration succeeded | 事件名 `DocumentBeforeClose`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | DocumentBeforeSave | 支持 | listener registration succeeded | 事件名 `DocumentBeforeSave`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | DocumentAfterClose | 支持 | listener registration succeeded | 事件名 `DocumentAfterClose`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | DocumentChange | 支持 | listener registration succeeded | 事件名 `DocumentChange`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | WindowActivate | 支持 | listener registration succeeded | 事件名 `WindowActivate`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | WindowDeactivate | 支持 | listener registration succeeded | 事件名 `WindowDeactivate`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | WindowSelectionChange | 支持 | listener registration succeeded | 事件名 `WindowSelectionChange`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | NewDocument | 存在但调用失败 | Error: NewDocument is not a valid event name. | 事件名 `NewDocument`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | DocumentSync | 存在但调用失败 | Error: DocumentSync is not a valid event name. | 事件名 `DocumentSync`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | FileAfterSave | 支持 | listener registration succeeded | 事件名 `FileAfterSave`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| wps | Application.Documents | 支持 | object | 文字：`return Application.Documents.Count;` |
| wps | Application.ActiveDocument | 支持 | object | 活动对象的历史观测；当前绑定文档使用 `wpsDocument`，不是此成员。 |
| wps | Application.Selection | 支持 | object | 活动窗口/选区的历史观测；绑定位置按 `wps_get_document` 或引用快照中的坐标从 `wpsDocument` 读取。 |
| wps | Documents.Add | 支持 | function | 文字：仅在临时/测试文档或获授权的 Render 中调用 `Application.Documents.Add()`。 |
| wps | Create temporary document | 支持 | created | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| wps | Range.Text write | 支持 | — | 文字：使用 `wpsDocument.Content` 或按引用坐标取得的 `wpsDocument.Range(...)`；写入只放在 `wps_run_render` 中。 |
| wps | Range.Font.Bold write | 支持 | — | 文字：使用 `wpsDocument.Content` 或按引用坐标取得的 `wpsDocument.Range(...)`；写入只放在 `wps_run_render` 中。 |
| wps | Range.InsertAfter | 支持 | — | 文字：使用 `wpsDocument.Content` 或按引用坐标取得的 `wpsDocument.Range(...)`；写入只放在 `wps_run_render` 中。 |
| wps | Tables.Add | 支持 | — | 文字：用 `wpsDocument.Tables` 遍历表格；单元格文本写入只能在 `wps_run_render` 中。 |
| wps | Table.Cell.Range.Text write | 支持 | — | 文字：用 `wpsDocument.Tables` 遍历表格；单元格文本写入只能在 `wps_run_render` 中。 |
| wps | Range.Select | 支持 | — | 文字：使用 `wpsDocument.Content` 或按引用坐标取得的 `wpsDocument.Range(...)`；写入只放在 `wps_run_render` 中。 |
| wps | Find.Execute | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| wps | Temporary document close without save | 支持 | — | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.FileSystem | 支持 | object | FileSystem 是本机文件能力；只在明确授权的流程使用，文件写入不是文档查询。 |
| modern | Application.CreateTaskPane | 支持 | function | `Application.CreateTaskPane(url, title)` 创建任务窗格；报告仅验证成员存在，按需确认参数并避免信任不受信任 URL。 |
| modern | Application.GetTaskPane | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.CreateWebDialog | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.GetWebDialog | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.ShowDialog | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.UpdateRibbon | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.AddCustomFunction | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.PluginStorage | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.ApiEvent | 支持 | object | API 事件注册/注销；报告中“listener registration succeeded”表示注册成功，不代表具体事件参数结构已验证。 |

## 成员目录

以下对象名是诊断报告的分类标签，不是执行环境提供的变量。实际对象应从 `wpsDocument` 及其子对象取得；Application 的活动对象成员仅用于理解历史 API，不能作为绑定文档入口。

下表展示诊断脚本枚举到的 API 成员。类型是当时读取到的 JavaScript 值类型；除上面的显式探测项目外，不能据此断言签名或行为经过调用验证。

### `Application` (267 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| Activate | function | for-in | — | `Application.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ActivatePromeBrowserPage | function | for-in | — | `Application.ActivatePromeBrowserPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ActiveDocument | object | for-in | — | 读取 `Application.ActiveDocument`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveEncryptionSession | number | for-in | — | 读取 `Application.ActiveEncryptionSession`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveMainWindow | object | for-in | — | 读取 `Application.ActiveMainWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActivePrinter | string | for-in | — | 读取 `Application.ActivePrinter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveProtectedViewWindow | null | for-in | — | 读取 `Application.ActiveProtectedViewWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveWindow | object | for-in | — | 读取 `Application.ActiveWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AddAddress | function | for-in | — | `Application.AddAddress(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddIns | object | for-in | — | 读取 `Application.AddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AnswerWizard | object | for-in | — | 读取 `Application.AnswerWizard`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ApiEvent | object | for-in | — | 读取 `Application.ApiEvent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application | object | for-in | — | 读取 `Application.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ArbitraryXMLSupportAvailable | boolean | for-in | — | 读取 `Application.ArbitraryXMLSupportAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Arg2Json | function | for-in | — | `Application.Arg2Json(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Assistance | object | for-in | — | 读取 `Application.Assistance`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Assistant | object | for-in | — | 读取 `Application.Assistant`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoCaptions | object | for-in | — | 读取 `Application.AutoCaptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoCorrect | object | for-in | — | 读取 `Application.AutoCorrect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoCorrectEmail | object | for-in | — | 读取 `Application.AutoCorrectEmail`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutomaticChange | function | for-in | — | `Application.AutomaticChange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AutomationSecurity | number | for-in | — | 读取 `Application.AutomationSecurity`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BackgroundPrintingStatus | number | for-in | — | 读取 `Application.BackgroundPrintingStatus`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BackgroundSavingStatus | number | for-in | — | 读取 `Application.BackgroundSavingStatus`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Bibliography | object | for-in | — | 读取 `Application.Bibliography`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BrowseExtraFileTypes | string | for-in | — | 读取 `Application.BrowseExtraFileTypes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Browser | object | for-in | — | 读取 `Application.Browser`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BrowserGroups | object | for-in | — | 读取 `Application.BrowserGroups`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Build | string | for-in | — | 读取 `Application.Build`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BuildFeatureCrew | string | for-in | — | 读取 `Application.BuildFeatureCrew`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BuildFull | string | for-in | — | 读取 `Application.BuildFull`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BuildKeyCode | function | for-in | — | `Application.BuildKeyCode(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| COMAddIns | null | for-in | — | 读取 `Application.COMAddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CapsLock | boolean | for-in | — | 读取 `Application.CapsLock`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Caption | string | for-in | — | 读取 `Application.Caption`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CaptionLabels | object | for-in | — | 读取 `Application.CaptionLabels`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CentimetersToPoints | function | for-in | — | `Application.CentimetersToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ChangeFileOpenDirectory | function | for-in | — | `Application.ChangeFileOpenDirectory(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ChartDataPointTrack | boolean | for-in | — | 读取 `Application.ChartDataPointTrack`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CheckGrammar | function | for-in | — | `Application.CheckGrammar(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckLanguage | boolean | for-in | — | 读取 `Application.CheckLanguage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CheckSpelling | function | for-in | — | `Application.CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CleanString | function | for-in | — | `Application.CleanString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CommandBars | object | for-in | — | 读取 `Application.CommandBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CompareDocuments | function | for-in | — | `Application.CompareDocuments(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Compress | object | for-in | — | 读取 `Application.Compress`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CreateDataBuffer | function | for-in | — | `Application.CreateDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateObject | function | for-in | — | `Application.CreateObject(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreatePromeBrowserPage | function | for-in | — | `Application.CreatePromeBrowserPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreatePromeFakeTab | function | for-in | — | `Application.CreatePromeFakeTab(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateTaskPane | function | for-in | — | `Application.CreateTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateWebDialog | function | for-in | — | `Application.CreateWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Creator | number | for-in | — | 读取 `Application.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CurrentWPSAddIn | object | for-in | — | 读取 `Application.CurrentWPSAddIn`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomDictionaries | object | for-in | — | 读取 `Application.CustomDictionaries`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomDomain | string | for-in | — | 读取 `Application.CustomDomain`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomizationContext | object | for-in | — | 读取 `Application.CustomizationContext`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DDEExecute | function | for-in | — | `Application.DDEExecute(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DDEInitiate | function | for-in | — | `Application.DDEInitiate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DDEPoke | function | for-in | — | `Application.DDEPoke(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DDERequest | function | for-in | — | `Application.DDERequest(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DDETerminate | function | for-in | — | `Application.DDETerminate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DDETerminateAll | function | for-in | — | `Application.DDETerminateAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DefaultLegalBlackline | boolean | for-in | — | 读取 `Application.DefaultLegalBlackline`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultSaveFormat | string | for-in | — | 读取 `Application.DefaultSaveFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultTableSeparator | string | for-in | — | 读取 `Application.DefaultTableSeparator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultWebOptions | function | for-in | — | `Application.DefaultWebOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DeleteDataBuffer | function | for-in | — | `Application.DeleteDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dialogs | object | for-in | — | 读取 `Application.Dialogs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisableBackup | boolean | for-in | — | 读取 `Application.DisableBackup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DiscussionSupport | function | for-in | — | `Application.DiscussionSupport(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DisplayAlerts | number | for-in | — | 读取 `Application.DisplayAlerts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayAutoCompleteTips | boolean | for-in | — | 读取 `Application.DisplayAutoCompleteTips`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayDocumentInformationPanel | boolean | for-in | — | 读取 `Application.DisplayDocumentInformationPanel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayRecentFiles | boolean | for-in | — | 读取 `Application.DisplayRecentFiles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayScreenTips | boolean | for-in | — | 读取 `Application.DisplayScreenTips`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayScrollBars | boolean | for-in | — | 读取 `Application.DisplayScrollBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayStatusBar | boolean | for-in | — | 读取 `Application.DisplayStatusBar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Documents | object | for-in | — | 读取 `Application.Documents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DontResetInsertionPointProperties | boolean | for-in | — | 读取 `Application.DontResetInsertionPointProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Dummy1 | boolean | for-in | — | 读取 `Application.Dummy1`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Dummy2 | function | for-in | — | `Application.Dummy2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy4 | function | for-in | — | `Application.Dummy4(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| EmailOptions | object | for-in | — | 读取 `Application.EmailOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EmailTemplate | string | for-in | — | 读取 `Application.EmailTemplate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableCancelKey | number | for-in | — | 读取 `Application.EnableCancelKey`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Enum | object | for-in | — | 读取 `Application.Enum`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Env | object | for-in | — | 读取 `Application.Env`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ExecFunc | function | for-in | — | `Application.ExecFunc(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FeatureInstall | number | for-in | — | 读取 `Application.FeatureInstall`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileConverters | null | for-in | — | 读取 `Application.FileConverters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileDialog | function | for-in | — | `Application.FileDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FileSearch | object | for-in | — | 读取 `Application.FileSearch`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileSystem | object | for-in | — | 读取 `Application.FileSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileValidation | number | for-in | — | 读取 `Application.FileValidation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FindKey | function | for-in | — | `Application.FindKey(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FocusInMailHeader | boolean | for-in | — | 读取 `Application.FocusInMailHeader`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FontNames | object | for-in | — | 读取 `Application.FontNames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GetAddress | function | for-in | — | `Application.GetAddress(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetApplicationEx | function | for-in | — | `Application.GetApplicationEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetDataBuffer | function | for-in | — | `Application.GetDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetDefaultTheme | function | for-in | — | `Application.GetDefaultTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetJSReturnValue | function | for-in | — | `Application.GetJSReturnValue(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetPrintersList | function | for-in | — | `Application.GetPrintersList(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetSpellingSuggestions | function | for-in | — | `Application.GetSpellingSuggestions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetTaskPane | function | for-in | — | `Application.GetTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetWebDialog | function | for-in | — | `Application.GetWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GoBack | function | for-in | — | `Application.GoBack(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GoForward | function | for-in | — | `Application.GoForward(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| HangulHanjaDictionaries | null | for-in | — | 读取 `Application.HangulHanjaDictionaries`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Height | number | for-in | — | 读取 `Application.Height`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Help | function | for-in | — | `Application.Help(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| HelpTool | function | for-in | — | `Application.HelpTool(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InchesToPoints | function | for-in | — | `Application.InchesToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InfoCollect | object | for-in | — | 读取 `Application.InfoCollect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| International | function | for-in | — | `Application.International(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| IsLastIOBroken | number | for-in | — | 读取 `Application.IsLastIOBroken`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IsObjectValid | function | for-in | — | `Application.IsObjectValid(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| IsSandboxed | boolean | for-in | — | 读取 `Application.IsSandboxed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| JS2Variant | function | for-in | — | `Application.JS2Variant(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| JSIDE | null | for-in | — | 读取 `Application.JSIDE`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| KeyBindings | object | for-in | — | 读取 `Application.KeyBindings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| KeyString | function | for-in | — | `Application.KeyString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Keyboard | function | for-in | — | `Application.Keyboard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| KeyboardBidi | function | for-in | — | `Application.KeyboardBidi(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| KeyboardLatin | function | for-in | — | `Application.KeyboardLatin(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| KeysBoundTo | function | for-in | — | `Application.KeysBoundTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| LandscapeFontNames | object | for-in | — | 读取 `Application.LandscapeFontNames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Language | number | for-in | — | 读取 `Application.Language`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageSettings | object | for-in | — | 读取 `Application.LanguageSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Languages | null | for-in | — | 读取 `Application.Languages`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Left | number | for-in | — | 读取 `Application.Left`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LinesToPoints | function | for-in | — | `Application.LinesToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ListCommands | function | for-in | — | `Application.ListCommands(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ListGalleries | object | for-in | — | 读取 `Application.ListGalleries`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LoadMasterList | function | for-in | — | `Application.LoadMasterList(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| LookupNameProperties | function | for-in | — | `Application.LookupNameProperties(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MAPIAvailable | boolean | for-in | — | 读取 `Application.MAPIAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MacroContainer | null | for-in | — | 读取 `Application.MacroContainer`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MailMessage | object | for-in | — | 读取 `Application.MailMessage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MailSystem | number | for-in | — | 读取 `Application.MailSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MailingLabel | object | for-in | — | 读取 `Application.MailingLabel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MainWindows | object | for-in | — | 读取 `Application.MainWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MathCoprocessorAvailable | boolean | for-in | — | 读取 `Application.MathCoprocessorAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MergeDocuments | function | for-in | — | `Application.MergeDocuments(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MillimetersToPoints | function | for-in | — | `Application.MillimetersToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MountVolume | function | for-in | — | `Application.MountVolume(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MouseAvailable | boolean | for-in | — | 读取 `Application.MouseAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Move | function | for-in | — | `Application.Move(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Name | string | for-in | — | 读取 `Application.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NewDocument | object | for-in | — | 读取 `Application.NewDocument`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NewEnum | object | for-in | — | 读取 `Application.NewEnum`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NewWindow | function | for-in | — | `Application.NewWindow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| NextLetter | function | for-in | — | `Application.NextLetter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| NormalTemplate | object | for-in | — | 读取 `Application.NormalTemplate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NumLock | boolean | for-in | — | 读取 `Application.NumLock`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OAAssist | object | for-in | — | 读取 `Application.OAAssist`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMathAutoCorrect | object | for-in | — | 读取 `Application.OMathAutoCorrect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OfdExportOptions | object | for-in | — | 读取 `Application.OfdExportOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Office | object | for-in | — | 读取 `Application.Office`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnTime | function | for-in | — | `Application.OnTime(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OpenAttachmentsInFullScreen | boolean | for-in | — | 读取 `Application.OpenAttachmentsInFullScreen`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OpenFileLocationInStartPage | function | for-in | — | `Application.OpenFileLocationInStartPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OpenWebUrl | function | for-in | — | `Application.OpenWebUrl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Options | object | for-in | — | 读取 `Application.Options`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OrganizerCopy | function | for-in | — | `Application.OrganizerCopy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OrganizerDelete | function | for-in | — | `Application.OrganizerDelete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OrganizerRename | function | for-in | — | `Application.OrganizerRename(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Parent | object | for-in | — | 读取 `Application.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Path | string | for-in | — | 读取 `Application.Path`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PathSeparator | string | for-in | — | 读取 `Application.PathSeparator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PdfExportOptions | object | for-in | — | 读取 `Application.PdfExportOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PicasToPoints | function | for-in | — | `Application.PicasToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PickerDialog | object | for-in | — | 读取 `Application.PickerDialog`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PixelsToPoints | function | for-in | — | `Application.PixelsToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PluginStorage | object | for-in | — | 读取 `Application.PluginStorage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PointsToCentimeters | function | for-in | — | `Application.PointsToCentimeters(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PointsToInches | function | for-in | — | `Application.PointsToInches(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PointsToLines | function | for-in | — | `Application.PointsToLines(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PointsToMillimeters | function | for-in | — | `Application.PointsToMillimeters(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PointsToPicas | function | for-in | — | `Application.PointsToPicas(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PointsToPixels | function | for-in | — | `Application.PointsToPixels(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PortraitFontNames | object | for-in | — | 读取 `Application.PortraitFontNames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PrintOut | function | for-in | — | `Application.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintOut2000 | function | for-in | — | `Application.PrintOut2000(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintOutOld | function | for-in | — | `Application.PrintOutOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintPreview | boolean | for-in | — | 读取 `Application.PrintPreview`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ProductCode | function | for-in | — | `Application.ProductCode(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PromeAddPage | function | for-in | — | `Application.PromeAddPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PromeName | string | for-in | — | 读取 `Application.PromeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PromeNewDocument | function | for-in | — | `Application.PromeNewDocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PromeTidyModeChange | function | for-in | — | `Application.PromeTidyModeChange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ProtectEyes | boolean | for-in | — | 读取 `Application.ProtectEyes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ProtectedViewWindows | object | for-in | — | 读取 `Application.ProtectedViewWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PutFocusInMailHeader | function | for-in | — | `Application.PutFocusInMailHeader(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Quit | function | for-in | — | `Application.Quit(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RecentFiles | object | for-in | — | 读取 `Application.RecentFiles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Repeat | function | for-in | — | `Application.Repeat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ResetIgnoreAll | function | for-in | — | `Application.ResetIgnoreAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Resize | function | for-in | — | `Application.Resize(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RestrictLinkedStyles | boolean | for-in | — | 读取 `Application.RestrictLinkedStyles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Run | function | for-in | — | `Application.Run(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RunOld | function | for-in | — | `Application.RunOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ScreenRefresh | function | for-in | — | `Application.ScreenRefresh(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ScreenUpdating | boolean | for-in | — | 读取 `Application.ScreenUpdating`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Selection | object | for-in | — | 读取 `Application.Selection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SendFax | function | for-in | — | `Application.SendFax(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SetDefaultTheme | function | for-in | — | `Application.SetDefaultTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowAnimation | boolean | for-in | — | 读取 `Application.ShowAnimation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowClipboard | function | for-in | — | `Application.ShowClipboard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowDialog | function | for-in | — | `Application.ShowDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowDialogEx | function | for-in | — | `Application.ShowDialogEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowExceptionError | function | for-in | — | `Application.ShowExceptionError(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowMe | function | for-in | — | `Application.ShowMe(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowStartupDialog | boolean | for-in | — | 读取 `Application.ShowStartupDialog`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowStylePreviews | boolean | for-in | — | 读取 `Application.ShowStylePreviews`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowVisualBasicEditor | boolean | for-in | — | 读取 `Application.ShowVisualBasicEditor`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowWindowsInTaskbar | boolean | for-in | — | 读取 `Application.ShowWindowsInTaskbar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartArtColors | object | for-in | — | 读取 `Application.SmartArtColors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartArtLayouts | object | for-in | — | 读取 `Application.SmartArtLayouts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartArtQuickStyles | object | for-in | — | 读取 `Application.SmartArtQuickStyles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartTagRecognizers | object | for-in | — | 读取 `Application.SmartTagRecognizers`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartTagTypes | object | for-in | — | 读取 `Application.SmartTagTypes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SpecialMode | boolean | for-in | — | 读取 `Application.SpecialMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StartAccess | function | for-in | — | `Application.StartAccess(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| StartupPath | string | for-in | — | 读取 `Application.StartupPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StatusBar | null | for-in | — | 读取 `Application.StatusBar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SubstituteFont | function | for-in | — | `Application.SubstituteFont(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SynonymInfo | function | for-in | — | `Application.SynonymInfo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| System | object | for-in | — | 读取 `Application.System`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TabPages | object | for-in | — | 读取 `Application.TabPages`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TaskPanes | object | for-in | — | 读取 `Application.TaskPanes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TaskPanesEx | object | for-in | — | 读取 `Application.TaskPanesEx`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Tasks | object | for-in | — | 读取 `Application.Tasks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Templates | object | for-in | — | 读取 `Application.Templates`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ThisBrowser | object | for-in | — | 读取 `Application.ThisBrowser`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ThreeWayMerge | function | for-in | — | `Application.ThreeWayMerge(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ToggleKeyboard | function | for-in | — | `Application.ToggleKeyboard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Top | number | for-in | — | 读取 `Application.Top`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UndoRecord | object | for-in | — | 读取 `Application.UndoRecord`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UpdateRibbon | function | for-in | — | `Application.UpdateRibbon(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UsableHeight | number | for-in | — | 读取 `Application.UsableHeight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UsableWidth | number | for-in | — | 读取 `Application.UsableWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UserAddress | string | for-in | — | 读取 `Application.UserAddress`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UserControl | boolean | for-in | — | 读取 `Application.UserControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UserInitials | string | for-in | — | 读取 `Application.UserInitials`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UserName | string | for-in | — | 读取 `Application.UserName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Version | string | for-in | — | 读取 `Application.Version`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Visible | boolean | for-in | — | 读取 `Application.Visible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WPSAddIns | object | for-in | — | 读取 `Application.WPSAddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WPSCloudService | object | for-in | — | 读取 `Application.WPSCloudService`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WebJS2Variant | function | for-in | — | `Application.WebJS2Variant(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| WebShape | null | for-in | — | 读取 `Application.WebShape`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Width | number | for-in | — | 读取 `Application.Width`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WindowState | number | for-in | — | 读取 `Application.WindowState`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Windows | object | for-in | — | 读取 `Application.Windows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WordBasic | object | for-in | — | 读取 `Application.WordBasic`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WpsAccount | object | for-in | — | 读取 `Application.WpsAccount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WpsApplication | function | for-in | — | `Application.WpsApplication(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| WpsConfig | object | for-in | — | 读取 `Application.WpsConfig`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WpsHttpRequests | object | for-in | — | 读取 `Application.WpsHttpRequests`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WrapCallbackArg | function | for-in | — | `Application.WrapCallbackArg(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| XMLNamespaces | object | for-in | — | 读取 `Application.XMLNamespaces`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| alert | function | for-in | — | `Application.alert(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| confirm | function | for-in | — | `Application.confirm(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| prompt | function | for-in | — | `Application.prompt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ribbonUI | object | for-in | — | 读取 `Application.ribbonUI`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |

### `ApiEvent` (4 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| AddApiEventListener | function | for-in | — | `ApiEvent.AddApiEventListener(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Cancel | boolean | for-in | — | 读取 `ApiEvent.Cancel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RemoveApiEventListener | function | for-in | — | `ApiEvent.RemoveApiEventListener(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RightsInfo | number | for-in | — | 读取 `ApiEvent.RightsInfo`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |

### `FileSystem` (26 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| AppendFile | function | for-in | — | `FileSystem.AppendFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Exists | function | for-in | — | `FileSystem.Exists(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Mkdir | function | for-in | — | `FileSystem.Mkdir(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReadFile | function | for-in | — | `FileSystem.ReadFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReadFileAsArrayBuffer | function | for-in | — | `FileSystem.ReadFileAsArrayBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Remove | function | for-in | — | `FileSystem.Remove(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| WriteFile | function | for-in | — | `FileSystem.WriteFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| absoluteFilePath | function | for-in | — | `FileSystem.absoluteFilePath(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| absolutePath | function | for-in | — | `FileSystem.absolutePath(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| constants | object | for-in | — | 读取 `FileSystem.constants`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| copyFileSync | function | for-in | — | `FileSystem.copyFileSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| existsSync | function | for-in | — | `FileSystem.existsSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| isWritable | function | for-in | — | `FileSystem.isWritable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| mkdirSync | function | for-in | — | `FileSystem.mkdirSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| mkdtempSync | function | for-in | — | `FileSystem.mkdtempSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| readAsBinaryString | function | for-in | — | `FileSystem.readAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| readFileString | function | for-in | — | `FileSystem.readFileString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| readdirSync | function | for-in | — | `FileSystem.readdirSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| rmdirSync | function | for-in | — | `FileSystem.rmdirSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| stat | function | for-in | — | `FileSystem.stat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| tmpdir | function | for-in | — | `FileSystem.tmpdir(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| toNativeSeparators | function | for-in | — | `FileSystem.toNativeSeparators(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| unlinkSync | function | for-in | — | `FileSystem.unlinkSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| writeAsBinaryString | function | for-in | — | `FileSystem.writeAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| writeFileString | function | for-in | — | `FileSystem.writeFileString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| writeSliceAsBinaryString | function | for-in | — | `FileSystem.writeSliceAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |

### `Document` (350 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| AcceptAllRevisions | function | for-in | — | `Document.AcceptAllRevisions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AcceptAllRevisionsShown | function | for-in | — | `Document.AcceptAllRevisionsShown(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Activate | function | for-in | — | `Document.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ActiveTheme | string | for-in | — | 读取 `Document.ActiveTheme`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveThemeDisplayName | string | for-in | — | 读取 `Document.ActiveThemeDisplayName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveWindow | object | for-in | — | 读取 `Document.ActiveWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveWritingStyle | function | for-in | — | `Document.ActiveWritingStyle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddDocumentWorkspaceHeader | function | for-in | — | `Document.AddDocumentWorkspaceHeader(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddMeetingWorkspaceHeader | function | for-in | — | `Document.AddMeetingWorkspaceHeader(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddToFavorites | function | for-in | — | `Document.AddToFavorites(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ApiEvent | object | for-in | — | 读取 `Document.ApiEvent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application | object | for-in | — | 读取 `Document.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ApplyDocumentTheme | function | for-in | — | `Document.ApplyDocumentTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ApplyQuickStyleSet | function | for-in | — | `Document.ApplyQuickStyleSet(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ApplyQuickStyleSet2 | function | for-in | — | `Document.ApplyQuickStyleSet2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ApplyTheme | function | for-in | — | `Document.ApplyTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AttachedTemplate | object | for-in | — | 读取 `Document.AttachedTemplate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoFormat | function | for-in | — | `Document.AutoFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AutoFormatOverride | boolean | for-in | — | 读取 `Document.AutoFormatOverride`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoHyphenation | boolean | for-in | — | 读取 `Document.AutoHyphenation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoSummarize | function | for-in | — | `Document.AutoSummarize(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Background | object | for-in | — | 读取 `Document.Background`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Bibliography | object | for-in | — | 读取 `Document.Bibliography`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Bookmarks | object | for-in | — | 读取 `Document.Bookmarks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Broadcast | object | for-in | — | 读取 `Document.Broadcast`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BuiltInDocumentProperties | object | for-in | — | 读取 `Document.BuiltInDocumentProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CanCheckin | function | for-in | — | `Document.CanCheckin(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Characters | object | for-in | — | 读取 `Document.Characters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ChartDataPointTrack | boolean | for-in | — | 读取 `Document.ChartDataPointTrack`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CheckConsistency | function | for-in | — | `Document.CheckConsistency(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckGrammar | function | for-in | — | `Document.CheckGrammar(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckIn | function | for-in | — | `Document.CheckIn(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckInWithVersion | function | for-in | — | `Document.CheckInWithVersion(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckNewSmartTags | function | for-in | — | `Document.CheckNewSmartTags(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckSpelling | function | for-in | — | `Document.CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ChildNodeSuggestions | object | for-in | — | 读取 `Document.ChildNodeSuggestions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ClearStyleInstance | function | for-in | — | `Document.ClearStyleInstance(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClickAndTypeParagraphStyle | string | for-in | — | 读取 `Document.ClickAndTypeParagraphStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Close | function | for-in | — | `Document.Close(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClosePrintPreview | function | for-in | — | `Document.ClosePrintPreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CoAuthoring | object | for-in | — | 读取 `Document.CoAuthoring`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CodeName | string | for-in | — | 读取 `Document.CodeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CommandBars | object | for-in | — | 读取 `Document.CommandBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Comments | object | for-in | — | 读取 `Document.Comments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Compare | function | for-in | — | `Document.Compare(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Compare2000 | function | for-in | — | `Document.Compare2000(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Compare2002 | function | for-in | — | `Document.Compare2002(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Compatibility | function | for-in | — | `Document.Compatibility(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CompatibilityMode | number | for-in | — | 读取 `Document.CompatibilityMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ComputeStatistics | function | for-in | — | `Document.ComputeStatistics(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ConsecutiveHyphensLimit | number | for-in | — | 读取 `Document.ConsecutiveHyphensLimit`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Container | null | for-in | — | 读取 `Document.Container`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Content | object | for-in | — | 读取 `Document.Content`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ContentControls | object | for-in | — | 读取 `Document.ContentControls`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ContentTypeProperties | object | for-in | — | 读取 `Document.ContentTypeProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Convert | function | for-in | — | `Document.Convert(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ConvertAutoHyphens | function | for-in | — | `Document.ConvertAutoHyphens(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ConvertNumbersToText | function | for-in | — | `Document.ConvertNumbersToText(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ConvertVietDoc | function | for-in | — | `Document.ConvertVietDoc(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CopyStylesFromTemplate | function | for-in | — | `Document.CopyStylesFromTemplate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CountNumberedItems | function | for-in | — | `Document.CountNumberedItems(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateLetterContent | function | for-in | — | `Document.CreateLetterContent(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Creator | number | for-in | — | 读取 `Document.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CurrentRsid | number | for-in | — | 读取 `Document.CurrentRsid`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomDocumentProperties | object | for-in | — | 读取 `Document.CustomDocumentProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomXMLParts | object | for-in | — | 读取 `Document.CustomXMLParts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DataForm | function | for-in | — | `Document.DataForm(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DefaultTabStop | number | for-in | — | 读取 `Document.DefaultTabStop`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultTableStyle | null | for-in | — | 读取 `Document.DefaultTableStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultTargetFrame | string | for-in | — | 读取 `Document.DefaultTargetFrame`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DeleteAllComments | function | for-in | — | `Document.DeleteAllComments(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DeleteAllCommentsShown | function | for-in | — | `Document.DeleteAllCommentsShown(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DeleteAllEditableRanges | function | for-in | — | `Document.DeleteAllEditableRanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DeleteAllInkAnnotations | function | for-in | — | `Document.DeleteAllInkAnnotations(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DetectLanguage | function | for-in | — | `Document.DetectLanguage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DisableFeatures | boolean | for-in | — | 读取 `Document.DisableFeatures`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisableFeaturesIntroducedAfter | number | for-in | — | 读取 `Document.DisableFeaturesIntroducedAfter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DoNotEmbedSystemFonts | boolean | for-in | — | 读取 `Document.DoNotEmbedSystemFonts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DocID | number | for-in | — | 读取 `Document.DocID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DocumentFields | object | for-in | — | 读取 `Document.DocumentFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DocumentInspectors | object | for-in | — | 读取 `Document.DocumentInspectors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DocumentLibraryVersions | object | for-in | — | 读取 `Document.DocumentLibraryVersions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DocumentTheme | object | for-in | — | 读取 `Document.DocumentTheme`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DowngradeDocument | function | for-in | — | `Document.DowngradeDocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy1 | null | for-in | — | 读取 `Document.Dummy1`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Dummy2 | function | for-in | — | `Document.Dummy2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy3 | null | for-in | — | 读取 `Document.Dummy3`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Dummy4 | function | for-in | — | `Document.Dummy4(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| EditionOptions | function | for-in | — | `Document.EditionOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Email | object | for-in | — | 读取 `Document.Email`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EmbedLinguisticData | boolean | for-in | — | 读取 `Document.EmbedLinguisticData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EmbedSmartTags | boolean | for-in | — | 读取 `Document.EmbedSmartTags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EmbedTrueTypeFonts | boolean | for-in | — | 读取 `Document.EmbedTrueTypeFonts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EncryptionProvider | string | for-in | — | 读取 `Document.EncryptionProvider`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EndReview | function | for-in | — | `Document.EndReview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Endnotes | object | for-in | — | 读取 `Document.Endnotes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnforceStyle | boolean | for-in | — | 读取 `Document.EnforceStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Envelope | object | for-in | — | 读取 `Document.Envelope`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ExportAsFixedFormat | function | for-in | — | `Document.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExportAsFixedFormatPassword | function | for-in | — | `Document.ExportAsFixedFormatPassword(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FarEastLineBreakLanguage | number | for-in | — | 读取 `Document.FarEastLineBreakLanguage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FarEastLineBreakLevel | number | for-in | — | 读取 `Document.FarEastLineBreakLevel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Fields | object | for-in | — | 读取 `Document.Fields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Final | boolean | for-in | — | 读取 `Document.Final`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FitToPages | function | for-in | — | `Document.FitToPages(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FollowHyperlink | function | for-in | — | `Document.FollowHyperlink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Footnotes | object | for-in | — | 读取 `Document.Footnotes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormFields | object | for-in | — | 读取 `Document.FormFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormattingShowClear | boolean | for-in | — | 读取 `Document.FormattingShowClear`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormattingShowFilter | number | for-in | — | 读取 `Document.FormattingShowFilter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormattingShowFont | boolean | for-in | — | 读取 `Document.FormattingShowFont`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormattingShowNextLevel | boolean | for-in | — | 读取 `Document.FormattingShowNextLevel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormattingShowNumbering | boolean | for-in | — | 读取 `Document.FormattingShowNumbering`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormattingShowParagraph | boolean | for-in | — | 读取 `Document.FormattingShowParagraph`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormattingShowUserStyleName | boolean | for-in | — | 读取 `Document.FormattingShowUserStyleName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormsDesign | boolean | for-in | — | 读取 `Document.FormsDesign`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ForwardMailer | function | for-in | — | `Document.ForwardMailer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Frames | object | for-in | — | 读取 `Document.Frames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Frameset | object | for-in | — | 读取 `Document.Frameset`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FreezeLayout | function | for-in | — | `Document.FreezeLayout(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FullName | string | for-in | — | 读取 `Document.FullName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GetCrossReferenceItems | function | for-in | — | `Document.GetCrossReferenceItems(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetDocumentEx | function | for-in | — | `Document.GetDocumentEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetLetterContent | function | for-in | — | `Document.GetLetterContent(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetWorkflowTasks | function | for-in | — | `Document.GetWorkflowTasks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetWorkflowTemplates | function | for-in | — | `Document.GetWorkflowTemplates(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GoTo | function | for-in | — | `Document.GoTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GrammarChecked | boolean | for-in | — | 读取 `Document.GrammarChecked`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GrammaticalErrors | object | for-in | — | 读取 `Document.GrammaticalErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GridDistanceHorizontal | number | for-in | — | 读取 `Document.GridDistanceHorizontal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GridDistanceVertical | number | for-in | — | 读取 `Document.GridDistanceVertical`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GridOriginFromMargin | boolean | for-in | — | 读取 `Document.GridOriginFromMargin`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GridOriginHorizontal | number | for-in | — | 读取 `Document.GridOriginHorizontal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GridOriginVertical | number | for-in | — | 读取 `Document.GridOriginVertical`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GridSpaceBetweenHorizontalLines | number | for-in | — | 读取 `Document.GridSpaceBetweenHorizontalLines`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GridSpaceBetweenVerticalLines | number | for-in | — | 读取 `Document.GridSpaceBetweenVerticalLines`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HTMLDivisions | object | for-in | — | 读取 `Document.HTMLDivisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HTMLProject | object | for-in | — | 读取 `Document.HTMLProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasMailer | boolean | for-in | — | 读取 `Document.HasMailer`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasPassword | boolean | for-in | — | 读取 `Document.HasPassword`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasRoutingSlip | boolean | for-in | — | 读取 `Document.HasRoutingSlip`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasVBProject | boolean | for-in | — | 读取 `Document.HasVBProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Hyperlinks | object | for-in | — | 读取 `Document.Hyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HyphenateCaps | boolean | for-in | — | 读取 `Document.HyphenateCaps`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HyphenationZone | number | for-in | — | 读取 `Document.HyphenationZone`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Indexes | object | for-in | — | 读取 `Document.Indexes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| InlineShapes | object | for-in | — | 读取 `Document.InlineShapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| InvalidateRightsInfo | function | for-in | — | `Document.InvalidateRightsInfo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| IsInAutosave | boolean | for-in | — | 读取 `Document.IsInAutosave`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IsMasterDocument | boolean | for-in | — | 读取 `Document.IsMasterDocument`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IsSubdocument | boolean | for-in | — | 读取 `Document.IsSubdocument`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| JSProject | null | for-in | — | 读取 `Document.JSProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| JustificationMode | number | for-in | — | 读取 `Document.JustificationMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| KerningByAlgorithm | boolean | for-in | — | 读取 `Document.KerningByAlgorithm`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Kind | number | for-in | — | 读取 `Document.Kind`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageDetected | boolean | for-in | — | 读取 `Document.LanguageDetected`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ListParagraphs | object | for-in | — | 读取 `Document.ListParagraphs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ListTemplates | object | for-in | — | 读取 `Document.ListTemplates`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Lists | object | for-in | — | 读取 `Document.Lists`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LockQuickStyleSet | boolean | for-in | — | 读取 `Document.LockQuickStyleSet`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LockServerFile | function | for-in | — | `Document.LockServerFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| LockTheme | boolean | for-in | — | 读取 `Document.LockTheme`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MailEnvelope | null | for-in | — | 读取 `Document.MailEnvelope`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MailMerge | object | for-in | — | 读取 `Document.MailMerge`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Mailer | object | for-in | — | 读取 `Document.Mailer`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MakeCompatibilityDefault | function | for-in | — | `Document.MakeCompatibilityDefault(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ManualHyphenation | function | for-in | — | `Document.ManualHyphenation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Merge | function | for-in | — | `Document.Merge(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Merge2000 | function | for-in | — | `Document.Merge2000(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Name | string | for-in | — | 读取 `Document.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NoLineBreakAfter | string | for-in | — | 读取 `Document.NoLineBreakAfter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NoLineBreakBefore | string | for-in | — | 读取 `Document.NoLineBreakBefore`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMathBreakBin | number | for-in | — | 读取 `Document.OMathBreakBin`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMathBreakSub | number | for-in | — | 读取 `Document.OMathBreakSub`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMathFontName | string | for-in | — | 读取 `Document.OMathFontName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMathIntSubSupLim | boolean | for-in | — | 读取 `Document.OMathIntSubSupLim`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMathJc | number | for-in | — | 读取 `Document.OMathJc`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMathLeftMargin | number | for-in | — | 读取 `Document.OMathLeftMargin`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMathNarySupSubLim | boolean | for-in | — | 读取 `Document.OMathNarySupSubLim`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMathRightMargin | number | for-in | — | 读取 `Document.OMathRightMargin`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMathSmallFrac | boolean | for-in | — | 读取 `Document.OMathSmallFrac`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMathWrap | number | for-in | — | 读取 `Document.OMathWrap`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMaths | object | for-in | — | 读取 `Document.OMaths`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OpenEncoding | number | for-in | — | 读取 `Document.OpenEncoding`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OptimizeForWord97 | boolean | for-in | — | 读取 `Document.OptimizeForWord97`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OriginalDocumentTitle | string | for-in | — | 读取 `Document.OriginalDocumentTitle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PageSetup | object | for-in | — | 读取 `Document.PageSetup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Paragraphs | object | for-in | — | 读取 `Document.Paragraphs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parent | object | for-in | — | 读取 `Document.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Password | null | for-in | — | 读取 `Document.Password`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PasswordEncryptionAlgorithm | string | for-in | — | 读取 `Document.PasswordEncryptionAlgorithm`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PasswordEncryptionFileProperties | boolean | for-in | — | 读取 `Document.PasswordEncryptionFileProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PasswordEncryptionKeyLength | number | for-in | — | 读取 `Document.PasswordEncryptionKeyLength`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PasswordEncryptionProvider | string | for-in | — | 读取 `Document.PasswordEncryptionProvider`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Path | string | for-in | — | 读取 `Document.Path`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Permission | object | for-in | — | 读取 `Document.Permission`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Post | function | for-in | — | `Document.Post(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PresentIt | function | for-in | — | `Document.PresentIt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintFormsData | boolean | for-in | — | 读取 `Document.PrintFormsData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PrintFractionalWidths | boolean | for-in | — | 读取 `Document.PrintFractionalWidths`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PrintOut | function | for-in | — | `Document.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintOut2000 | function | for-in | — | `Document.PrintOut2000(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintOutOld | function | for-in | — | `Document.PrintOutOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintPostScriptOverText | boolean | for-in | — | 读取 `Document.PrintPostScriptOverText`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PrintPreview | function | for-in | — | `Document.PrintPreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintRevisions | boolean | for-in | — | 读取 `Document.PrintRevisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Protect | function | for-in | — | `Document.Protect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Protect2002 | function | for-in | — | `Document.Protect2002(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ProtectionType | number | for-in | — | 读取 `Document.ProtectionType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Range | function | for-in | — | `Document.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReadOnly | boolean | for-in | — | 读取 `Document.ReadOnly`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ReadOnlyRecommended | boolean | for-in | — | 读取 `Document.ReadOnlyRecommended`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ReadabilityStatistics | object | for-in | — | 读取 `Document.ReadabilityStatistics`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ReadingLayoutSizeX | number | for-in | — | 读取 `Document.ReadingLayoutSizeX`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ReadingLayoutSizeY | number | for-in | — | 读取 `Document.ReadingLayoutSizeY`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ReadingModeLayoutFrozen | boolean | for-in | — | 读取 `Document.ReadingModeLayoutFrozen`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RecheckSmartTags | function | for-in | — | `Document.RecheckSmartTags(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Redo | function | for-in | — | `Document.Redo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RejectAllRevisions | function | for-in | — | `Document.RejectAllRevisions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RejectAllRevisionsShown | function | for-in | — | `Document.RejectAllRevisionsShown(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Reload | function | for-in | — | `Document.Reload(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReloadAs | function | for-in | — | `Document.ReloadAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RemoveDateAndTime | null | for-in | — | 读取 `Document.RemoveDateAndTime`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RemoveDocumentInformation | function | for-in | — | `Document.RemoveDocumentInformation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RemoveDocumentWorkspaceHeader | function | for-in | — | `Document.RemoveDocumentWorkspaceHeader(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RemoveLockedStyles | function | for-in | — | `Document.RemoveLockedStyles(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RemoveNumbers | function | for-in | — | `Document.RemoveNumbers(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RemovePersonalInformation | boolean | for-in | — | 读取 `Document.RemovePersonalInformation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RemoveSmartTags | function | for-in | — | `Document.RemoveSmartTags(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RemoveTheme | function | for-in | — | `Document.RemoveTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Repaginate | function | for-in | — | `Document.Repaginate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Reply | function | for-in | — | `Document.Reply(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReplyAll | function | for-in | — | `Document.ReplyAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReplyWithChanges | function | for-in | — | `Document.ReplyWithChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Research | object | for-in | — | 读取 `Document.Research`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ResetFormFields | function | for-in | — | `Document.ResetFormFields(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReturnToLastReadPosition | function | for-in | — | `Document.ReturnToLastReadPosition(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RevisedDocumentTitle | string | for-in | — | 读取 `Document.RevisedDocumentTitle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Revisions | object | for-in | — | 读取 `Document.Revisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Route | function | for-in | — | `Document.Route(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Routed | boolean | for-in | — | 读取 `Document.Routed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RoutingSlip | object | for-in | — | 读取 `Document.RoutingSlip`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RunAutoMacro | function | for-in | — | `Document.RunAutoMacro(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RunLetterWizard | function | for-in | — | `Document.RunLetterWizard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Save | function | for-in | — | `Document.Save(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveAs | function | for-in | — | `Document.SaveAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveAs2 | function | for-in | — | `Document.SaveAs2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveAs2000 | function | for-in | — | `Document.SaveAs2000(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveAsBinaryString | function | for-in | — | `Document.SaveAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveAsQuickStyleSet | function | for-in | — | `Document.SaveAsQuickStyleSet(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveAsUrl | function | for-in | — | `Document.SaveAsUrl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveCopyAs | function | for-in | — | `Document.SaveCopyAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveEncoding | number | for-in | — | 读取 `Document.SaveEncoding`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SaveFormat | number | for-in | — | 读取 `Document.SaveFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SaveFormsData | boolean | for-in | — | 读取 `Document.SaveFormsData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SaveSubsetFonts | boolean | for-in | — | 读取 `Document.SaveSubsetFonts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Saved | boolean | for-in | — | 读取 `Document.Saved`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Scripts | object | for-in | — | 读取 `Document.Scripts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Sections | object | for-in | — | 读取 `Document.Sections`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Select | function | for-in | — | `Document.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectAllEditableRanges | function | for-in | — | `Document.SelectAllEditableRanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectContentControlsByTag | function | for-in | — | `Document.SelectContentControlsByTag(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectContentControlsByTitle | function | for-in | — | `Document.SelectContentControlsByTitle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectLinkedControls | function | for-in | — | `Document.SelectLinkedControls(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectNodes | function | for-in | — | `Document.SelectNodes(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectSingleNode | function | for-in | — | `Document.SelectSingleNode(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectStyleInstance | function | for-in | — | `Document.SelectStyleInstance(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectUnlinkedControls | function | for-in | — | `Document.SelectUnlinkedControls(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SendFax | function | for-in | — | `Document.SendFax(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SendFaxOverInternet | function | for-in | — | `Document.SendFaxOverInternet(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SendForReview | function | for-in | — | `Document.SendForReview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SendMail | function | for-in | — | `Document.SendMail(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SendMailer | function | for-in | — | `Document.SendMailer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Sentences | object | for-in | — | 读取 `Document.Sentences`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ServerPolicy | object | for-in | — | 读取 `Document.ServerPolicy`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SetCompatibilityMode | function | for-in | — | `Document.SetCompatibilityMode(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SetDefaultTableStyle | function | for-in | — | `Document.SetDefaultTableStyle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SetLetterContent | function | for-in | — | `Document.SetLetterContent(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SetPasswordEncryptionOptions | function | for-in | — | `Document.SetPasswordEncryptionOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Shapes | object | for-in | — | 读取 `Document.Shapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SharedWorkspace | object | for-in | — | 读取 `Document.SharedWorkspace`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowDocumentFieldTarget | number | for-in | — | 读取 `Document.ShowDocumentFieldTarget`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowGrammaticalErrors | boolean | for-in | — | 读取 `Document.ShowGrammaticalErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowRevisions | boolean | for-in | — | 读取 `Document.ShowRevisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowSpellingErrors | boolean | for-in | — | 读取 `Document.ShowSpellingErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowSummary | boolean | for-in | — | 读取 `Document.ShowSummary`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Signatures | object | for-in | — | 读取 `Document.Signatures`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartDocument | object | for-in | — | 读取 `Document.SmartDocument`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartTags | object | for-in | — | 读取 `Document.SmartTags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartTagsAsXMLProps | boolean | for-in | — | 读取 `Document.SmartTagsAsXMLProps`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SnapToGrid | boolean | for-in | — | 读取 `Document.SnapToGrid`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SnapToShapes | boolean | for-in | — | 读取 `Document.SnapToShapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SpellingChecked | boolean | for-in | — | 读取 `Document.SpellingChecked`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SpellingErrors | object | for-in | — | 读取 `Document.SpellingErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StoryRanges | object | for-in | — | 读取 `Document.StoryRanges`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StyleSheets | object | for-in | — | 读取 `Document.StyleSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StyleSortMethod | number | for-in | — | 读取 `Document.StyleSortMethod`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Styles | object | for-in | — | 读取 `Document.Styles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Subdocuments | object | for-in | — | 读取 `Document.Subdocuments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SummaryLength | number | for-in | — | 读取 `Document.SummaryLength`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SummaryViewMode | number | for-in | — | 读取 `Document.SummaryViewMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Sync | object | for-in | — | 读取 `Document.Sync`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Tables | object | for-in | — | 读取 `Document.Tables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TablesOfAuthorities | object | for-in | — | 读取 `Document.TablesOfAuthorities`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TablesOfAuthoritiesCategories | object | for-in | — | 读取 `Document.TablesOfAuthoritiesCategories`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TablesOfContents | object | for-in | — | 读取 `Document.TablesOfContents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TablesOfFigures | object | for-in | — | 读取 `Document.TablesOfFigures`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TextEncoding | number | for-in | — | 读取 `Document.TextEncoding`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TextLineEnding | number | for-in | — | 读取 `Document.TextLineEnding`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Theme | function | for-in | — | `Document.Theme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ThemeColor | function | for-in | — | `Document.ThemeColor(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ThemeFont | function | for-in | — | `Document.ThemeFont(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ThemeFormat | function | for-in | — | `Document.ThemeFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ToggleFormsDesign | function | for-in | — | `Document.ToggleFormsDesign(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| TrackFormatting | boolean | for-in | — | 读取 `Document.TrackFormatting`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TrackMoves | boolean | for-in | — | 读取 `Document.TrackMoves`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TrackRevisions | boolean | for-in | — | 读取 `Document.TrackRevisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TransformDocument | function | for-in | — | `Document.TransformDocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Type | number | for-in | — | 读取 `Document.Type`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Undo | function | for-in | — | `Document.Undo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UndoClear | function | for-in | — | `Document.UndoClear(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UnfreezeLayout | function | for-in | — | `Document.UnfreezeLayout(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Unprotect | function | for-in | — | `Document.Unprotect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UpdateStyles | function | for-in | — | `Document.UpdateStyles(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UpdateStylesOnOpen | boolean | for-in | — | 读取 `Document.UpdateStylesOnOpen`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UpdateSummaryProperties | function | for-in | — | `Document.UpdateSummaryProperties(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UseMathDefaults | boolean | for-in | — | 读取 `Document.UseMathDefaults`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UserControl | boolean | for-in | — | 读取 `Document.UserControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| VBASigned | boolean | for-in | — | 读取 `Document.VBASigned`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Variables | object | for-in | — | 读取 `Document.Variables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Versions | null | for-in | — | 读取 `Document.Versions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ViewCode | function | for-in | — | `Document.ViewCode(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ViewPropertyBrowser | function | for-in | — | `Document.ViewPropertyBrowser(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| WebOptions | object | for-in | — | 读取 `Document.WebOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WebPagePreview | function | for-in | — | `Document.WebPagePreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Windows | object | for-in | — | 读取 `Document.Windows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WordOpenXML | string | for-in | — | 读取 `Document.WordOpenXML`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Words | object | for-in | — | 读取 `Document.Words`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WritePassword | null | for-in | — | 读取 `Document.WritePassword`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WriteReserved | boolean | for-in | — | 读取 `Document.WriteReserved`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XMLHideNamespaces | boolean | for-in | — | 读取 `Document.XMLHideNamespaces`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XMLNodes | object | for-in | — | 读取 `Document.XMLNodes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XMLSaveDataOnly | boolean | for-in | — | 读取 `Document.XMLSaveDataOnly`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XMLSaveThroughXSLT | string | for-in | — | 读取 `Document.XMLSaveThroughXSLT`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XMLSchemaReferences | object | for-in | — | 读取 `Document.XMLSchemaReferences`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XMLSchemaViolations | object | for-in | — | 读取 `Document.XMLSchemaViolations`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XMLShowAdvancedErrors | boolean | for-in | — | 读取 `Document.XMLShowAdvancedErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XMLUseXSLTWhenSaving | boolean | for-in | — | 读取 `Document.XMLUseXSLTWhenSaving`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| _CodeName | string | for-in | — | 读取 `Document._CodeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| sblt | function | for-in | — | `Document.sblt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |

### `Range` (185 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| Application | object | for-in | — | 读取 `Range.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoFormat | function | for-in | — | `Range.AutoFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Bold | number | for-in | — | 读取 `Range.Bold`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BoldBi | number | for-in | — | 读取 `Range.BoldBi`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BookmarkID | number | for-in | — | 读取 `Range.BookmarkID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Bookmarks | object | for-in | — | 读取 `Range.Bookmarks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Borders | object | for-in | — | 读取 `Range.Borders`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Calculate | function | for-in | — | `Range.Calculate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CanEdit | number | for-in | — | 读取 `Range.CanEdit`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CanPaste | number | for-in | — | 读取 `Range.CanPaste`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Case | number | for-in | — | 读取 `Range.Case`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Cells | null | for-in | — | 读取 `Range.Cells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CharacterStyle | object | for-in | — | 读取 `Range.CharacterStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CharacterWidth | number | for-in | — | 读取 `Range.CharacterWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Characters | object | for-in | — | 读取 `Range.Characters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CheckGrammar | function | for-in | — | `Range.CheckGrammar(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckSpelling | function | for-in | — | `Range.CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckSynonyms | function | for-in | — | `Range.CheckSynonyms(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Collapse | function | for-in | — | `Range.Collapse(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Columns | null | for-in | — | 读取 `Range.Columns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CombineCharacters | boolean | for-in | — | 读取 `Range.CombineCharacters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Comments | object | for-in | — | 读取 `Range.Comments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ComputeStatistics | function | for-in | — | `Range.ComputeStatistics(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Conflicts | object | for-in | — | 读取 `Range.Conflicts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ContentControls | object | for-in | — | 读取 `Range.ContentControls`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ConvertHangulAndHanja | function | for-in | — | `Range.ConvertHangulAndHanja(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ConvertToTable | function | for-in | — | `Range.ConvertToTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ConvertToTableOld | function | for-in | — | `Range.ConvertToTableOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Copy | function | for-in | — | `Range.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CopyAsPicture | function | for-in | — | `Range.CopyAsPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreatePublisher | function | for-in | — | `Range.CreatePublisher(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Creator | number | for-in | — | 读取 `Range.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Cut | function | for-in | — | `Range.Cut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Delete | function | for-in | — | `Range.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DetectLanguage | function | for-in | — | `Range.DetectLanguage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DisableCharacterSpaceGrid | boolean | for-in | — | 读取 `Range.DisableCharacterSpaceGrid`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Document | object | for-in | — | 读取 `Range.Document`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DocumentFields | object | for-in | — | 读取 `Range.DocumentFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Duplicate | object | for-in | — | 读取 `Range.Duplicate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Editors | object | for-in | — | 读取 `Range.Editors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EmphasisMark | number | for-in | — | 读取 `Range.EmphasisMark`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| End | number | for-in | — | 读取 `Range.End`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EndOf | function | for-in | — | `Range.EndOf(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| EndnoteOptions | object | for-in | — | 读取 `Range.EndnoteOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Endnotes | object | for-in | — | 读取 `Range.Endnotes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnhMetaFileBits | null | for-in | — | 读取 `Range.EnhMetaFileBits`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Expand | function | for-in | — | `Range.Expand(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExportAsFixedFormat | function | for-in | — | `Range.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExportFragment | function | for-in | — | `Range.ExportFragment(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Fields | object | for-in | — | 读取 `Range.Fields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Find | object | for-in | — | 读取 `Range.Find`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FitTextWidth | number | for-in | — | 读取 `Range.FitTextWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Font | object | for-in | — | 读取 `Range.Font`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FootnoteOptions | object | for-in | — | 读取 `Range.FootnoteOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Footnotes | object | for-in | — | 读取 `Range.Footnotes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormFields | object | for-in | — | 读取 `Range.FormFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormattedText | object | for-in | — | 读取 `Range.FormattedText`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Frames | object | for-in | — | 读取 `Range.Frames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GetRangeEx | function | for-in | — | `Range.GetRangeEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetSpellingSuggestions | function | for-in | — | `Range.GetSpellingSuggestions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GoTo | function | for-in | — | `Range.GoTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GoToEditableRange | function | for-in | — | `Range.GoToEditableRange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GoToNext | function | for-in | — | `Range.GoToNext(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GoToPrevious | function | for-in | — | `Range.GoToPrevious(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GrammarChecked | boolean | for-in | — | 读取 `Range.GrammarChecked`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GrammaticalErrors | object | for-in | — | 读取 `Range.GrammaticalErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HTMLDivisions | object | for-in | — | 读取 `Range.HTMLDivisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HighlightColorIndex | number | for-in | — | 读取 `Range.HighlightColorIndex`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HorizontalInVertical | number | for-in | — | 读取 `Range.HorizontalInVertical`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Hyperlinks | object | for-in | — | 读取 `Range.Hyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ID | string | for-in | — | 读取 `Range.ID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ImportFragment | function | for-in | — | `Range.ImportFragment(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InRange | function | for-in | — | `Range.InRange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InStory | function | for-in | — | `Range.InStory(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Information | function | for-in | — | `Range.Information(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InlineShapes | object | for-in | — | 读取 `Range.InlineShapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| InsertAfter | function | for-in | — | `Range.InsertAfter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertAlignmentTab | function | for-in | — | `Range.InsertAlignmentTab(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertAutoText | function | for-in | — | `Range.InsertAutoText(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertBefore | function | for-in | — | `Range.InsertBefore(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertBreak | function | for-in | — | `Range.InsertBreak(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertCaption | function | for-in | — | `Range.InsertCaption(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertCaptionXP | function | for-in | — | `Range.InsertCaptionXP(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertCrossReference | function | for-in | — | `Range.InsertCrossReference(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertCrossReference_2002 | function | for-in | — | `Range.InsertCrossReference_2002(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertDatabase | function | for-in | — | `Range.InsertDatabase(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertDateTime | function | for-in | — | `Range.InsertDateTime(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertDateTimeOld | function | for-in | — | `Range.InsertDateTimeOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertFile | function | for-in | — | `Range.InsertFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertParagraph | function | for-in | — | `Range.InsertParagraph(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertParagraphAfter | function | for-in | — | `Range.InsertParagraphAfter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertParagraphBefore | function | for-in | — | `Range.InsertParagraphBefore(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertSymbol | function | for-in | — | `Range.InsertSymbol(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertXML | function | for-in | — | `Range.InsertXML(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| IsEndOfRowMark | boolean | for-in | — | 读取 `Range.IsEndOfRowMark`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IsEqual | function | for-in | — | `Range.IsEqual(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Italic | number | for-in | — | 读取 `Range.Italic`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ItalicBi | number | for-in | — | 读取 `Range.ItalicBi`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Kana | number | for-in | — | 读取 `Range.Kana`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageDetected | boolean | for-in | — | 读取 `Range.LanguageDetected`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageID | number | for-in | — | 读取 `Range.LanguageID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageIDFarEast | number | for-in | — | 读取 `Range.LanguageIDFarEast`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageIDOther | number | for-in | — | 读取 `Range.LanguageIDOther`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ListFormat | object | for-in | — | 读取 `Range.ListFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ListParagraphs | object | for-in | — | 读取 `Range.ListParagraphs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ListStyle | null | for-in | — | 读取 `Range.ListStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Locks | object | for-in | — | 读取 `Range.Locks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LookupNameProperties | function | for-in | — | `Range.LookupNameProperties(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ModifyEnclosure | function | for-in | — | `Range.ModifyEnclosure(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Move | function | for-in | — | `Range.Move(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveEnd | function | for-in | — | `Range.MoveEnd(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveEndUntil | function | for-in | — | `Range.MoveEndUntil(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveEndWhile | function | for-in | — | `Range.MoveEndWhile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveStart | function | for-in | — | `Range.MoveStart(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveStartUntil | function | for-in | — | `Range.MoveStartUntil(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveStartWhile | function | for-in | — | `Range.MoveStartWhile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveUntil | function | for-in | — | `Range.MoveUntil(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveWhile | function | for-in | — | `Range.MoveWhile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Next | function | for-in | — | `Range.Next(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| NextStoryRange | null | for-in | — | 读取 `Range.NextStoryRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NextSubdocument | function | for-in | — | `Range.NextSubdocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| NoProofing | number | for-in | — | 读取 `Range.NoProofing`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMaths | object | for-in | — | 读取 `Range.OMaths`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Orientation | number | for-in | — | 读取 `Range.Orientation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PageSetup | object | for-in | — | 读取 `Range.PageSetup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ParagraphFormat | object | for-in | — | 读取 `Range.ParagraphFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ParagraphStyle | object | for-in | — | 读取 `Range.ParagraphStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Paragraphs | object | for-in | — | 读取 `Range.Paragraphs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parent | object | for-in | — | 读取 `Range.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ParentContentControl | null | for-in | — | 读取 `Range.ParentContentControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Paste | function | for-in | — | `Range.Paste(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteAndFormat | function | for-in | — | `Range.PasteAndFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteAppendTable | function | for-in | — | `Range.PasteAppendTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteAsNestedTable | function | for-in | — | `Range.PasteAsNestedTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteExcelTable | function | for-in | — | `Range.PasteExcelTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteSpecial | function | for-in | — | `Range.PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PhoneticGuide | function | for-in | — | `Range.PhoneticGuide(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Previous | function | for-in | — | `Range.Previous(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PreviousBookmarkID | number | for-in | — | 读取 `Range.PreviousBookmarkID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PreviousSubdocument | function | for-in | — | `Range.PreviousSubdocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReadabilityStatistics | object | for-in | — | 读取 `Range.ReadabilityStatistics`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Relocate | function | for-in | — | `Range.Relocate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Revisions | object | for-in | — | 读取 `Range.Revisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Rows | null | for-in | — | 读取 `Range.Rows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Scripts | object | for-in | — | 读取 `Range.Scripts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Sections | object | for-in | — | 读取 `Range.Sections`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Select | function | for-in | — | `Range.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Sentences | object | for-in | — | 读取 `Range.Sentences`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SetListLevel | function | for-in | — | `Range.SetListLevel(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SetRange | function | for-in | — | `Range.SetRange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Shading | object | for-in | — | 读取 `Range.Shading`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShapeRange | object | for-in | — | 读取 `Range.ShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowAll | boolean | for-in | — | 读取 `Range.ShowAll`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartTags | object | for-in | — | 读取 `Range.SmartTags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Sort | function | for-in | — | `Range.Sort(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SortAscending | function | for-in | — | `Range.SortAscending(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SortByHeadings | function | for-in | — | `Range.SortByHeadings(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SortDescending | function | for-in | — | `Range.SortDescending(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SortOld | function | for-in | — | `Range.SortOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SpellingChecked | boolean | for-in | — | 读取 `Range.SpellingChecked`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SpellingErrors | object | for-in | — | 读取 `Range.SpellingErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Start | number | for-in | — | 读取 `Range.Start`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StartOf | function | for-in | — | `Range.StartOf(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| StoryLength | number | for-in | — | 读取 `Range.StoryLength`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StoryType | number | for-in | — | 读取 `Range.StoryType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Style | object | for-in | — | 读取 `Range.Style`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Subdocuments | object | for-in | — | 读取 `Range.Subdocuments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SubscribeTo | function | for-in | — | `Range.SubscribeTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SynonymInfo | object | for-in | — | 读取 `Range.SynonymInfo`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TCSCConverter | function | for-in | — | `Range.TCSCConverter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| TableStyle | null | for-in | — | 读取 `Range.TableStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Tables | object | for-in | — | 读取 `Range.Tables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Text | string | for-in | — | 读取 `Range.Text`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TextRetrievalMode | object | for-in | — | 读取 `Range.TextRetrievalMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TextVisibleOnScreen | number | for-in | — | 读取 `Range.TextVisibleOnScreen`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TopLevelTables | object | for-in | — | 读取 `Range.TopLevelTables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TwoLinesInOne | number | for-in | — | 读取 `Range.TwoLinesInOne`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Underline | number | for-in | — | 读取 `Range.Underline`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Updates | object | for-in | — | 读取 `Range.Updates`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WholeStory | function | for-in | — | `Range.WholeStory(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| WordOpenXML | string | for-in | — | 读取 `Range.WordOpenXML`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Words | object | for-in | — | 读取 `Range.Words`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XML | function | for-in | — | `Range.XML(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| XMLNodes | object | for-in | — | 读取 `Range.XMLNodes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XMLParentNode | null | for-in | — | 读取 `Range.XMLParentNode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |

### `Tables` (8 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| Add | function | for-in | — | `Tables.Add(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddOld | function | for-in | — | `Tables.AddOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application | object | for-in | — | 读取 `Tables.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Count | number | for-in | — | 读取 `Tables.Count`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Creator | number | for-in | — | 读取 `Tables.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Item | function | for-in | — | `Tables.Item(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| NestingLevel | number | for-in | — | 读取 `Tables.NestingLevel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parent | object | for-in | — | 读取 `Tables.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |

### `Find` (44 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| Application | object | for-in | — | 读取 `Find.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ClearAllFuzzyOptions | function | for-in | — | `Find.ClearAllFuzzyOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearFormatting | function | for-in | — | `Find.ClearFormatting(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearHitHighlight | function | for-in | — | `Find.ClearHitHighlight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CorrectHangulEndings | boolean | for-in | — | 读取 `Find.CorrectHangulEndings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Creator | number | for-in | — | 读取 `Find.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Execute | function | for-in | — | `Find.Execute(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Execute2007 | function | for-in | — | `Find.Execute2007(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExecuteOld | function | for-in | — | `Find.ExecuteOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Font | object | for-in | — | 读取 `Find.Font`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Format | boolean | for-in | — | 读取 `Find.Format`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Forward | boolean | for-in | — | 读取 `Find.Forward`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Found | boolean | for-in | — | 读取 `Find.Found`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Frame | null | for-in | — | 读取 `Find.Frame`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HanjaPhoneticHangul | boolean | for-in | — | 读取 `Find.HanjaPhoneticHangul`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Highlight | number | for-in | — | 读取 `Find.Highlight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HitHighlight | function | for-in | — | `Find.HitHighlight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| IgnorePunct | boolean | for-in | — | 读取 `Find.IgnorePunct`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IgnoreSpace | boolean | for-in | — | 读取 `Find.IgnoreSpace`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageID | number | for-in | — | 读取 `Find.LanguageID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageIDFarEast | null | for-in | — | 读取 `Find.LanguageIDFarEast`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageIDOther | null | for-in | — | 读取 `Find.LanguageIDOther`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchAlefHamza | boolean | for-in | — | 读取 `Find.MatchAlefHamza`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchAllWordForms | boolean | for-in | — | 读取 `Find.MatchAllWordForms`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchByte | boolean | for-in | — | 读取 `Find.MatchByte`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchCase | boolean | for-in | — | 读取 `Find.MatchCase`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchControl | boolean | for-in | — | 读取 `Find.MatchControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchDiacritics | boolean | for-in | — | 读取 `Find.MatchDiacritics`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchFuzzy | boolean | for-in | — | 读取 `Find.MatchFuzzy`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchKashida | boolean | for-in | — | 读取 `Find.MatchKashida`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchPhrase | boolean | for-in | — | 读取 `Find.MatchPhrase`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchPrefix | boolean | for-in | — | 读取 `Find.MatchPrefix`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchSoundsLike | boolean | for-in | — | 读取 `Find.MatchSoundsLike`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchSuffix | boolean | for-in | — | 读取 `Find.MatchSuffix`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchWholeWord | boolean | for-in | — | 读取 `Find.MatchWholeWord`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MatchWildcards | boolean | for-in | — | 读取 `Find.MatchWildcards`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NoProofing | number | for-in | — | 读取 `Find.NoProofing`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ParagraphFormat | object | for-in | — | 读取 `Find.ParagraphFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parent | object | for-in | — | 读取 `Find.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Replacement | object | for-in | — | 读取 `Find.Replacement`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SetAllFuzzyOptions | function | for-in | — | `Find.SetAllFuzzyOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Style | string | for-in | — | 读取 `Find.Style`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Text | string | for-in | — | 读取 `Find.Text`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Wrap | number | for-in | — | 读取 `Find.Wrap`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |

### `Selection` (194 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| Active | boolean | for-in | — | 读取 `Selection.Active`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application | object | for-in | — | 读取 `Selection.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BoldRun | function | for-in | — | `Selection.BoldRun(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| BookmarkID | number | for-in | — | 读取 `Selection.BookmarkID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Bookmarks | object | for-in | — | 读取 `Selection.Bookmarks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Borders | object | for-in | — | 读取 `Selection.Borders`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Calculate | function | for-in | — | `Selection.Calculate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Cells | null | for-in | — | 读取 `Selection.Cells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Characters | object | for-in | — | 读取 `Selection.Characters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ChildShapeRange | null | for-in | — | 读取 `Selection.ChildShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ClearCharacterAllFormatting | function | for-in | — | `Selection.ClearCharacterAllFormatting(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearCharacterDirectFormatting | function | for-in | — | `Selection.ClearCharacterDirectFormatting(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearCharacterStyle | function | for-in | — | `Selection.ClearCharacterStyle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearFormatting | function | for-in | — | `Selection.ClearFormatting(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearParagraphAllFormatting | function | for-in | — | `Selection.ClearParagraphAllFormatting(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearParagraphDirectFormatting | function | for-in | — | `Selection.ClearParagraphDirectFormatting(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearParagraphStyle | function | for-in | — | `Selection.ClearParagraphStyle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Collapse | function | for-in | — | `Selection.Collapse(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ColumnSelectMode | boolean | for-in | — | 读取 `Selection.ColumnSelectMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Columns | null | for-in | — | 读取 `Selection.Columns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Comments | object | for-in | — | 读取 `Selection.Comments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ContentControls | object | for-in | — | 读取 `Selection.ContentControls`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ConvertToTable | function | for-in | — | `Selection.ConvertToTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ConvertToTableOld | function | for-in | — | `Selection.ConvertToTableOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Copy | function | for-in | — | `Selection.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CopyAsPicture | function | for-in | — | `Selection.CopyAsPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CopyFormat | function | for-in | — | `Selection.CopyFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateAutoTextEntry | function | for-in | — | `Selection.CreateAutoTextEntry(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateTextbox | function | for-in | — | `Selection.CreateTextbox(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Creator | number | for-in | — | 读取 `Selection.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Cut | function | for-in | — | `Selection.Cut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Delete | function | for-in | — | `Selection.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DetectLanguage | function | for-in | — | `Selection.DetectLanguage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Document | object | for-in | — | 读取 `Selection.Document`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DocumentFields | object | for-in | — | 读取 `Selection.DocumentFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Editors | object | for-in | — | 读取 `Selection.Editors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| End | number | for-in | — | 读取 `Selection.End`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EndKey | function | for-in | — | `Selection.EndKey(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| EndOf | function | for-in | — | `Selection.EndOf(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| EndnoteOptions | object | for-in | — | 读取 `Selection.EndnoteOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Endnotes | object | for-in | — | 读取 `Selection.Endnotes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnhMetaFileBits | null | for-in | — | 读取 `Selection.EnhMetaFileBits`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EscapeKey | function | for-in | — | `Selection.EscapeKey(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Expand | function | for-in | — | `Selection.Expand(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExportAsFixedFormat | function | for-in | — | `Selection.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Extend | function | for-in | — | `Selection.Extend(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExtendMode | null | for-in | — | 读取 `Selection.ExtendMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Fields | object | for-in | — | 读取 `Selection.Fields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Find | object | for-in | — | 读取 `Selection.Find`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FitTextWidth | number | for-in | — | 读取 `Selection.FitTextWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Flags | number | for-in | — | 读取 `Selection.Flags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Font | object | for-in | — | 读取 `Selection.Font`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FootnoteOptions | object | for-in | — | 读取 `Selection.FootnoteOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Footnotes | object | for-in | — | 读取 `Selection.Footnotes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormFields | object | for-in | — | 读取 `Selection.FormFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormattedText | object | for-in | — | 读取 `Selection.FormattedText`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Frames | object | for-in | — | 读取 `Selection.Frames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GoTo | function | for-in | — | `Selection.GoTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GoToEditableRange | function | for-in | — | `Selection.GoToEditableRange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GoToNext | function | for-in | — | `Selection.GoToNext(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GoToPrevious | function | for-in | — | `Selection.GoToPrevious(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| HTMLDivisions | object | for-in | — | 读取 `Selection.HTMLDivisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasChildShapeRange | boolean | for-in | — | 读取 `Selection.HasChildShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HeaderFooter | null | for-in | — | 读取 `Selection.HeaderFooter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HomeKey | function | for-in | — | `Selection.HomeKey(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Hyperlinks | object | for-in | — | 读取 `Selection.Hyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IPAtEndOfLine | null | for-in | — | 读取 `Selection.IPAtEndOfLine`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| InRange | function | for-in | — | `Selection.InRange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InStory | function | for-in | — | `Selection.InStory(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Information | function | for-in | — | `Selection.Information(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InlineShapes | object | for-in | — | 读取 `Selection.InlineShapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| InsertAfter | function | for-in | — | `Selection.InsertAfter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertBefore | function | for-in | — | `Selection.InsertBefore(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertBreak | function | for-in | — | `Selection.InsertBreak(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertCaption | function | for-in | — | `Selection.InsertCaption(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertCaptionXP | function | for-in | — | `Selection.InsertCaptionXP(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertCells | function | for-in | — | `Selection.InsertCells(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertColumns | function | for-in | — | `Selection.InsertColumns(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertColumnsRight | function | for-in | — | `Selection.InsertColumnsRight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertCrossReference | function | for-in | — | `Selection.InsertCrossReference(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertCrossReference_2002 | function | for-in | — | `Selection.InsertCrossReference_2002(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertDateTime | function | for-in | — | `Selection.InsertDateTime(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertDateTimeOld | function | for-in | — | `Selection.InsertDateTimeOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertFile | function | for-in | — | `Selection.InsertFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertFormula | function | for-in | — | `Selection.InsertFormula(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertManualContent | function | for-in | — | `Selection.InsertManualContent(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertNewPage | function | for-in | — | `Selection.InsertNewPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertParagraph | function | for-in | — | `Selection.InsertParagraph(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertParagraphAfter | function | for-in | — | `Selection.InsertParagraphAfter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertParagraphBefore | function | for-in | — | `Selection.InsertParagraphBefore(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertRows | function | for-in | — | `Selection.InsertRows(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertRowsAbove | function | for-in | — | `Selection.InsertRowsAbove(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertRowsBelow | function | for-in | — | `Selection.InsertRowsBelow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertStyleSeparator | function | for-in | — | `Selection.InsertStyleSeparator(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertSymbol | function | for-in | — | `Selection.InsertSymbol(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertXML | function | for-in | — | `Selection.InsertXML(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| IsEndOfRowMark | boolean | for-in | — | 读取 `Selection.IsEndOfRowMark`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IsEqual | function | for-in | — | `Selection.IsEqual(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ItalicRun | function | for-in | — | `Selection.ItalicRun(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| LanguageDetected | boolean | for-in | — | 读取 `Selection.LanguageDetected`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageID | number | for-in | — | 读取 `Selection.LanguageID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageIDFarEast | number | for-in | — | 读取 `Selection.LanguageIDFarEast`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageIDOther | number | for-in | — | 读取 `Selection.LanguageIDOther`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LtrPara | function | for-in | — | `Selection.LtrPara(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| LtrRun | function | for-in | — | `Selection.LtrRun(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Move | function | for-in | — | `Selection.Move(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveDown | function | for-in | — | `Selection.MoveDown(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveEnd | function | for-in | — | `Selection.MoveEnd(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveEndUntil | function | for-in | — | `Selection.MoveEndUntil(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveEndWhile | function | for-in | — | `Selection.MoveEndWhile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveLeft | function | for-in | — | `Selection.MoveLeft(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveRight | function | for-in | — | `Selection.MoveRight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveStart | function | for-in | — | `Selection.MoveStart(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveStartUntil | function | for-in | — | `Selection.MoveStartUntil(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveStartWhile | function | for-in | — | `Selection.MoveStartWhile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveUntil | function | for-in | — | `Selection.MoveUntil(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveUp | function | for-in | — | `Selection.MoveUp(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveWhile | function | for-in | — | `Selection.MoveWhile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Next | function | for-in | — | `Selection.Next(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| NextField | function | for-in | — | `Selection.NextField(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| NextRevision | function | for-in | — | `Selection.NextRevision(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| NextSubdocument | function | for-in | — | `Selection.NextSubdocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| NoProofing | number | for-in | — | 读取 `Selection.NoProofing`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OMaths | object | for-in | — | 读取 `Selection.OMaths`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Orientation | number | for-in | — | 读取 `Selection.Orientation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PageSetup | object | for-in | — | 读取 `Selection.PageSetup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ParagraphFormat | object | for-in | — | 读取 `Selection.ParagraphFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Paragraphs | object | for-in | — | 读取 `Selection.Paragraphs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parent | object | for-in | — | 读取 `Selection.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ParentContentControl | null | for-in | — | 读取 `Selection.ParentContentControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Paste | function | for-in | — | `Selection.Paste(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteAndFormat | function | for-in | — | `Selection.PasteAndFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteAppendTable | function | for-in | — | `Selection.PasteAppendTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteAsNestedTable | function | for-in | — | `Selection.PasteAsNestedTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteExcelTable | function | for-in | — | `Selection.PasteExcelTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteFormat | function | for-in | — | `Selection.PasteFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteSpecial | function | for-in | — | `Selection.PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Previous | function | for-in | — | `Selection.Previous(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PreviousBookmarkID | number | for-in | — | 读取 `Selection.PreviousBookmarkID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PreviousField | function | for-in | — | `Selection.PreviousField(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PreviousRevision | function | for-in | — | `Selection.PreviousRevision(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PreviousSubdocument | function | for-in | — | `Selection.PreviousSubdocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Range | object | for-in | — | 读取 `Selection.Range`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ReadingModeGrowFont | function | for-in | — | `Selection.ReadingModeGrowFont(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReadingModeShrinkFont | function | for-in | — | `Selection.ReadingModeShrinkFont(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Rows | null | for-in | — | 读取 `Selection.Rows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RtlPara | function | for-in | — | `Selection.RtlPara(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RtlRun | function | for-in | — | `Selection.RtlRun(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Sections | object | for-in | — | 读取 `Selection.Sections`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Select | function | for-in | — | `Selection.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectCell | function | for-in | — | `Selection.SelectCell(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectColumn | function | for-in | — | `Selection.SelectColumn(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectCurrentAlignment | function | for-in | — | `Selection.SelectCurrentAlignment(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectCurrentColor | function | for-in | — | `Selection.SelectCurrentColor(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectCurrentFont | function | for-in | — | `Selection.SelectCurrentFont(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectCurrentIndent | function | for-in | — | `Selection.SelectCurrentIndent(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectCurrentSpacing | function | for-in | — | `Selection.SelectCurrentSpacing(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectCurrentTabs | function | for-in | — | `Selection.SelectCurrentTabs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectRow | function | for-in | — | `Selection.SelectRow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Sentences | object | for-in | — | 读取 `Selection.Sentences`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SetRange | function | for-in | — | `Selection.SetRange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Shading | object | for-in | — | 读取 `Selection.Shading`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShapeRange | object | for-in | — | 读取 `Selection.ShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Shrink | function | for-in | — | `Selection.Shrink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShrinkDiscontiguousSelection | function | for-in | — | `Selection.ShrinkDiscontiguousSelection(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SmartTags | object | for-in | — | 读取 `Selection.SmartTags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Sort | function | for-in | — | `Selection.Sort(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Sort2000 | function | for-in | — | `Selection.Sort2000(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SortAscending | function | for-in | — | `Selection.SortAscending(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SortByHeadings | function | for-in | — | `Selection.SortByHeadings(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SortDescending | function | for-in | — | `Selection.SortDescending(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SortOld | function | for-in | — | `Selection.SortOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SplitTable | function | for-in | — | `Selection.SplitTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Start | number | for-in | — | 读取 `Selection.Start`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StartIsActive | boolean | for-in | — | 读取 `Selection.StartIsActive`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StartOf | function | for-in | — | `Selection.StartOf(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| StoryLength | number | for-in | — | 读取 `Selection.StoryLength`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StoryType | number | for-in | — | 读取 `Selection.StoryType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Style | object | for-in | — | 读取 `Selection.Style`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StyleEx | object | for-in | — | 读取 `Selection.StyleEx`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Tables | object | for-in | — | 读取 `Selection.Tables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Text | string | for-in | — | 读取 `Selection.Text`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ToggleCharacterCode | function | for-in | — | `Selection.ToggleCharacterCode(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| TopLevelTables | object | for-in | — | 读取 `Selection.TopLevelTables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Type | number | for-in | — | 读取 `Selection.Type`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TypeBackspace | function | for-in | — | `Selection.TypeBackspace(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| TypeParagraph | function | for-in | — | `Selection.TypeParagraph(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| TypeText | function | for-in | — | `Selection.TypeText(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| WholeStory | function | for-in | — | `Selection.WholeStory(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| WordOpenXML | string | for-in | — | 读取 `Selection.WordOpenXML`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Words | object | for-in | — | 读取 `Selection.Words`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XML | function | for-in | — | `Selection.XML(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| XMLNodes | object | for-in | — | 读取 `Selection.XMLNodes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XMLParentNode | null | for-in | — | 读取 `Selection.XMLParentNode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |

## 候选成员检查

`candidateScan` 是针对候选路径的存在性/类型快照，不是完整方法调用测试。

| 对象 | 成员 | 存在状态 | 类型 |
| --- | --- | --- | --- |
| Application | Name | 支持 | string |
| Application | Version | 支持 | string |
| Application | Build | 支持 | string |
| Application | Path | 支持 | string |
| Application | StartupPath | 支持 | string |
| Application | OperatingSystem | 缺失 | undefined |
| Application | UserName | 支持 | string |
| Application | ActiveWindow | 支持 | object |
| Application | Windows | 支持 | object |
| Application | Selection | 支持 | object |
| Application | ApiEvent | 支持 | object |
| Application | CommandBars | 支持 | object |
| Application | COMAddIns | 支持 | null |
| Application | Visible | 支持 | boolean |
| Application | DisplayAlerts | 支持 | number |
| Application | ScreenUpdating | 支持 | boolean |
| Application | StatusBar | 支持 | null |
| Application | Caption | 支持 | string |
| Application | LanguageSettings | 支持 | object |
| Application | Options | 支持 | object |
| Application | RecentFiles | 支持 | object |
| Application | FileDialog | 支持 | function |
| Application | Undo | 缺失 | undefined |
| Application | Redo | 缺失 | undefined |
| Application | Run | 支持 | function |
| Application | OnTime | 支持 | function |
| Application | SendKeys | 缺失 | undefined |
| Application | Quit | 支持 | function |
| Application | Activate | 支持 | function |
| Application | Calculate | 缺失 | undefined |
| Application | CalculateFull | 缺失 | undefined |
| Application | Documents | 支持 | object |
| Application | ActiveDocument | 支持 | object |
| Application | Workbooks | 缺失 | undefined |
| Application | ActiveWorkbook | 缺失 | undefined |
| Application | Presentations | 缺失 | undefined |
| Application | ActivePresentation | 缺失 | undefined |
| Application | Slides | 缺失 | undefined |
| Application | Sheets | 缺失 | undefined |
| Application | AddCustomFunction | 缺失 | undefined |
| Application | CreateTaskPane | 支持 | function |
| Application | GetTaskPane | 支持 | function |
| Application | CreateWebDialog | 支持 | function |
| Application | GetWebDialog | 支持 | function |
| Application | ShowDialog | 支持 | function |
| Application | UpdateRibbon | 支持 | function |
| Application | FileSystem | 支持 | object |
| Application | PluginStorage | 支持 | object |
| Application | WpsAddonMgr | 缺失 | undefined |
| Application | Execute | 缺失 | undefined |
| Application | EtApplication | 缺失 | undefined |
| Application | WppApplication | 缺失 | undefined |
| Application | WpsApplication | 支持 | function |
| Application | GetApplication | 缺失 | undefined |
| Application | Application | 支持 | object |
| Application | Enum | 支持 | object |
| Application | ApiEvent | 支持 | object |
| Application | GetInstalledFonts | 缺失 | undefined |
| Application | GetSystemInfo | 缺失 | undefined |
| Application | GetEnvironment | 缺失 | undefined |
| Application | Invoke | 缺失 | undefined |
| Application | InvokeAsHttp | 缺失 | undefined |
| Application | InvokeAsHttps | 缺失 | undefined |
| Application | CreateXHR | 缺失 | undefined |
| Application | WpsInvoke | 缺失 | undefined |
| Application | WpsClient | 缺失 | undefined |
| Application | GetCustomFunctions | 缺失 | undefined |
| Application | RemoveCustomFunction | 缺失 | undefined |
| Application | RemoveAllCustomFunctions | 缺失 | undefined |
| wpsGlobal | Application | 支持 | object |
| wpsGlobal | AddCustomFunction | 缺失 | undefined |
| wpsGlobal | CreateTaskPane | 支持 | function |
| wpsGlobal | GetTaskPane | 支持 | function |
| wpsGlobal | CreateWebDialog | 支持 | function |
| wpsGlobal | GetWebDialog | 支持 | function |
| wpsGlobal | ShowDialog | 支持 | function |
| wpsGlobal | UpdateRibbon | 支持 | function |
| wpsGlobal | FileSystem | 支持 | object |
| wpsGlobal | PluginStorage | 支持 | object |
| wpsGlobal | Enum | 支持 | object |
| wpsGlobal | ApiEvent | 支持 | object |
| wpsGlobal | WpsAddonMgr | 缺失 | undefined |
| wpsGlobal | WpsInvoke | 缺失 | undefined |
| wpsGlobal | WpsClient | 缺失 | undefined |
| wpsGlobal | GetApplication | 缺失 | undefined |
| wpsGlobal | Execute | 缺失 | undefined |
| wpsGlobal | RemoveCustomFunction | 缺失 | undefined |
| wpsGlobal | RemoveAllCustomFunctions | 缺失 | undefined |
| FileSystem | ReadFile | 支持 | function |
| FileSystem | WriteFile | 支持 | function |
| FileSystem | Exists | 支持 | function |
| FileSystem | FileExists | 缺失 | undefined |
| FileSystem | DirectoryExists | 缺失 | undefined |
| FileSystem | CreateDirectory | 缺失 | undefined |
| FileSystem | Remove | 支持 | function |
| FileSystem | DeleteFile | 缺失 | undefined |
| FileSystem | CopyFile | 缺失 | undefined |
| FileSystem | MoveFile | 缺失 | undefined |
| FileSystem | GetFileInfo | 缺失 | undefined |
| FileSystem | GetFiles | 缺失 | undefined |
| FileSystem | GetDirectories | 缺失 | undefined |
| FileSystem | OpenFile | 缺失 | undefined |
| FileSystem | SaveFile | 缺失 | undefined |
| FileSystem | ReadText | 缺失 | undefined |
| FileSystem | WriteText | 缺失 | undefined |
| FileSystem | GetTempPath | 缺失 | undefined |
| FileSystem | GetSpecialFolder | 缺失 | undefined |
| FileSystem | Separator | 缺失 | undefined |
| FileSystem | PathSeparator | 缺失 | undefined |
| wpsGlobalModern | Application | 支持 | object |
| wpsGlobalModern | Enum | 支持 | object |
| wpsGlobalModern | ApiEvent | 支持 | object |
| wpsGlobalModern | FileSystem | 支持 | object |
| wpsGlobalModern | CreateTaskPane | 支持 | function |
| wpsGlobalModern | GetTaskPane | 支持 | function |
| wpsGlobalModern | CreateWebDialog | 支持 | function |
| wpsGlobalModern | GetWebDialog | 支持 | function |
| wpsGlobalModern | ShowDialog | 支持 | function |
| wpsGlobalModern | UpdateRibbon | 支持 | function |
| wpsGlobalModern | AddCustomFunction | 缺失 | undefined |
| wpsGlobalModern | RemoveCustomFunction | 缺失 | undefined |
| wpsGlobalModern | RemoveAllCustomFunctions | 缺失 | undefined |
| wpsGlobalModern | PluginStorage | 支持 | object |
| wpsGlobalModern | WpsAddonMgr | 缺失 | undefined |
| wpsGlobalModern | WpsInvoke | 缺失 | undefined |
| wpsGlobalModern | WpsClient | 缺失 | undefined |
| Document | Name | 支持 | string |
| Document | FullName | 支持 | string |
| Document | Path | 支持 | string |
| Document | Saved | 支持 | boolean |
| Document | Content | 支持 | object |
| Document | Range | 支持 | function |
| Document | Paragraphs | 支持 | object |
| Document | Tables | 支持 | object |
| Document | Sections | 支持 | object |
| Document | Bookmarks | 支持 | object |
| Document | Fields | 支持 | object |
| Document | Comments | 支持 | object |
| Document | Hyperlinks | 支持 | object |
| Document | InlineShapes | 支持 | object |
| Document | Shapes | 支持 | object |
| Document | Styles | 支持 | object |
| Document | ActiveWindow | 支持 | object |
| Document | PageSetup | 支持 | object |
| Document | BuiltinDocumentProperties | 缺失 | undefined |
| Document | CustomDocumentProperties | 支持 | object |
| Document | Save | 支持 | function |
| Document | SaveAs | 支持 | function |
| Document | Close | 支持 | function |
| Document | Protect | 支持 | function |
| Document | Unprotect | 支持 | function |
| Document | Undo | 支持 | function |
| Document | Redo | 支持 | function |
| Range | Text | 支持 | string |
| Range | Start | 支持 | number |
| Range | End | 支持 | number |
| Range | Font | 支持 | object |
| Range | ParagraphFormat | 支持 | object |
| Range | Style | 支持 | object |
| Range | Tables | 支持 | object |
| Range | Paragraphs | 支持 | object |
| Range | Words | 支持 | object |
| Range | Sentences | 支持 | object |
| Range | Characters | 支持 | object |
| Range | Sections | 支持 | object |
| Range | Fields | 支持 | object |
| Range | Bookmarks | 支持 | object |
| Range | InlineShapes | 支持 | object |
| Range | ShapeRange | 支持 | object |
| Range | Comments | 支持 | object |
| Range | Hyperlinks | 支持 | object |
| Range | Find | 支持 | object |
| Range | InsertBefore | 支持 | function |
| Range | InsertAfter | 支持 | function |
| Range | InsertParagraphBefore | 支持 | function |
| Range | InsertParagraphAfter | 支持 | function |
| Range | Delete | 支持 | function |
| Range | Copy | 支持 | function |
| Range | Cut | 支持 | function |
| Range | Paste | 支持 | function |
| Range | Select | 支持 | function |
| Range | Collapse | 支持 | function |
| Range | Move | 支持 | function |
| Range | MoveStart | 支持 | function |
| Range | MoveEnd | 支持 | function |
| Range | Information | 支持 | function |
| Range | StoryType | 支持 | number |
| Range | FormattedText | 支持 | object |
| Selection | Text | 支持 | string |
| Selection | Type | 支持 | number |
| Selection | Range | 支持 | object |
| Selection | Font | 支持 | object |
| Selection | ParagraphFormat | 支持 | object |
| Selection | Tables | 支持 | object |
| Selection | Cells | 支持 | null |
| Selection | Rows | 支持 | null |
| Selection | Columns | 支持 | null |
| Selection | InlineShapes | 支持 | object |
| Selection | ShapeRange | 支持 | object |
| Selection | Find | 支持 | object |
| Selection | Information | 支持 | function |
| Selection | GoTo | 支持 | function |
| Selection | Move | 支持 | function |
| Selection | MoveLeft | 支持 | function |
| Selection | MoveRight | 支持 | function |
| Selection | InsertAfter | 支持 | function |
| Selection | InsertBefore | 支持 | function |
| Selection | Copy | 支持 | function |
| Selection | Cut | 支持 | function |
| Selection | Paste | 支持 | function |
| Selection | Delete | 支持 | function |

## 应用侧建议

- 使用 `documentId` 定位文档，不要以文件名路由。
- 先检查活动对象、集合 Count 与目标名称；集合通常用 1-based `Item(index)`。
- 读 Range/表格/图表时控制输出规模，只返回标量、数组、普通 JSON 对象。
- API 返回 COM/WPS 宿主代理对象时不要直接 `return object`；显式映射为 JSON 字段。
- 本目录中带 `write` 的探测仅说明诊断工具在临时文档上完成操作；对 MCP 调用仍需严格遵循 `wps_run_render` 边界。
