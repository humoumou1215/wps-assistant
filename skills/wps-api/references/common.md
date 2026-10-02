# 通用 API 与事件

此处汇总三个宿主对通用 `Application` 候选项的观测；WPS版本/平台差异会造成缺失。使用只读 API 前可在目标宿主通过 `wps_run_readonly_code` 检查类型；写操作成员的检查和调用只能放进 Render。对于函数，表中只列函数存在性，参数签名不由诊断快照证明。

执行代码中的 `wpsDocument` 是按本次 documentId/绑定解析的原生文档对象，不改变活动文档。下面的 ActiveWorkbook/ActivePresentation/ActiveDocument/Selection 是历史宿主成员观测，不代表绑定目标；读写指定文档应从 `wpsDocument` 出发，选区按引用快照中的明确坐标读取。读取方法是否存在时也受只读守卫限制，不能用拼接成员名绕过拒绝。

## Application / ApiEvent 通用项

| 路径 | 表格 | 细节 | 文字 | 细节 | 演示 | 细节 | 用法 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Application.Name | 支持 | string | 支持 | string | 支持 | string | 读取 `Application.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.Version | 支持 | string | 支持 | string | 支持 | string | 读取 `Application.Version`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.Build | 支持 | number | 支持 | string | 支持 | string | 读取 `Application.Build`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.Path | 支持 | string | 支持 | string | 支持 | string | 读取 `Application.Path`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.StartupPath | 支持 | string | 支持 | string | 缺失 | undefined | 读取 `Application.StartupPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.OperatingSystem | 支持 | string | 缺失 | undefined | 支持 | string | 读取 `Application.OperatingSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.UserName | 支持 | string | 支持 | string | 支持 | string | 读取 `Application.UserName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.ActiveWindow | 支持 | object | 支持 | object | 支持 | object | 活动对象的历史观测；文档操作使用 `wpsDocument`，选区按已核实的引用坐标读取。 |
| Application.Windows | 支持 | object | 支持 | object | 支持 | object | 读取 `Application.Windows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.Selection | 支持 | object | 支持 | object | 缺失 | undefined | 活动对象的历史观测；文档操作使用 `wpsDocument`，选区按已核实的引用坐标读取。 |
| Application.ApiEvent | 支持 | object | 支持 | object | 支持 | object | 读取 `Application.ApiEvent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.CommandBars | 支持 | object | 支持 | object | 支持 | object | 读取 `Application.CommandBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.COMAddIns | 支持 | null | 支持 | null | 支持 | null | 读取 `Application.COMAddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.Visible | 支持 | boolean | 支持 | boolean | 支持 | number | 读取 `Application.Visible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.DisplayAlerts | 支持 | boolean | 支持 | number | 支持 | number | 读取 `Application.DisplayAlerts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.ScreenUpdating | 支持 | boolean | 支持 | boolean | 缺失 | undefined | 读取 `Application.ScreenUpdating`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.StatusBar | 支持 | string | 支持 | null | 缺失 | undefined | 读取 `Application.StatusBar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.Caption | 支持 | string | 支持 | string | 支持 | string | 读取 `Application.Caption`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.LanguageSettings | 支持 | object | 支持 | object | 支持 | object | 读取 `Application.LanguageSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.Options | 缺失 | undefined | 支持 | object | 支持 | object | 读取 `Application.Options`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.RecentFiles | 支持 | object | 支持 | object | 缺失 | undefined | 读取 `Application.RecentFiles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.FileDialog | 支持 | function | 支持 | function | 支持 | function | `Application.FileDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.Undo | 支持 | function | 缺失 | undefined | 缺失 | undefined | `Application.Undo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.Redo | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.Redo`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.Run | 支持 | function | 支持 | function | 支持 | function | `Application.Run(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.OnTime | 支持 | function | 支持 | function | 缺失 | undefined | `Application.OnTime(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.SendKeys | 支持 | function | 缺失 | undefined | 缺失 | undefined | `Application.SendKeys(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.Quit | 支持 | function | 支持 | function | 支持 | function | `Application.Quit(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.Activate | 缺失 | undefined | 支持 | function | 支持 | function | `Application.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.Calculate | 支持 | function | 缺失 | undefined | 缺失 | undefined | `Application.Calculate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.CalculateFull | 支持 | function | 缺失 | undefined | 缺失 | undefined | `Application.CalculateFull(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.Documents | 缺失 | undefined | 支持 | object | 缺失 | undefined | 读取 `Application.Documents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.ActiveDocument | 缺失 | undefined | 支持 | object | 缺失 | undefined | 活动对象的历史观测；文档操作使用 `wpsDocument`，选区按已核实的引用坐标读取。 |
| Application.Workbooks | 支持 | object | 缺失 | undefined | 缺失 | undefined | 读取 `Application.Workbooks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.ActiveWorkbook | 支持 | object | 缺失 | undefined | 缺失 | undefined | 活动对象的历史观测；文档操作使用 `wpsDocument`，选区按已核实的引用坐标读取。 |
| Application.Presentations | 缺失 | undefined | 缺失 | undefined | 支持 | object | 读取 `Application.Presentations`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.ActivePresentation | 缺失 | undefined | 缺失 | undefined | 支持 | object | 活动对象的历史观测；文档操作使用 `wpsDocument`，选区按已核实的引用坐标读取。 |
| Application.Slides | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.Slides`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.Sheets | 支持 | object | 缺失 | undefined | 缺失 | undefined | 读取 `Application.Sheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.AddCustomFunction | 支持 | function | 缺失 | undefined | 缺失 | undefined | `Application.AddCustomFunction(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.CreateTaskPane | 支持 | function | 支持 | function | 支持 | function | `Application.CreateTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.GetTaskPane | 支持 | function | 支持 | function | 支持 | function | `Application.GetTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.CreateWebDialog | 支持 | function | 支持 | function | 支持 | function | `Application.CreateWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.GetWebDialog | 支持 | function | 支持 | function | 支持 | function | `Application.GetWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.ShowDialog | 支持 | function | 支持 | function | 支持 | function | `Application.ShowDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.UpdateRibbon | 支持 | function | 支持 | function | 支持 | function | `Application.UpdateRibbon(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.FileSystem | 支持 | object | 支持 | object | 支持 | object | 读取 `Application.FileSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.PluginStorage | 支持 | object | 支持 | object | 支持 | object | 读取 `Application.PluginStorage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.WpsAddonMgr | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.WpsAddonMgr`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.Execute | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.Execute`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.EtApplication | 支持 | function | 缺失 | undefined | 缺失 | undefined | `Application.EtApplication(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.WppApplication | 缺失 | undefined | 缺失 | undefined | 支持 | function | `Application.WppApplication(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.WpsApplication | 缺失 | undefined | 支持 | function | 缺失 | undefined | `Application.WpsApplication(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application.GetApplication | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.GetApplication`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.Application | 支持 | object | 支持 | object | 支持 | object | 读取 `Application.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.Enum | 支持 | object | 支持 | object | 支持 | object | 读取 `Application.Enum`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.GetInstalledFonts | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.GetInstalledFonts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.GetSystemInfo | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.GetSystemInfo`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.GetEnvironment | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.GetEnvironment`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.Invoke | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.Invoke`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.InvokeAsHttp | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.InvokeAsHttp`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.InvokeAsHttps | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.InvokeAsHttps`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.CreateXHR | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.CreateXHR`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.WpsInvoke | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.WpsInvoke`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.WpsClient | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.WpsClient`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.GetCustomFunctions | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.GetCustomFunctions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.RemoveCustomFunction | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.RemoveCustomFunction`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application.RemoveAllCustomFunctions | 缺失 | undefined | 缺失 | undefined | 缺失 | undefined | 读取 `Application.RemoveAllCustomFunctions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ApiEvent.AddApiEventListener | 支持 | function | 支持 | function | 支持 | function | `Application.ApiEvent.AddApiEventListener(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ApiEvent.RemoveApiEventListener | 支持 | function | 支持 | function | 支持 | function | `Application.ApiEvent.RemoveApiEventListener(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |

## 事件

事件探测仅验证注册 listener 是否成功；它没有模拟事件触发或对每个 payload 做结构断言。避免将只在其他宿主报告中支持的事件硬编码。

### Spreadsheet / ET

| 事件名 | 注册结果 | 报告备注 |
| --- | --- | --- |
| WorkbookOpen | 支持 | listener registration succeeded |
| WorkbookBeforeClose | 支持 | listener registration succeeded |
| WorkbookBeforeSave | 支持 | listener registration succeeded |
| SheetSelectionChange | 支持 | listener registration succeeded |
| SheetChange | 支持 | listener registration succeeded |
| SheetActivate | 支持 | listener registration succeeded |
| SheetDeactivate | 支持 | listener registration succeeded |
| WindowActivate | 支持 | listener registration succeeded |
| WindowDeactivate | 支持 | listener registration succeeded |
| FileAfterSave | 支持 | listener registration succeeded |
| DocumentBeforeOpen | 支持 | listener registration succeeded |
| DocumentBeforeCopy | 支持 | listener registration succeeded |
| DocumentBeforePaste | 支持 | listener registration succeeded |

### Writer / WPS

| 事件名 | 注册结果 | 报告备注 |
| --- | --- | --- |
| DocumentOpen | 支持 | listener registration succeeded |
| DocumentBeforeClose | 支持 | listener registration succeeded |
| DocumentBeforeSave | 支持 | listener registration succeeded |
| DocumentAfterClose | 支持 | listener registration succeeded |
| DocumentChange | 支持 | listener registration succeeded |
| WindowActivate | 支持 | listener registration succeeded |
| WindowDeactivate | 支持 | listener registration succeeded |
| WindowSelectionChange | 支持 | listener registration succeeded |
| NewDocument | 存在但调用失败 | Error: NewDocument is not a valid event name. |
| DocumentSync | 存在但调用失败 | Error: DocumentSync is not a valid event name. |
| FileAfterSave | 支持 | listener registration succeeded |

### Presentation / WPP

| 事件名 | 注册结果 | 报告备注 |
| --- | --- | --- |
| PresentationOpen | 支持 | listener registration succeeded |
| PresentationClose | 支持 | listener registration succeeded |
| PresentationSave | 支持 | listener registration succeeded |
| PresentationBeforeSave | 支持 | listener registration succeeded |
| WindowActivate | 支持 | listener registration succeeded |
| WindowDeactivate | 存在但调用失败 | Error: WindowDeactivate is not a valid event name. |
| WindowSelectionChange | 支持 | listener registration succeeded |
| SlideSelectionChanged | 支持 | listener registration succeeded |
| SlideShowBegin | 支持 | listener registration succeeded |
| SlideShowEnd | 支持 | listener registration succeeded |
| SlideShowNextSlide | 支持 | listener registration succeeded |
| SlideShowOnNext | 支持 | listener registration succeeded |
| SlideShowOnPrevious | 支持 | listener registration succeeded |

以下是 Add-in 生命周期开发的历史调用形式，不是只读查询示例。文档任务通常不需要注册监听；`wps_run_readonly_code` 与 Transform 会拒绝这些成员。需要监听时在 Add-in 实现中按对应 WPS 版本确认签名/参数：

```js
Application.ApiEvent.AddApiEventListener('WorkbookOpen', handler);
// 完成后移除监听：Application.ApiEvent.RemoveApiEventListener('WorkbookOpen', handler);
```
