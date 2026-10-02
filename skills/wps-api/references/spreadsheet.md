# Spreadsheet / ET API guide

诊断环境：UnionTech UOS 20 (1060) / WPS Office 2026 Summer Update 12.8.2.26885；WPS表格 12.0 Build 26885。

## API 根对象与常用入口

表格宿主：从本次调用绑定的原生工作簿 `wpsDocument` → `Worksheets.Item(明确工作表名)` → `Range(明确地址)` 逐步检查。先只读调查；范围/值写入一律安排到 Render。工作表名和地址来自文档调查或引用快照，不能用 ActiveWorkbook/ActiveSheet/Selection 替代。

```js
const book = wpsDocument;
const sheet = book.Worksheets.Item('销售数据'); // 换成已核实的工作表名
return { book: book.Name, sheet: sheet.Name, values: sheet.Range('A1:B10').Value2 };
```

## 显式探测结果（逐项）

状态说明：`支持`=报告中的探测成功；`缺失`=成员未提供；`存在但调用失败`=存在但报告所用调用失败。以下为历史报告，不能保证当前宿主可调用；只读成员可用查询检查，写操作成员的检查及调用只放进 Render，不能按表中通用建议在只读通道探测。

| 组 | 探测项目 / API | 结果 | 诊断细节 | 用法/建议 |
| --- | --- | --- | --- | --- |
| common | Application.Name | 支持 | string | `return Application.Name;` |
| common | Application.Version | 支持 | string | `return Application.Version;` |
| common | Application.Build | 支持 | number | `return Application.Build;` |
| common | Application.Path | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.StartupPath | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.OperatingSystem | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.UserName | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.ActiveWindow | 支持 | object | 活动窗口/选区的历史观测；绑定位置按 `wps_get_document` 或引用快照中的坐标从 `wpsDocument` 读取。 |
| common | Application.Windows | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Selection | 支持 | object | 活动窗口/选区的历史观测；绑定位置按 `wps_get_document` 或引用快照中的坐标从 `wpsDocument` 读取。 |
| common | Application.ApiEvent | 支持 | object | API 事件注册/注销；报告中“listener registration succeeded”表示注册成功，不代表具体事件参数结构已验证。 |
| common | Application.CommandBars | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.COMAddIns | 支持 | null | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Visible | 支持 | boolean | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.DisplayAlerts | 支持 | boolean | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.ScreenUpdating | 支持 | boolean | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.StatusBar | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Caption | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.LanguageSettings | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Options | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.RecentFiles | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.FileDialog | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Undo | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Redo | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Run | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.OnTime | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.SendKeys | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Quit | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Activate | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Calculate | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.CalculateFull | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Documents | 缺失 | undefined | 本宿主诊断中未提供；不要直接使用。若目标版本不同，可在只读守卫允许时检查成员类型。 |
| common | Application.ActiveDocument | 缺失 | undefined | 活动对象的历史观测；当前绑定文档使用 `wpsDocument`，不是此成员。 |
| common | Application.Workbooks | 支持 | object | 表格：`const books = Application.Workbooks; return books.Count;` |
| common | Application.ActiveWorkbook | 支持 | object | 活动对象的历史观测；当前绑定文档使用 `wpsDocument`，不是此成员。 |
| common | Application.Presentations | 缺失 | undefined | 本宿主诊断中未提供；不要直接使用。若目标版本不同，可在只读守卫允许时检查成员类型。 |
| common | Application.ActivePresentation | 缺失 | undefined | 活动对象的历史观测；当前绑定文档使用 `wpsDocument`，不是此成员。 |
| common | Application.Slides | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Sheets | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.AddCustomFunction | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
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
| common | Application.EtApplication | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.WppApplication | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.WpsApplication | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
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
| events | WorkbookOpen | 支持 | listener registration succeeded | 事件名 `WorkbookOpen`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | WorkbookBeforeClose | 支持 | listener registration succeeded | 事件名 `WorkbookBeforeClose`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | WorkbookBeforeSave | 支持 | listener registration succeeded | 事件名 `WorkbookBeforeSave`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | SheetSelectionChange | 支持 | listener registration succeeded | 事件名 `SheetSelectionChange`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | SheetChange | 支持 | listener registration succeeded | 事件名 `SheetChange`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | SheetActivate | 支持 | listener registration succeeded | 事件名 `SheetActivate`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | SheetDeactivate | 支持 | listener registration succeeded | 事件名 `SheetDeactivate`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | WindowActivate | 支持 | listener registration succeeded | 事件名 `WindowActivate`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | WindowDeactivate | 支持 | listener registration succeeded | 事件名 `WindowDeactivate`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | FileAfterSave | 支持 | listener registration succeeded | 事件名 `FileAfterSave`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | DocumentBeforeOpen | 支持 | listener registration succeeded | 事件名 `DocumentBeforeOpen`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | DocumentBeforeCopy | 支持 | listener registration succeeded | 事件名 `DocumentBeforeCopy`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | DocumentBeforePaste | 支持 | listener registration succeeded | 事件名 `DocumentBeforePaste`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| et | Application.Workbooks | 支持 | object | 表格：`const books = Application.Workbooks; return books.Count;` |
| et | Application.ActiveWorkbook | 支持 | object | 活动对象的历史观测；当前绑定文档使用 `wpsDocument`，不是此成员。 |
| et | Application.ActiveSheet | 支持 | object | 活动窗口/选区的历史观测；绑定位置按 `wps_get_document` 或引用快照中的坐标从 `wpsDocument` 读取。 |
| et | Application.Selection | 支持 | object | 活动窗口/选区的历史观测；绑定位置按 `wps_get_document` 或引用快照中的坐标从 `wpsDocument` 读取。 |
| et | Workbooks.Add | 支持 | function | 表格：仅在测试副本/用户明确授权的 Render 中用 `Application.Workbooks.Add()` 创建工作簿。 |
| et | Create temporary workbook | 支持 | created | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| et | Range.Value write | 存在但调用失败 | TypeError: Cannot redefine property: Value | 表格：读取 `wpsDocument.Worksheets.Item('已核实的表名').Range('A1:B2').Value`；写入必须放在 `wps_run_render` 中。 |
| et | Range.Formula write | 支持 | — | 表格：读取 `wpsDocument.Worksheets.Item('已核实的表名').Range('A1:B2').Formula`；写入必须放在 `wps_run_render` 中。 |
| et | Range.Font.Bold write | 支持 | — | 表格：读取 `wpsDocument.Worksheets.Item('已核实的表名').Range('A1:B2').Font.Bold`；写入必须放在 `wps_run_render` 中。 |
| et | Range.NumberFormat write | 支持 | — | 表格：读取 `wpsDocument.Worksheets.Item('已核实的表名').Range('A1:B2').NumberFormat`；写入必须放在 `wps_run_render` 中。 |
| et | Range.Merge | 支持 | — | 表格：从 `wpsDocument.Worksheets.Item(明确表名).Range(明确地址)` 获取范围；此方法的探测及调用只放在 Render 中。 |
| et | Range.UnMerge | 支持 | — | 表格：从 `wpsDocument.Worksheets.Item(明确表名).Range(明确地址)` 获取范围；此方法的探测及调用只放在 Render 中。 |
| et | Range.Copy | 支持 | — | 表格：从 `wpsDocument.Worksheets.Item(明确表名).Range(明确地址)` 获取范围；此方法的探测及调用只放在 Render 中。 |
| et | Range.Insert | 支持 | — | 表格：从 `wpsDocument.Worksheets.Item(明确表名).Range(明确地址)` 获取范围；此方法的探测及调用只放在 Render 中。 |
| et | Range.Delete | 支持 | — | 表格：从 `wpsDocument.Worksheets.Item(明确表名).Range(明确地址)` 获取范围；此方法的探测及调用只放在 Render 中。 |
| et | Range.Find | 支持 | call succeeded | 表格：读取 `wpsDocument.Worksheets.Item('已核实的表名').Range('A1:B2').Find`；写入必须放在 `wps_run_render` 中。 |
| et | Range.Select | 支持 | — | 表格：从 `wpsDocument.Worksheets.Item(明确表名).Range(明确地址)` 获取范围；此方法的探测及调用只放在 Render 中。 |
| et | Shapes.AddShape | 支持 | function | 表格：从 `wpsDocument.Worksheets.Item(明确表名).Shapes` 取得集合；创建/修改只放在 Render 中。 |
| et | Shapes.AddTextbox | 支持 | function | 表格：从 `wpsDocument.Worksheets.Item(明确表名).Shapes` 取得集合；创建/修改只放在 Render 中。 |
| et | Temporary workbook close without save | 支持 | — | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.FileSystem | 支持 | object | FileSystem 是本机文件能力；只在明确授权的流程使用，文件写入不是文档查询。 |
| modern | Application.CreateTaskPane | 支持 | function | `Application.CreateTaskPane(url, title)` 创建任务窗格；报告仅验证成员存在，按需确认参数并避免信任不受信任 URL。 |
| modern | Application.GetTaskPane | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.CreateWebDialog | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.GetWebDialog | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.ShowDialog | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.UpdateRibbon | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.AddCustomFunction | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.PluginStorage | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| modern | Application.ApiEvent | 支持 | object | API 事件注册/注销；报告中“listener registration succeeded”表示注册成功，不代表具体事件参数结构已验证。 |

## 成员目录

以下对象名是诊断报告的分类标签，不是执行环境提供的变量。实际对象应从 `wpsDocument` 及其子对象取得；Application 的活动对象成员仅用于理解历史 API，不能作为绑定文档入口。

下表展示诊断脚本枚举到的 API 成员。类型是当时读取到的 JavaScript 值类型；除上面的显式探测项目外，不能据此断言签名或行为经过调用验证。

### `Application` (382 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| ActivateMicrosoftApp | function | for-in | — | `Application.ActivateMicrosoftApp(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ActivatePromeBrowserPage | function | for-in | — | `Application.ActivatePromeBrowserPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ActiveCell | object | for-in | — | 读取 `Application.ActiveCell`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveChart | null | for-in | — | 读取 `Application.ActiveChart`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveDialog | object | for-in | — | 读取 `Application.ActiveDialog`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveEncryptionSession | number | for-in | — | 读取 `Application.ActiveEncryptionSession`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveMainWindow | object | for-in | — | 读取 `Application.ActiveMainWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveMenuBar | object | for-in | — | 读取 `Application.ActiveMenuBar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActivePrinter | string | for-in | — | 读取 `Application.ActivePrinter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveProtectedViewWindow | null | for-in | — | 读取 `Application.ActiveProtectedViewWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveSheet | object | for-in | — | 读取 `Application.ActiveSheet`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveWindow | object | for-in | — | 读取 `Application.ActiveWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveWorkbook | object | for-in | — | 读取 `Application.ActiveWorkbook`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AddChartAutoFormat | function | for-in | — | `Application.AddChartAutoFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddCustomFunction | function | for-in | — | `Application.AddCustomFunction(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddCustomList | function | for-in | — | `Application.AddCustomList(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddIns | object | for-in | — | 读取 `Application.AddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AddIns2 | object | for-in | — | 读取 `Application.AddIns2`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AlertBeforeOverwriting | boolean | for-in | — | 读取 `Application.AlertBeforeOverwriting`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AltStartupPath | string | for-in | — | 读取 `Application.AltStartupPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AlwaysUseClearType | boolean | for-in | — | 读取 `Application.AlwaysUseClearType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AnswerWizard | object | for-in | — | 读取 `Application.AnswerWizard`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ApiEvent | object | for-in | — | 读取 `Application.ApiEvent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application | object | for-in | — | 读取 `Application.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ArbitraryXMLSupportAvailable | boolean | for-in | — | 读取 `Application.ArbitraryXMLSupportAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Arg2Json | function | for-in | — | `Application.Arg2Json(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AskToUpdateLinks | boolean | for-in | — | 读取 `Application.AskToUpdateLinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Assistance | object | for-in | — | 读取 `Application.Assistance`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Assistant | object | for-in | — | 读取 `Application.Assistant`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoCorrect | object | for-in | — | 读取 `Application.AutoCorrect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoFormatAsYouTypeReplaceHyperlinks | boolean | for-in | — | 读取 `Application.AutoFormatAsYouTypeReplaceHyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoPercentEntry | boolean | for-in | — | 读取 `Application.AutoPercentEntry`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoRecover | object | for-in | — | 读取 `Application.AutoRecover`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutomationSecurity | number | for-in | — | 读取 `Application.AutomationSecurity`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BrowserGroups | object | for-in | — | 读取 `Application.BrowserGroups`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Build | number | for-in | — | 读取 `Application.Build`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| COMAddIns | null | for-in | — | 读取 `Application.COMAddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Calculate | function | for-in | — | `Application.Calculate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CalculateBeforeSave | boolean | for-in | — | 读取 `Application.CalculateBeforeSave`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CalculateFull | function | for-in | — | `Application.CalculateFull(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CalculateFullRebuild | function | for-in | — | `Application.CalculateFullRebuild(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CalculateUntilAsyncQueriesDone | function | for-in | — | `Application.CalculateUntilAsyncQueriesDone(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Calculation | number | for-in | — | 读取 `Application.Calculation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CalculationInterruptKey | number | for-in | — | 读取 `Application.CalculationInterruptKey`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CalculationState | number | for-in | — | 读取 `Application.CalculationState`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CalculationVersion | number | for-in | — | 读取 `Application.CalculationVersion`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Caller | function | for-in | — | `Application.Caller(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CanPlaySounds | boolean | for-in | — | 读取 `Application.CanPlaySounds`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CanRecordSounds | boolean | for-in | — | 读取 `Application.CanRecordSounds`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Caption | string | for-in | — | 读取 `Application.Caption`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CellDragAndDrop | boolean | for-in | — | 读取 `Application.CellDragAndDrop`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Cells | object | for-in | — | 读取 `Application.Cells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CentimetersToPoints | function | for-in | — | `Application.CentimetersToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ChartDataPointTrack | boolean | for-in | — | 读取 `Application.ChartDataPointTrack`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Charts | object | for-in | — | 读取 `Application.Charts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CheckAbort | function | for-in | — | `Application.CheckAbort(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckSpelling | function | for-in | — | `Application.CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClipboardFormats | function | for-in | — | `Application.ClipboardFormats(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClusterConnector | string | for-in | — | 读取 `Application.ClusterConnector`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ColorButtons | boolean | for-in | — | 读取 `Application.ColorButtons`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Columns | object | for-in | — | 读取 `Application.Columns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CommandBars | object | for-in | — | 读取 `Application.CommandBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CommandUnderlines | number | for-in | — | 读取 `Application.CommandUnderlines`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Compress | object | for-in | — | 读取 `Application.Compress`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ConstrainNumeric | boolean | for-in | — | 读取 `Application.ConstrainNumeric`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ControlCharacters | boolean | for-in | — | 读取 `Application.ControlCharacters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ConvertFormula | function | for-in | — | `Application.ConvertFormula(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CopyObjectsWithCells | boolean | for-in | — | 读取 `Application.CopyObjectsWithCells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CreateDataBuffer | function | for-in | — | `Application.CreateDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateObject | function | for-in | — | `Application.CreateObject(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreatePromeBrowserPage | function | for-in | — | `Application.CreatePromeBrowserPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreatePromeFakeTab | function | for-in | — | `Application.CreatePromeFakeTab(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateTaskPane | function | for-in | — | `Application.CreateTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateWebDialog | function | for-in | — | `Application.CreateWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Creator | number | for-in | — | 读取 `Application.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CurrentWPSAddIn | object | for-in | — | 读取 `Application.CurrentWPSAddIn`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Cursor | number | for-in | — | 读取 `Application.Cursor`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CursorMovement | number | for-in | — | 读取 `Application.CursorMovement`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomDomain | string | for-in | — | 读取 `Application.CustomDomain`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomListCount | number | for-in | — | 读取 `Application.CustomListCount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CutCopyMode | number | for-in | — | 读取 `Application.CutCopyMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DDEAppReturnCode | number | for-in | — | 读取 `Application.DDEAppReturnCode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DDEExecute | function | for-in | — | `Application.DDEExecute(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DDEInitiate | function | for-in | — | `Application.DDEInitiate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DDEPoke | function | for-in | — | `Application.DDEPoke(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DDERequest | function | for-in | — | `Application.DDERequest(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DDETerminate | function | for-in | — | `Application.DDETerminate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DataEntryMode | number | for-in | — | 读取 `Application.DataEntryMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DebugTools | object | for-in | — | 读取 `Application.DebugTools`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DecimalSeparator | string | for-in | — | 读取 `Application.DecimalSeparator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultFilePath | string | for-in | — | 读取 `Application.DefaultFilePath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultSaveFormat | number | for-in | — | 读取 `Application.DefaultSaveFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultSheetDirection | number | for-in | — | 读取 `Application.DefaultSheetDirection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultWebOptions | object | for-in | — | 读取 `Application.DefaultWebOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DeferAsyncQueries | boolean | for-in | — | 读取 `Application.DeferAsyncQueries`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DeleteChartAutoFormat | function | for-in | — | `Application.DeleteChartAutoFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DeleteCustomList | function | for-in | — | `Application.DeleteCustomList(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DeleteDataBuffer | function | for-in | — | `Application.DeleteDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DialogSheets | object | for-in | — | 读取 `Application.DialogSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Dialogs | object | for-in | — | 读取 `Application.Dialogs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayAlerts | boolean | for-in | — | 读取 `Application.DisplayAlerts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayClipboardWindow | boolean | for-in | — | 读取 `Application.DisplayClipboardWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayCommentIndicator | number | for-in | — | 读取 `Application.DisplayCommentIndicator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayDocumentActionTaskPane | boolean | for-in | — | 读取 `Application.DisplayDocumentActionTaskPane`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayDocumentInformationPanel | boolean | for-in | — | 读取 `Application.DisplayDocumentInformationPanel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayExcel4Menus | boolean | for-in | — | 读取 `Application.DisplayExcel4Menus`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayFormulaAutoComplete | boolean | for-in | — | 读取 `Application.DisplayFormulaAutoComplete`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayFormulaBar | boolean | for-in | — | 读取 `Application.DisplayFormulaBar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayFullScreen | boolean | for-in | — | 读取 `Application.DisplayFullScreen`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayFunctionToolTips | boolean | for-in | — | 读取 `Application.DisplayFunctionToolTips`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayInfoWindow | boolean | for-in | — | 读取 `Application.DisplayInfoWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayInsertOptions | boolean | for-in | — | 读取 `Application.DisplayInsertOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayNoteIndicator | boolean | for-in | — | 读取 `Application.DisplayNoteIndicator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayPasteOptions | boolean | for-in | — | 读取 `Application.DisplayPasteOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayRecentFiles | boolean | for-in | — | 读取 `Application.DisplayRecentFiles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayScrollBars | boolean | for-in | — | 读取 `Application.DisplayScrollBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayStatusBar | boolean | for-in | — | 读取 `Application.DisplayStatusBar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayXMLSourcePane | function | for-in | — | `Application.DisplayXMLSourcePane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DoubleClick | function | for-in | — | `Application.DoubleClick(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy1 | function | for-in | — | `Application.Dummy1(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy10 | function | for-in | — | `Application.Dummy10(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy101 | null | for-in | — | 读取 `Application.Dummy101`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Dummy11 | function | for-in | — | `Application.Dummy11(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy12 | function | for-in | — | `Application.Dummy12(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy13 | function | for-in | — | `Application.Dummy13(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy14 | function | for-in | — | `Application.Dummy14(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy2 | function | for-in | — | `Application.Dummy2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy20 | function | for-in | — | `Application.Dummy20(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy22 | boolean | for-in | — | 读取 `Application.Dummy22`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Dummy23 | boolean | for-in | — | 读取 `Application.Dummy23`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Dummy3 | function | for-in | — | `Application.Dummy3(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy4 | function | for-in | — | `Application.Dummy4(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy5 | function | for-in | — | `Application.Dummy5(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy6 | function | for-in | — | `Application.Dummy6(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy7 | function | for-in | — | `Application.Dummy7(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy8 | function | for-in | — | `Application.Dummy8(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy9 | function | for-in | — | `Application.Dummy9(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| EditDirectlyInCell | boolean | for-in | — | 读取 `Application.EditDirectlyInCell`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableAnimations | boolean | for-in | — | 读取 `Application.EnableAnimations`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableAutoComplete | boolean | for-in | — | 读取 `Application.EnableAutoComplete`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableCancelKey | number | for-in | — | 读取 `Application.EnableCancelKey`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableCheckFileExtensions | boolean | for-in | — | 读取 `Application.EnableCheckFileExtensions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableEvents | boolean | for-in | — | 读取 `Application.EnableEvents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableLargeOperationAlert | boolean | for-in | — | 读取 `Application.EnableLargeOperationAlert`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableLivePreview | boolean | for-in | — | 读取 `Application.EnableLivePreview`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableMacroAnimations | boolean | for-in | — | 读取 `Application.EnableMacroAnimations`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableSound | boolean | for-in | — | 读取 `Application.EnableSound`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableTipWizard | boolean | for-in | — | 读取 `Application.EnableTipWizard`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Enum | object | for-in | — | 读取 `Application.Enum`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Env | object | for-in | — | 读取 `Application.Env`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ErrorCheckingOptions | object | for-in | — | 读取 `Application.ErrorCheckingOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EtApplication | function | for-in | — | `Application.EtApplication(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Evaluate | function | for-in | — | `Application.Evaluate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Excel4IntlMacroSheets | object | for-in | — | 读取 `Application.Excel4IntlMacroSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Excel4MacroSheets | object | for-in | — | 读取 `Application.Excel4MacroSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ExecFunc | function | for-in | — | `Application.ExecFunc(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExecuteExcel4Macro | function | for-in | — | `Application.ExecuteExcel4Macro(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExtendList | boolean | for-in | — | 读取 `Application.ExtendList`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FeatureInstall | number | for-in | — | 读取 `Application.FeatureInstall`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileConverters | function | for-in | — | `Application.FileConverters(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FileDialog | function | for-in | — | `Application.FileDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FileExportConverters | object | for-in | — | 读取 `Application.FileExportConverters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileFind | object | for-in | — | 读取 `Application.FileFind`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileSearch | object | for-in | — | 读取 `Application.FileSearch`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileSystem | object | for-in | — | 读取 `Application.FileSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileValidation | number | for-in | — | 读取 `Application.FileValidation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileValidationPivot | number | for-in | — | 读取 `Application.FileValidationPivot`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FindFile | function | for-in | — | `Application.FindFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FindFormat | object | for-in | — | 读取 `Application.FindFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FixedDecimal | boolean | for-in | — | 读取 `Application.FixedDecimal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FixedDecimalPlaces | number | for-in | — | 读取 `Application.FixedDecimalPlaces`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FlashFill | boolean | for-in | — | 读取 `Application.FlashFill`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FlashFillMode | boolean | for-in | — | 读取 `Application.FlashFillMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormulaBarHeight | number | for-in | — | 读取 `Application.FormulaBarHeight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GenerateGetPivotData | boolean | for-in | — | 读取 `Application.GenerateGetPivotData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GenerateTableRefs | number | for-in | — | 读取 `Application.GenerateTableRefs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GetApplicationEx | function | for-in | — | `Application.GetApplicationEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetCustomListContents | function | for-in | — | `Application.GetCustomListContents(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetCustomListNum | function | for-in | — | `Application.GetCustomListNum(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetDataBuffer | function | for-in | — | `Application.GetDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetJSReturnValue | function | for-in | — | `Application.GetJSReturnValue(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetOpenFilename | function | for-in | — | `Application.GetOpenFilename(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetPhonetic | function | for-in | — | `Application.GetPhonetic(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetSaveAsFilename | function | for-in | — | `Application.GetSaveAsFilename(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetTaskPane | function | for-in | — | `Application.GetTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetWebDialog | function | for-in | — | `Application.GetWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Goto | function | for-in | — | `Application.Goto(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Height | number | for-in | — | 读取 `Application.Height`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Help | function | for-in | — | `Application.Help(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| HighQualityModeForGraphics | boolean | for-in | — | 读取 `Application.HighQualityModeForGraphics`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Hinstance | number | for-in | — | 读取 `Application.Hinstance`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HinstancePtr | number | for-in | — | 读取 `Application.HinstancePtr`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Hwnd | number | for-in | — | 读取 `Application.Hwnd`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IgnoreRemoteRequests | boolean | for-in | — | 读取 `Application.IgnoreRemoteRequests`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| InchesToPoints | function | for-in | — | `Application.InchesToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InfoCollect | object | for-in | — | 读取 `Application.InfoCollect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| InputBox | function | for-in | — | `Application.InputBox(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Interactive | boolean | for-in | — | 读取 `Application.Interactive`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| International | function | for-in | — | `Application.International(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Intersect | function | for-in | — | `Application.Intersect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| IsLastIOBroken | number | for-in | — | 读取 `Application.IsLastIOBroken`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IsSandboxed | boolean | for-in | — | 读取 `Application.IsSandboxed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Iteration | boolean | for-in | — | 读取 `Application.Iteration`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| JS2Variant | function | for-in | — | `Application.JS2Variant(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| JSIDE | null | for-in | — | 读取 `Application.JSIDE`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageSettings | object | for-in | — | 读取 `Application.LanguageSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LargeButtons | boolean | for-in | — | 读取 `Application.LargeButtons`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LargeOperationCellThousandCount | number | for-in | — | 读取 `Application.LargeOperationCellThousandCount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Left | number | for-in | — | 读取 `Application.Left`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LibraryPath | string | for-in | — | 读取 `Application.LibraryPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MacroOptions | function | for-in | — | `Application.MacroOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MailLogoff | function | for-in | — | `Application.MailLogoff(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MailLogon | function | for-in | — | `Application.MailLogon(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MailSession | null | for-in | — | 读取 `Application.MailSession`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MailSystem | number | for-in | — | 读取 `Application.MailSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MainWindows | object | for-in | — | 读取 `Application.MainWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MapPaperSize | boolean | for-in | — | 读取 `Application.MapPaperSize`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MathCoprocessorAvailable | boolean | for-in | — | 读取 `Application.MathCoprocessorAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MaxChange | number | for-in | — | 读取 `Application.MaxChange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MaxIterations | number | for-in | — | 读取 `Application.MaxIterations`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MeasurementUnit | number | for-in | — | 读取 `Application.MeasurementUnit`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MemoryFree | number | for-in | — | 读取 `Application.MemoryFree`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MemoryTotal | number | for-in | — | 读取 `Application.MemoryTotal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MemoryUsed | number | for-in | — | 读取 `Application.MemoryUsed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MenuBars | object | for-in | — | 读取 `Application.MenuBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MergeInstances | boolean | for-in | — | 读取 `Application.MergeInstances`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Modules | object | for-in | — | 读取 `Application.Modules`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MouseAvailable | boolean | for-in | — | 读取 `Application.MouseAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MoveAfterReturn | boolean | for-in | — | 读取 `Application.MoveAfterReturn`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MoveAfterReturnDirection | number | for-in | — | 读取 `Application.MoveAfterReturnDirection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MultiThreadedCalculation | object | for-in | — | 读取 `Application.MultiThreadedCalculation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Name | string | for-in | — | 读取 `Application.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Names | object | for-in | — | 读取 `Application.Names`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NetworkTemplatesPath | string | for-in | — | 读取 `Application.NetworkTemplatesPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NewEnum | object | for-in | — | 读取 `Application.NewEnum`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NewWorkbook | object | for-in | — | 读取 `Application.NewWorkbook`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NextLetter | function | for-in | — | `Application.NextLetter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OAAssist | object | for-in | — | 读取 `Application.OAAssist`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ODBCErrors | object | for-in | — | 读取 `Application.ODBCErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ODBCTimeout | number | for-in | — | 读取 `Application.ODBCTimeout`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OLEDBErrors | null | for-in | — | 读取 `Application.OLEDBErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Office | object | for-in | — | 读取 `Application.Office`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnCalculate | string | for-in | — | 读取 `Application.OnCalculate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnData | string | for-in | — | 读取 `Application.OnData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnDoubleClick | string | for-in | — | 读取 `Application.OnDoubleClick`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnEntry | string | for-in | — | 读取 `Application.OnEntry`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnKey | function | for-in | — | `Application.OnKey(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OnRepeat | function | for-in | — | `Application.OnRepeat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OnSheetActivate | string | for-in | — | 读取 `Application.OnSheetActivate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnSheetDeactivate | string | for-in | — | 读取 `Application.OnSheetDeactivate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnTime | function | for-in | — | `Application.OnTime(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OnUndo | function | for-in | — | `Application.OnUndo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OnWindow | string | for-in | — | 读取 `Application.OnWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OpenFileLocationInStartPage | function | for-in | — | `Application.OpenFileLocationInStartPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OpenWebUrl | function | for-in | — | `Application.OpenWebUrl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OperatingSystem | string | for-in | — | 读取 `Application.OperatingSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OrganizationName | string | for-in | — | 读取 `Application.OrganizationName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parent | object | for-in | — | 读取 `Application.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Path | string | for-in | — | 读取 `Application.Path`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PathSeparator | string | for-in | — | 读取 `Application.PathSeparator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PivotTableSelection | boolean | for-in | — | 读取 `Application.PivotTableSelection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PluginStorage | object | for-in | — | 读取 `Application.PluginStorage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PreviousSelections | function | for-in | — | `Application.PreviousSelections(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintCommunication | boolean | for-in | — | 读取 `Application.PrintCommunication`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ProductCode | string | for-in | — | 读取 `Application.ProductCode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PromeAddPage | function | for-in | — | `Application.PromeAddPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PromeName | string | for-in | — | 读取 `Application.PromeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PromeNewDocument | function | for-in | — | `Application.PromeNewDocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PromeTidyModeChange | function | for-in | — | `Application.PromeTidyModeChange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PromptForSummaryInfo | boolean | for-in | — | 读取 `Application.PromptForSummaryInfo`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ProtectedViewWindows | object | for-in | — | 读取 `Application.ProtectedViewWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| QuickAnalysis | object | for-in | — | 读取 `Application.QuickAnalysis`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Quit | function | for-in | — | `Application.Quit(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Quitting | boolean | for-in | — | 读取 `Application.Quitting`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RTD | object | for-in | — | 读取 `Application.RTD`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Range | function | for-in | — | `Application.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Ready | boolean | for-in | — | 读取 `Application.Ready`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RecentFiles | object | for-in | — | 读取 `Application.RecentFiles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RecordMacro | function | for-in | — | `Application.RecordMacro(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RecordRelative | boolean | for-in | — | 读取 `Application.RecordRelative`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ReferenceStyle | number | for-in | — | 读取 `Application.ReferenceStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RegisterXLL | function | for-in | — | `Application.RegisterXLL(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RegisteredFunctions | function | for-in | — | `Application.RegisteredFunctions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Repeat | function | for-in | — | `Application.Repeat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReplaceFormat | object | for-in | — | 读取 `Application.ReplaceFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ResetTipWizard | function | for-in | — | `Application.ResetTipWizard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RollZoom | boolean | for-in | — | 读取 `Application.RollZoom`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Rows | object | for-in | — | 读取 `Application.Rows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Run | function | for-in | — | `Application.Run(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Save | function | for-in | — | `Application.Save(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveISO8601Dates | boolean | for-in | — | 读取 `Application.SaveISO8601Dates`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SaveWorkspace | function | for-in | — | `Application.SaveWorkspace(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ScreenUpdating | boolean | for-in | — | 读取 `Application.ScreenUpdating`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Selection | object | for-in | — | 读取 `Application.Selection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SendKeys | function | for-in | — | `Application.SendKeys(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SetDefaultChart | function | for-in | — | `Application.SetDefaultChart(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SharePointVersion | function | for-in | — | `Application.SharePointVersion(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Sheets | object | for-in | — | 读取 `Application.Sheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SheetsInNewWorkbook | number | for-in | — | 读取 `Application.SheetsInNewWorkbook`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShortcutMenus | function | for-in | — | `Application.ShortcutMenus(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowChartTipNames | boolean | for-in | — | 读取 `Application.ShowChartTipNames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowChartTipValues | boolean | for-in | — | 读取 `Application.ShowChartTipValues`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowDevTools | boolean | for-in | — | 读取 `Application.ShowDevTools`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowDialog | function | for-in | — | `Application.ShowDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowDialogEx | function | for-in | — | `Application.ShowDialogEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowExceptionError | function | for-in | — | `Application.ShowExceptionError(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowMenuFloaties | boolean | for-in | — | 读取 `Application.ShowMenuFloaties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowQuickAnalysis | boolean | for-in | — | 读取 `Application.ShowQuickAnalysis`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowSelectionFloaties | boolean | for-in | — | 读取 `Application.ShowSelectionFloaties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowStartupDialog | boolean | for-in | — | 读取 `Application.ShowStartupDialog`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowToolTips | boolean | for-in | — | 读取 `Application.ShowToolTips`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowWindowsInTaskbar | boolean | for-in | — | 读取 `Application.ShowWindowsInTaskbar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartArtColors | object | for-in | — | 读取 `Application.SmartArtColors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartArtLayouts | object | for-in | — | 读取 `Application.SmartArtLayouts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartArtQuickStyles | object | for-in | — | 读取 `Application.SmartArtQuickStyles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartTagRecognizers | object | for-in | — | 读取 `Application.SmartTagRecognizers`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Speech | object | for-in | — | 读取 `Application.Speech`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SpellingOptions | object | for-in | — | 读取 `Application.SpellingOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StandardFont | string | for-in | — | 读取 `Application.StandardFont`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StandardFontSize | number | for-in | — | 读取 `Application.StandardFontSize`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StartAccess | function | for-in | — | `Application.StartAccess(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| StartupEdit | function | for-in | — | `Application.StartupEdit(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| StartupPath | string | for-in | — | 读取 `Application.StartupPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StatusBar | string | for-in | — | 读取 `Application.StatusBar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Support | function | for-in | — | `Application.Support(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| TabPages | object | for-in | — | 读取 `Application.TabPages`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TaskPanesEx | object | for-in | — | 读取 `Application.TaskPanesEx`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TemplatesPath | string | for-in | — | 读取 `Application.TemplatesPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ThisBrowser | object | for-in | — | 读取 `Application.ThisBrowser`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ThisCell | null | for-in | — | 读取 `Application.ThisCell`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ThisWorkbook | object | for-in | — | 读取 `Application.ThisWorkbook`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ThousandsSeparator | string | for-in | — | 读取 `Application.ThousandsSeparator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Toolbars | object | for-in | — | 读取 `Application.Toolbars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Top | number | for-in | — | 读取 `Application.Top`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TransitionMenuKey | string | for-in | — | 读取 `Application.TransitionMenuKey`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TransitionMenuKeyAction | number | for-in | — | 读取 `Application.TransitionMenuKeyAction`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TransitionNavigKeys | boolean | for-in | — | 读取 `Application.TransitionNavigKeys`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UILanguage | number | for-in | — | 读取 `Application.UILanguage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Undo | function | for-in | — | `Application.Undo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Union | function | for-in | — | `Application.Union(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UpdateRibbon | function | for-in | — | `Application.UpdateRibbon(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UsableHeight | number | for-in | — | 读取 `Application.UsableHeight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UsableWidth | number | for-in | — | 读取 `Application.UsableWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UseClusterConnector | boolean | for-in | — | 读取 `Application.UseClusterConnector`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UseSystemSeparators | boolean | for-in | — | 读取 `Application.UseSystemSeparators`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UsedObjects | object | for-in | — | 读取 `Application.UsedObjects`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UserControl | boolean | for-in | — | 读取 `Application.UserControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UserLibraryPath | string | for-in | — | 读取 `Application.UserLibraryPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UserName | string | for-in | — | 读取 `Application.UserName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Value | string | for-in | — | 读取 `Application.Value`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Version | string | for-in | — | 读取 `Application.Version`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Visible | boolean | for-in | — | 读取 `Application.Visible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Volatile | function | for-in | — | `Application.Volatile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| WPSAddIns | object | for-in | — | 读取 `Application.WPSAddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WPSCloudService | object | for-in | — | 读取 `Application.WPSCloudService`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Wait | function | for-in | — | `Application.Wait(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| WarnOnFunctionNameConflict | boolean | for-in | — | 读取 `Application.WarnOnFunctionNameConflict`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Watches | object | for-in | — | 读取 `Application.Watches`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WebJS2Variant | function | for-in | — | `Application.WebJS2Variant(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| WebShape | null | for-in | — | 读取 `Application.WebShape`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Width | number | for-in | — | 读取 `Application.Width`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WindowState | number | for-in | — | 读取 `Application.WindowState`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Windows | object | for-in | — | 读取 `Application.Windows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WindowsForPens | boolean | for-in | — | 读取 `Application.WindowsForPens`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Workbooks | object | for-in | — | 读取 `Application.Workbooks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WorksheetFunction | object | for-in | — | 读取 `Application.WorksheetFunction`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Worksheets | object | for-in | — | 读取 `Application.Worksheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WpsAccount | object | for-in | — | 读取 `Application.WpsAccount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WpsConfig | object | for-in | — | 读取 `Application.WpsConfig`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WpsHttpRequests | object | for-in | — | 读取 `Application.WpsHttpRequests`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WrapCallbackArg | function | for-in | — | `Application.WrapCallbackArg(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _Default | string | for-in | — | 读取 `Application._Default`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| _Evaluate | function | for-in | — | `Application._Evaluate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _FindFile | function | for-in | — | `Application._FindFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _MacroOptions | function | for-in | — | `Application._MacroOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _Run2 | function | for-in | — | `Application._Run2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _WSFunction | function | for-in | — | `Application._WSFunction(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _Wait | function | for-in | — | `Application._Wait(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
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

### `Workbook` (214 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| AcceptAllChanges | function | for-in | — | `Workbook.AcceptAllChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AcceptLabelsInFormulas | boolean | for-in | — | 读取 `Workbook.AcceptLabelsInFormulas`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AccuracyVersion | number | for-in | — | 读取 `Workbook.AccuracyVersion`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Activate | function | for-in | — | `Workbook.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ActiveChart | null | for-in | — | 读取 `Workbook.ActiveChart`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveSheet | object | for-in | — | 读取 `Workbook.ActiveSheet`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveSlicer | null | for-in | — | 读取 `Workbook.ActiveSlicer`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AddToFavorites | function | for-in | — | `Workbook.AddToFavorites(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application | object | for-in | — | 读取 `Workbook.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ApplyTheme | function | for-in | — | `Workbook.ApplyTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Author | string | for-in | — | 读取 `Workbook.Author`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoUpdateFrequency | number | for-in | — | 读取 `Workbook.AutoUpdateFrequency`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoUpdateSaveChanges | null | for-in | — | 读取 `Workbook.AutoUpdateSaveChanges`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BreakLink | function | for-in | — | `Workbook.BreakLink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| BuiltinDocumentProperties | object | for-in | — | 读取 `Workbook.BuiltinDocumentProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CalculationVersion | number | for-in | — | 读取 `Workbook.CalculationVersion`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CanCheckIn | function | for-in | — | `Workbook.CanCheckIn(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CaseSensitive | boolean | for-in | — | 读取 `Workbook.CaseSensitive`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ChangeFileAccess | function | for-in | — | `Workbook.ChangeFileAccess(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ChangeHistoryDuration | number | for-in | — | 读取 `Workbook.ChangeHistoryDuration`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ChangeLink | function | for-in | — | `Workbook.ChangeLink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ChartDataPointTrack | boolean | for-in | — | 读取 `Workbook.ChartDataPointTrack`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Charts | object | for-in | — | 读取 `Workbook.Charts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CheckCompatibility | boolean | for-in | — | 读取 `Workbook.CheckCompatibility`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CheckIn | function | for-in | — | `Workbook.CheckIn(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckInWithVersion | function | for-in | — | `Workbook.CheckInWithVersion(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Close | function | for-in | — | `Workbook.Close(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CodeName | string | for-in | — | 读取 `Workbook.CodeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Colors | function | for-in | — | `Workbook.Colors(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CommandBars | object | for-in | — | 读取 `Workbook.CommandBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Comments | string | for-in | — | 读取 `Workbook.Comments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ConflictResolution | number | for-in | — | 读取 `Workbook.ConflictResolution`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Connections | object | for-in | — | 读取 `Workbook.Connections`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ConnectionsDisabled | boolean | for-in | — | 读取 `Workbook.ConnectionsDisabled`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Container | null | for-in | — | 读取 `Workbook.Container`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ContentTypeProperties | object | for-in | — | 读取 `Workbook.ContentTypeProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CreateBackup | boolean | for-in | — | 读取 `Workbook.CreateBackup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Creator | number | for-in | — | 读取 `Workbook.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomDocumentProperties | object | for-in | — | 读取 `Workbook.CustomDocumentProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomViews | object | for-in | — | 读取 `Workbook.CustomViews`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomXMLParts | object | for-in | — | 读取 `Workbook.CustomXMLParts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Date1904 | boolean | for-in | — | 读取 `Workbook.Date1904`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultPivotTableStyle | string | for-in | — | 读取 `Workbook.DefaultPivotTableStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultSlicerStyle | string | for-in | — | 读取 `Workbook.DefaultSlicerStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultTableStyle | string | for-in | — | 读取 `Workbook.DefaultTableStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultTimelineStyle | null | for-in | — | 读取 `Workbook.DefaultTimelineStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DeleteNumberFormat | function | for-in | — | `Workbook.DeleteNumberFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DialogSheets | object | for-in | — | 读取 `Workbook.DialogSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayDrawingObjects | number | for-in | — | 读取 `Workbook.DisplayDrawingObjects`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayInkComments | boolean | for-in | — | 读取 `Workbook.DisplayInkComments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DoNotPromptForConvert | boolean | for-in | — | 读取 `Workbook.DoNotPromptForConvert`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DocumentInspectors | object | for-in | — | 读取 `Workbook.DocumentInspectors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DocumentLibraryVersions | object | for-in | — | 读取 `Workbook.DocumentLibraryVersions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Dummy16 | function | for-in | — | `Workbook.Dummy16(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy17 | function | for-in | — | `Workbook.Dummy17(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy26 | function | for-in | — | `Workbook.Dummy26(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dummy27 | function | for-in | — | `Workbook.Dummy27(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| EnableAutoRecover | boolean | for-in | — | 读取 `Workbook.EnableAutoRecover`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableConnections | function | for-in | — | `Workbook.EnableConnections(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| EncryptionProvider | string | for-in | — | 读取 `Workbook.EncryptionProvider`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EndReview | function | for-in | — | `Workbook.EndReview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| EnvelopeVisible | boolean | for-in | — | 读取 `Workbook.EnvelopeVisible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Excel4IntlMacroSheets | object | for-in | — | 读取 `Workbook.Excel4IntlMacroSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Excel4MacroSheets | object | for-in | — | 读取 `Workbook.Excel4MacroSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Excel8CompatibilityMode | boolean | for-in | — | 读取 `Workbook.Excel8CompatibilityMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ExclusiveAccess | function | for-in | — | `Workbook.ExclusiveAccess(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExportAsFixedFormat | function | for-in | — | `Workbook.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FileFormat | number | for-in | — | 读取 `Workbook.FileFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Final | boolean | for-in | — | 读取 `Workbook.Final`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FollowHyperlink | function | for-in | — | `Workbook.FollowHyperlink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ForceFullCalculation | boolean | for-in | — | 读取 `Workbook.ForceFullCalculation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ForwardMailer | function | for-in | — | `Workbook.ForwardMailer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FullName | string | for-in | — | 读取 `Workbook.FullName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FullNameURLEncoded | string | for-in | — | 读取 `Workbook.FullNameURLEncoded`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GetWorkbookEx | function | for-in | — | `Workbook.GetWorkbookEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetWorkflowTasks | function | for-in | — | `Workbook.GetWorkflowTasks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetWorkflowTemplates | function | for-in | — | `Workbook.GetWorkflowTemplates(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| HTMLProject | object | for-in | — | 读取 `Workbook.HTMLProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasMailer | boolean | for-in | — | 读取 `Workbook.HasMailer`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasPassword | boolean | for-in | — | 读取 `Workbook.HasPassword`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasRoutingSlip | boolean | for-in | — | 读取 `Workbook.HasRoutingSlip`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasVBProject | null | for-in | — | 读取 `Workbook.HasVBProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HighlightChangesOnScreen | boolean | for-in | — | 读取 `Workbook.HighlightChangesOnScreen`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HighlightChangesOptions | function | for-in | — | `Workbook.HighlightChangesOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| IconSets | object | for-in | — | 读取 `Workbook.IconSets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| InactiveListBorderVisible | boolean | for-in | — | 读取 `Workbook.InactiveListBorderVisible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| InvalidateRightsInfo | function | for-in | — | `Workbook.InvalidateRightsInfo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| IsAddin | boolean | for-in | — | 读取 `Workbook.IsAddin`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IsInplace | boolean | for-in | — | 读取 `Workbook.IsInplace`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| JSProject | null | for-in | — | 读取 `Workbook.JSProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| KeepChangeHistory | boolean | for-in | — | 读取 `Workbook.KeepChangeHistory`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Keywords | string | for-in | — | 读取 `Workbook.Keywords`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LinkInfo | function | for-in | — | `Workbook.LinkInfo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| LinkSources | function | for-in | — | `Workbook.LinkSources(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ListChangesOnNewSheet | boolean | for-in | — | 读取 `Workbook.ListChangesOnNewSheet`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LockServerFile | function | for-in | — | `Workbook.LockServerFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Mailer | object | for-in | — | 读取 `Workbook.Mailer`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MergeWorkbook | function | for-in | — | `Workbook.MergeWorkbook(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Model | object | for-in | — | 读取 `Workbook.Model`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Modules | object | for-in | — | 读取 `Workbook.Modules`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MultiUserEditing | boolean | for-in | — | 读取 `Workbook.MultiUserEditing`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Name | string | for-in | — | 读取 `Workbook.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Names | object | for-in | — | 读取 `Workbook.Names`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NewWindow | function | for-in | — | `Workbook.NewWindow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OnSave | string | for-in | — | 读取 `Workbook.OnSave`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnSheetActivate | string | for-in | — | 读取 `Workbook.OnSheetActivate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnSheetDeactivate | string | for-in | — | 读取 `Workbook.OnSheetDeactivate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OpenLinks | function | for-in | — | `Workbook.OpenLinks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Parent | object | for-in | — | 读取 `Workbook.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Password | string | for-in | — | 读取 `Workbook.Password`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PasswordEncryptionAlgorithm | string | for-in | — | 读取 `Workbook.PasswordEncryptionAlgorithm`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PasswordEncryptionFileProperties | boolean | for-in | — | 读取 `Workbook.PasswordEncryptionFileProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PasswordEncryptionKeyLength | number | for-in | — | 读取 `Workbook.PasswordEncryptionKeyLength`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PasswordEncryptionProvider | string | for-in | — | 读取 `Workbook.PasswordEncryptionProvider`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Path | string | for-in | — | 读取 `Workbook.Path`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Permission | object | for-in | — | 读取 `Workbook.Permission`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PersonalViewListSettings | boolean | for-in | — | 读取 `Workbook.PersonalViewListSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PersonalViewPrintSettings | boolean | for-in | — | 读取 `Workbook.PersonalViewPrintSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PivotCaches | function | for-in | — | `Workbook.PivotCaches(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PivotTableWizard | function | for-in | — | `Workbook.PivotTableWizard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PivotTables | null | for-in | — | 读取 `Workbook.PivotTables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Post | function | for-in | — | `Workbook.Post(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrecisionAsDisplayed | boolean | for-in | — | 读取 `Workbook.PrecisionAsDisplayed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PrintOut | function | for-in | — | `Workbook.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintPreview | function | for-in | — | `Workbook.PrintPreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Protect | function | for-in | — | `Workbook.Protect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ProtectSharing | function | for-in | — | `Workbook.ProtectSharing(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ProtectStructure | boolean | for-in | — | 读取 `Workbook.ProtectStructure`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ProtectWindows | boolean | for-in | — | 读取 `Workbook.ProtectWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PublishObjects | object | for-in | — | 读取 `Workbook.PublishObjects`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PurgeChangeHistoryNow | function | for-in | — | `Workbook.PurgeChangeHistoryNow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Queries | object | for-in | — | 读取 `Workbook.Queries`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ReadOnly | boolean | for-in | — | 读取 `Workbook.ReadOnly`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ReadOnlyRecommended | boolean | for-in | — | 读取 `Workbook.ReadOnlyRecommended`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RecheckSmartTags | function | for-in | — | `Workbook.RecheckSmartTags(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RefreshAll | function | for-in | — | `Workbook.RefreshAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RejectAllChanges | function | for-in | — | `Workbook.RejectAllChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReloadAs | function | for-in | — | `Workbook.ReloadAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RemoveDocumentInformation | function | for-in | — | `Workbook.RemoveDocumentInformation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RemovePersonalInformation | boolean | for-in | — | 读取 `Workbook.RemovePersonalInformation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RemoveUser | function | for-in | — | `Workbook.RemoveUser(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Reply | function | for-in | — | `Workbook.Reply(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReplyAll | function | for-in | — | `Workbook.ReplyAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReplyWithChanges | function | for-in | — | `Workbook.ReplyWithChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Research | object | for-in | — | 读取 `Workbook.Research`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ResetColors | function | for-in | — | `Workbook.ResetColors(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RevisionNumber | number | for-in | — | 读取 `Workbook.RevisionNumber`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Route | function | for-in | — | `Workbook.Route(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Routed | boolean | for-in | — | 读取 `Workbook.Routed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RoutingSlip | object | for-in | — | 读取 `Workbook.RoutingSlip`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RunAutoMacros | function | for-in | — | `Workbook.RunAutoMacros(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Save | function | for-in | — | `Workbook.Save(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveAs | function | for-in | — | `Workbook.SaveAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveAsBinaryString | function | for-in | — | `Workbook.SaveAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveAsUrl | function | for-in | — | `Workbook.SaveAsUrl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveAsXMLData | function | for-in | — | `Workbook.SaveAsXMLData(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveCopyAs | function | for-in | — | `Workbook.SaveCopyAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveLinkValues | boolean | for-in | — | 读取 `Workbook.SaveLinkValues`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Saved | boolean | for-in | — | 读取 `Workbook.Saved`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SendFaxOverInternet | function | for-in | — | `Workbook.SendFaxOverInternet(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SendForReview | function | for-in | — | `Workbook.SendForReview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SendMail | function | for-in | — | `Workbook.SendMail(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SendMailer | function | for-in | — | `Workbook.SendMailer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ServerPolicy | object | for-in | — | 读取 `Workbook.ServerPolicy`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ServerViewableItems | object | for-in | — | 读取 `Workbook.ServerViewableItems`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SetLinkOnData | function | for-in | — | `Workbook.SetLinkOnData(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SetPasswordEncryptionOptions | function | for-in | — | `Workbook.SetPasswordEncryptionOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SharedWorkspace | object | for-in | — | 读取 `Workbook.SharedWorkspace`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Sheets | object | for-in | — | 读取 `Workbook.Sheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowConflictHistory | boolean | for-in | — | 读取 `Workbook.ShowConflictHistory`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowPivotChartActiveFields | boolean | for-in | — | 读取 `Workbook.ShowPivotChartActiveFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowPivotTableFieldList | boolean | for-in | — | 读取 `Workbook.ShowPivotTableFieldList`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Signatures | object | for-in | — | 读取 `Workbook.Signatures`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SlicerCaches | object | for-in | — | 读取 `Workbook.SlicerCaches`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartDocument | object | for-in | — | 读取 `Workbook.SmartDocument`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartTagOptions | object | for-in | — | 读取 `Workbook.SmartTagOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Styles | object | for-in | — | 读取 `Workbook.Styles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Subject | string | for-in | — | 读取 `Workbook.Subject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Sync | object | for-in | — | 读取 `Workbook.Sync`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TableStyles | object | for-in | — | 读取 `Workbook.TableStyles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TemplateRemoveExtData | boolean | for-in | — | 读取 `Workbook.TemplateRemoveExtData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Theme | object | for-in | — | 读取 `Workbook.Theme`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Title | string | for-in | — | 读取 `Workbook.Title`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ToggleFormsDesign | function | for-in | — | `Workbook.ToggleFormsDesign(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Unprotect | function | for-in | — | `Workbook.Unprotect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UnprotectSharing | function | for-in | — | `Workbook.UnprotectSharing(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UpdateFromFile | function | for-in | — | `Workbook.UpdateFromFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UpdateLink | function | for-in | — | `Workbook.UpdateLink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UpdateLinks | number | for-in | — | 读取 `Workbook.UpdateLinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UpdateRemoteReferences | boolean | for-in | — | 读取 `Workbook.UpdateRemoteReferences`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UseWholeCellCriteria | boolean | for-in | — | 读取 `Workbook.UseWholeCellCriteria`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UseWildcards | boolean | for-in | — | 读取 `Workbook.UseWildcards`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UserControl | boolean | for-in | — | 读取 `Workbook.UserControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UserStatus | object | for-in | — | 读取 `Workbook.UserStatus`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| VBASigned | boolean | for-in | — | 读取 `Workbook.VBASigned`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WebOptions | object | for-in | — | 读取 `Workbook.WebOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WebPagePreview | function | for-in | — | `Workbook.WebPagePreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Windows | object | for-in | — | 读取 `Workbook.Windows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Worksheets | object | for-in | — | 读取 `Workbook.Worksheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WritePassword | string | for-in | — | 读取 `Workbook.WritePassword`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WriteReserved | boolean | for-in | — | 读取 `Workbook.WriteReserved`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WriteReservedBy | string | for-in | — | 读取 `Workbook.WriteReservedBy`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XmlImport | function | for-in | — | `Workbook.XmlImport(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| XmlImportXml | function | for-in | — | `Workbook.XmlImportXml(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| XmlMaps | object | for-in | — | 读取 `Workbook.XmlMaps`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XmlNamespaces | object | for-in | — | 读取 `Workbook.XmlNamespaces`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| _CodeName | string | for-in | — | 读取 `Workbook._CodeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| _PrintOut | function | for-in | — | `Workbook._PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _Protect | function | for-in | — | `Workbook._Protect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _ProtectSharing | function | for-in | — | `Workbook._ProtectSharing(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _ReadOnlyRecommended | boolean | for-in | — | 读取 `Workbook._ReadOnlyRecommended`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| _SaveAs | function | for-in | — | `Workbook._SaveAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| __PrintOut | function | for-in | — | `Workbook.__PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| sblt | function | for-in | — | `Workbook.sblt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |

### `Worksheets` (20 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| Add | function | for-in | — | `Worksheets.Add(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Add2 | function | for-in | — | `Worksheets.Add2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application | object | for-in | — | 读取 `Worksheets.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Copy | function | for-in | — | `Worksheets.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Count | number | for-in | — | 读取 `Worksheets.Count`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Creator | number | for-in | — | 读取 `Worksheets.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Delete | function | for-in | — | `Worksheets.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FillAcrossSheets | function | for-in | — | `Worksheets.FillAcrossSheets(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| HPageBreaks | object | for-in | — | 读取 `Worksheets.HPageBreaks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Item | function | for-in | — | `Worksheets.Item(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Move | function | for-in | — | `Worksheets.Move(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Parent | object | for-in | — | 读取 `Worksheets.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PrintOut | function | for-in | — | `Worksheets.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintPreview | function | for-in | — | `Worksheets.PrintPreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Select | function | for-in | — | `Worksheets.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| VPageBreaks | object | for-in | — | 读取 `Worksheets.VPageBreaks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Visible | null | for-in | — | 读取 `Worksheets.Visible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| _Default | function | for-in | — | `Worksheets._Default(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _PrintOut | function | for-in | — | `Worksheets._PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| __PrintOut | function | for-in | — | `Worksheets.__PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |

### `Worksheet` (123 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| Activate | function | for-in | — | `Worksheet.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application | object | for-in | — | 读取 `Worksheet.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Arcs | function | for-in | — | `Worksheet.Arcs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AutoFilter | null | for-in | — | 读取 `Worksheet.AutoFilter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoFilterMode | boolean | for-in | — | 读取 `Worksheet.AutoFilterMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Buttons | function | for-in | — | `Worksheet.Buttons(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Calculate | function | for-in | — | `Worksheet.Calculate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Cells | object | for-in | — | 读取 `Worksheet.Cells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ChartObjects | function | for-in | — | `Worksheet.ChartObjects(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckBoxes | function | for-in | — | `Worksheet.CheckBoxes(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckSpelling | function | for-in | — | `Worksheet.CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CircleInvalid | function | for-in | — | `Worksheet.CircleInvalid(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CircularReference | null | for-in | — | 读取 `Worksheet.CircularReference`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ClearArrows | function | for-in | — | `Worksheet.ClearArrows(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearCircles | function | for-in | — | `Worksheet.ClearCircles(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CodeName | string | for-in | — | 读取 `Worksheet.CodeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Columns | object | for-in | — | 读取 `Worksheet.Columns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Comments | object | for-in | — | 读取 `Worksheet.Comments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ConsolidationFunction | number | for-in | — | 读取 `Worksheet.ConsolidationFunction`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ConsolidationOptions | object | for-in | — | 读取 `Worksheet.ConsolidationOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ConsolidationSources | null | for-in | — | 读取 `Worksheet.ConsolidationSources`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Copy | function | for-in | — | `Worksheet.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Creator | number | for-in | — | 读取 `Worksheet.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomProperties | object | for-in | — | 读取 `Worksheet.CustomProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Delete | function | for-in | — | `Worksheet.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DisplayAutomaticPageBreaks | boolean | for-in | — | 读取 `Worksheet.DisplayAutomaticPageBreaks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayPageBreaks | boolean | for-in | — | 读取 `Worksheet.DisplayPageBreaks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayRightToLeft | boolean | for-in | — | 读取 `Worksheet.DisplayRightToLeft`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DrawingObjects | function | for-in | — | `Worksheet.DrawingObjects(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Drawings | function | for-in | — | `Worksheet.Drawings(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DropDowns | function | for-in | — | `Worksheet.DropDowns(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| EnableAutoFilter | boolean | for-in | — | 读取 `Worksheet.EnableAutoFilter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableCalculation | boolean | for-in | — | 读取 `Worksheet.EnableCalculation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableFormatConditionsCalculation | boolean | for-in | — | 读取 `Worksheet.EnableFormatConditionsCalculation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableOutlining | boolean | for-in | — | 读取 `Worksheet.EnableOutlining`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnablePivotTable | boolean | for-in | — | 读取 `Worksheet.EnablePivotTable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EnableSelection | number | for-in | — | 读取 `Worksheet.EnableSelection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Evaluate | function | for-in | — | `Worksheet.Evaluate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExportAsFixedFormat | function | for-in | — | `Worksheet.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExportToPNG | function | for-in | — | `Worksheet.ExportToPNG(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FilterMode | boolean | for-in | — | 读取 `Worksheet.FilterMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GroupBoxes | function | for-in | — | `Worksheet.GroupBoxes(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GroupObjects | function | for-in | — | `Worksheet.GroupObjects(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| HPageBreaks | object | for-in | — | 读取 `Worksheet.HPageBreaks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Hyperlinks | object | for-in | — | 读取 `Worksheet.Hyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Index | number | for-in | — | 读取 `Worksheet.Index`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Labels | function | for-in | — | `Worksheet.Labels(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Lines | function | for-in | — | `Worksheet.Lines(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ListBoxes | function | for-in | — | `Worksheet.ListBoxes(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ListObjects | object | for-in | — | 读取 `Worksheet.ListObjects`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MailEnvelope | object | for-in | — | 读取 `Worksheet.MailEnvelope`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Move | function | for-in | — | `Worksheet.Move(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Name | string | for-in | — | 读取 `Worksheet.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Names | object | for-in | — | 读取 `Worksheet.Names`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Next | null | for-in | — | 读取 `Worksheet.Next`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OLEObjects | function | for-in | — | `Worksheet.OLEObjects(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OnCalculate | string | for-in | — | 读取 `Worksheet.OnCalculate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnData | string | for-in | — | 读取 `Worksheet.OnData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnDoubleClick | string | for-in | — | 读取 `Worksheet.OnDoubleClick`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnEntry | string | for-in | — | 读取 `Worksheet.OnEntry`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnSheetActivate | string | for-in | — | 读取 `Worksheet.OnSheetActivate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OnSheetDeactivate | string | for-in | — | 读取 `Worksheet.OnSheetDeactivate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OptionButtons | function | for-in | — | `Worksheet.OptionButtons(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Outline | object | for-in | — | 读取 `Worksheet.Outline`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Ovals | function | for-in | — | `Worksheet.Ovals(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PageSetup | object | for-in | — | 读取 `Worksheet.PageSetup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parent | object | for-in | — | 读取 `Worksheet.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Paste | function | for-in | — | `Worksheet.Paste(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteSpecial | function | for-in | — | `Worksheet.PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Pictures | function | for-in | — | `Worksheet.Pictures(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PivotTableWizard | function | for-in | — | `Worksheet.PivotTableWizard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PivotTables | function | for-in | — | `Worksheet.PivotTables(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Previous | null | for-in | — | 读取 `Worksheet.Previous`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PrintOut | function | for-in | — | `Worksheet.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintPreview | function | for-in | — | `Worksheet.PrintPreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintedCommentPages | number | for-in | — | 读取 `Worksheet.PrintedCommentPages`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Protect | function | for-in | — | `Worksheet.Protect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ProtectContents | boolean | for-in | — | 读取 `Worksheet.ProtectContents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ProtectDrawingObjects | boolean | for-in | — | 读取 `Worksheet.ProtectDrawingObjects`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ProtectScenarios | boolean | for-in | — | 读取 `Worksheet.ProtectScenarios`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Protection | object | for-in | — | 读取 `Worksheet.Protection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ProtectionMode | boolean | for-in | — | 读取 `Worksheet.ProtectionMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| QueryTables | object | for-in | — | 读取 `Worksheet.QueryTables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Range | function | for-in | — | `Worksheet.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Rectangles | function | for-in | — | `Worksheet.Rectangles(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ResetAllPageBreaks | function | for-in | — | `Worksheet.ResetAllPageBreaks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Rows | object | for-in | — | 读取 `Worksheet.Rows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SaveAs | function | for-in | — | `Worksheet.SaveAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Scenarios | function | for-in | — | `Worksheet.Scenarios(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Scripts | object | for-in | — | 读取 `Worksheet.Scripts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ScrollArea | string | for-in | — | 读取 `Worksheet.ScrollArea`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ScrollBars | function | for-in | — | `Worksheet.ScrollBars(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Select | function | for-in | — | `Worksheet.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SetBackgroundPicture | function | for-in | — | `Worksheet.SetBackgroundPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Shapes | object | for-in | — | 读取 `Worksheet.Shapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowAllData | function | for-in | — | `Worksheet.ShowAllData(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowDataForm | function | for-in | — | `Worksheet.ShowDataForm(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SmartTags | object | for-in | — | 读取 `Worksheet.SmartTags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Sort | object | for-in | — | 读取 `Worksheet.Sort`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spinners | function | for-in | — | `Worksheet.Spinners(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| StandardHeight | number | for-in | — | 读取 `Worksheet.StandardHeight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StandardWidth | number | for-in | — | 读取 `Worksheet.StandardWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Tab | object | for-in | — | 读取 `Worksheet.Tab`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TextBoxes | function | for-in | — | `Worksheet.TextBoxes(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| TransitionExpEval | boolean | for-in | — | 读取 `Worksheet.TransitionExpEval`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TransitionFormEntry | boolean | for-in | — | 读取 `Worksheet.TransitionFormEntry`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Type | number | for-in | — | 读取 `Worksheet.Type`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Unprotect | function | for-in | — | `Worksheet.Unprotect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UsedRange | object | for-in | — | 读取 `Worksheet.UsedRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| VPageBreaks | object | for-in | — | 读取 `Worksheet.VPageBreaks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Visible | number | for-in | — | 读取 `Worksheet.Visible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WorksheetEx | object | for-in | — | 读取 `Worksheet.WorksheetEx`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XmlDataQuery | function | for-in | — | `Worksheet.XmlDataQuery(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| XmlMapQuery | function | for-in | — | `Worksheet.XmlMapQuery(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _CheckSpelling | function | for-in | — | `Worksheet._CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _CodeName | string | for-in | — | 读取 `Worksheet._CodeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| _DisplayRightToLeft | number | for-in | — | 读取 `Worksheet._DisplayRightToLeft`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| _Evaluate | function | for-in | — | `Worksheet._Evaluate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _PasteSpecial | function | for-in | — | `Worksheet._PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _PrintOut | function | for-in | — | `Worksheet._PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _Protect | function | for-in | — | `Worksheet._Protect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _SaveAs | function | for-in | — | `Worksheet._SaveAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| __PrintOut | function | for-in | — | `Worksheet.__PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |

### `Range` (194 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| Activate | function | for-in | — | `Range.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddComment | function | for-in | — | `Range.AddComment(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddIndent | number | for-in | — | 读取 `Range.AddIndent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Address | function | for-in | — | `Range.Address(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddressLocal | function | for-in | — | `Range.AddressLocal(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AdvancedFilter | function | for-in | — | `Range.AdvancedFilter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AllocateChanges | function | for-in | — | `Range.AllocateChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AllowEdit | boolean | for-in | — | 读取 `Range.AllowEdit`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application | object | for-in | — | 读取 `Range.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ApplyNames | function | for-in | — | `Range.ApplyNames(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ApplyOutlineStyles | function | for-in | — | `Range.ApplyOutlineStyles(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Areas | object | for-in | — | 读取 `Range.Areas`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoComplete | function | for-in | — | `Range.AutoComplete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AutoFill | function | for-in | — | `Range.AutoFill(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AutoFilter | function | for-in | — | `Range.AutoFilter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AutoFit | function | for-in | — | `Range.AutoFit(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AutoFormat | function | for-in | — | `Range.AutoFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AutoOutline | function | for-in | — | `Range.AutoOutline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| BorderAround | function | for-in | — | `Range.BorderAround(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Borders | object | for-in | — | 读取 `Range.Borders`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Calculate | function | for-in | — | `Range.Calculate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CalculateRowMajorOrder | function | for-in | — | `Range.CalculateRowMajorOrder(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Cells | object | for-in | — | 读取 `Range.Cells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Characters | function | for-in | — | `Range.Characters(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckSpelling | function | for-in | — | `Range.CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Clear | function | for-in | — | `Range.Clear(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearComments | function | for-in | — | `Range.ClearComments(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearContents | function | for-in | — | `Range.ClearContents(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearFormats | function | for-in | — | `Range.ClearFormats(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearHyperlinks | function | for-in | — | `Range.ClearHyperlinks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearNotes | function | for-in | — | `Range.ClearNotes(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ClearOutline | function | for-in | — | `Range.ClearOutline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Column | number | for-in | — | 读取 `Range.Column`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ColumnDifferences | function | for-in | — | `Range.ColumnDifferences(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ColumnWidth | number | for-in | — | 读取 `Range.ColumnWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Columns | object | for-in | — | 读取 `Range.Columns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Comment | null | for-in | — | 读取 `Range.Comment`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Consolidate | function | for-in | — | `Range.Consolidate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Copy | function | for-in | — | `Range.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CopyFromRecordset | function | for-in | — | `Range.CopyFromRecordset(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CopyPicture | function | for-in | — | `Range.CopyPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Count | number | for-in | — | 读取 `Range.Count`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CountLarge | number | for-in | — | 读取 `Range.CountLarge`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CreateNames | function | for-in | — | `Range.CreateNames(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreatePublisher | function | for-in | — | `Range.CreatePublisher(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Creator | number | for-in | — | 读取 `Range.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CurrentArray | object | for-in | — | 读取 `Range.CurrentArray`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CurrentRegion | object | for-in | — | 读取 `Range.CurrentRegion`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Cut | function | for-in | — | `Range.Cut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DataSeries | function | for-in | — | `Range.DataSeries(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Delete | function | for-in | — | `Range.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dependents | null | for-in | — | 读取 `Range.Dependents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DialogBox | function | for-in | — | `Range.DialogBox(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DirectDependents | null | for-in | — | 读取 `Range.DirectDependents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DirectPrecedents | null | for-in | — | 读取 `Range.DirectPrecedents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Dirty | function | for-in | — | `Range.Dirty(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DiscardChanges | function | for-in | — | `Range.DiscardChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DisplayFormat | object | for-in | — | 读取 `Range.DisplayFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EditionOptions | function | for-in | — | `Range.EditionOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| End | function | for-in | — | `Range.End(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| EntireColumn | object | for-in | — | 读取 `Range.EntireColumn`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EntireRow | object | for-in | — | 读取 `Range.EntireRow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Errors | null | for-in | — | 读取 `Range.Errors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ExportAsFixedFormat | function | for-in | — | `Range.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FillDown | function | for-in | — | `Range.FillDown(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FillLeft | function | for-in | — | `Range.FillLeft(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FillRight | function | for-in | — | `Range.FillRight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FillUp | function | for-in | — | `Range.FillUp(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Find | function | for-in | — | `Range.Find(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FindNext | function | for-in | — | `Range.FindNext(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FindPrevious | function | for-in | — | `Range.FindPrevious(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FlashFill | function | for-in | — | `Range.FlashFill(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Font | object | for-in | — | 读取 `Range.Font`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormatConditions | object | for-in | — | 读取 `Range.FormatConditions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Formula | object | for-in | — | 读取 `Range.Formula`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Formula2 | object | for-in | — | 读取 `Range.Formula2`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Formula2Local | object | for-in | — | 读取 `Range.Formula2Local`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Formula2R1C1 | object | for-in | — | 读取 `Range.Formula2R1C1`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Formula2R1C1Local | object | for-in | — | 读取 `Range.Formula2R1C1Local`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormulaArray | string | for-in | — | 读取 `Range.FormulaArray`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormulaHidden | boolean | for-in | — | 读取 `Range.FormulaHidden`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormulaLabel | number | for-in | — | 读取 `Range.FormulaLabel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormulaLocal | object | for-in | — | 读取 `Range.FormulaLocal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormulaR1C1 | object | for-in | — | 读取 `Range.FormulaR1C1`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FormulaR1C1Local | object | for-in | — | 读取 `Range.FormulaR1C1Local`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FunctionWizard | function | for-in | — | `Range.FunctionWizard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetRangeEx | function | for-in | — | `Range.GetRangeEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GoalSeek | function | for-in | — | `Range.GoalSeek(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Group | function | for-in | — | `Range.Group(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| HasArray | boolean | for-in | — | 读取 `Range.HasArray`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasFormula | boolean | for-in | — | 读取 `Range.HasFormula`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasSpill | boolean | for-in | — | 读取 `Range.HasSpill`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Height | number | for-in | — | 读取 `Range.Height`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Hidden | null | for-in | — | 读取 `Range.Hidden`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HorizontalAlignment | number | for-in | — | 读取 `Range.HorizontalAlignment`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Hyperlinks | object | for-in | — | 读取 `Range.Hyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ID | null | for-in | — | 读取 `Range.ID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IndentLevel | number | for-in | — | 读取 `Range.IndentLevel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Insert | function | for-in | — | `Range.Insert(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertIndent | function | for-in | — | `Range.InsertIndent(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Interior | object | for-in | — | 读取 `Range.Interior`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Item | function | for-in | — | `Range.Item(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Justify | function | for-in | — | `Range.Justify(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Left | number | for-in | — | 读取 `Range.Left`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ListHeaderRows | number | for-in | — | 读取 `Range.ListHeaderRows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ListNames | function | for-in | — | `Range.ListNames(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ListObject | null | for-in | — | 读取 `Range.ListObject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LocationInTable | null | for-in | — | 读取 `Range.LocationInTable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Locked | boolean | for-in | — | 读取 `Range.Locked`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MDX | string | for-in | — | 读取 `Range.MDX`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Merge | function | for-in | — | `Range.Merge(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MergeArea | null | for-in | — | 读取 `Range.MergeArea`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MergeCells | boolean | for-in | — | 读取 `Range.MergeCells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Name | null | for-in | — | 读取 `Range.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NavigateArrow | function | for-in | — | `Range.NavigateArrow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Next | object | for-in | — | 读取 `Range.Next`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NoteText | function | for-in | — | `Range.NoteText(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| NumberFormat | string | for-in | — | 读取 `Range.NumberFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NumberFormatLocal | string | for-in | — | 读取 `Range.NumberFormatLocal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Offset | function | for-in | — | `Range.Offset(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Orientation | number | for-in | — | 读取 `Range.Orientation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OutlineLevel | null | for-in | — | 读取 `Range.OutlineLevel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PageBreak | number | for-in | — | 读取 `Range.PageBreak`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parent | object | for-in | — | 读取 `Range.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parse | function | for-in | — | `Range.Parse(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteSpecial | function | for-in | — | `Range.PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Phonetic | object | for-in | — | 读取 `Range.Phonetic`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Phonetics | object | for-in | — | 读取 `Range.Phonetics`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PivotCell | null | for-in | — | 读取 `Range.PivotCell`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PivotField | null | for-in | — | 读取 `Range.PivotField`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PivotItem | null | for-in | — | 读取 `Range.PivotItem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PivotTable | null | for-in | — | 读取 `Range.PivotTable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Precedents | null | for-in | — | 读取 `Range.Precedents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PrefixCharacter | string | for-in | — | 读取 `Range.PrefixCharacter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Previous | null | for-in | — | 读取 `Range.Previous`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PrintOut | function | for-in | — | `Range.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintPreview | function | for-in | — | `Range.PrintPreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| QueryTable | null | for-in | — | 读取 `Range.QueryTable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Range | function | for-in | — | `Range.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RangeEx | object | for-in | — | 读取 `Range.RangeEx`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ReadingOrder | number | for-in | — | 读取 `Range.ReadingOrder`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RealValue2 | object | for-in | — | 读取 `Range.RealValue2`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RemoveDuplicates | function | for-in | — | `Range.RemoveDuplicates(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RemoveSubtotal | function | for-in | — | `Range.RemoveSubtotal(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Replace | function | for-in | — | `Range.Replace(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Resize | function | for-in | — | `Range.Resize(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Row | number | for-in | — | 读取 `Range.Row`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RowDifferences | function | for-in | — | `Range.RowDifferences(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RowHeight | number | for-in | — | 读取 `Range.RowHeight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Rows | object | for-in | — | 读取 `Range.Rows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Run | function | for-in | — | `Range.Run(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Select | function | for-in | — | `Range.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ServerActions | object | for-in | — | 读取 `Range.ServerActions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SetPhonetic | function | for-in | — | `Range.SetPhonetic(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Show | function | for-in | — | `Range.Show(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowDependents | function | for-in | — | `Range.ShowDependents(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowDetail | null | for-in | — | 读取 `Range.ShowDetail`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowErrors | function | for-in | — | `Range.ShowErrors(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowPrecedents | function | for-in | — | `Range.ShowPrecedents(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShrinkToFit | boolean | for-in | — | 读取 `Range.ShrinkToFit`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartTags | object | for-in | — | 读取 `Range.SmartTags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Sort | function | for-in | — | `Range.Sort(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SortSpecial | function | for-in | — | `Range.SortSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SoundNote | object | for-in | — | 读取 `Range.SoundNote`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SparklineGroups | object | for-in | — | 读取 `Range.SparklineGroups`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Speak | function | for-in | — | `Range.Speak(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SpecialCells | function | for-in | — | `Range.SpecialCells(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SpillParent | null | for-in | — | 读取 `Range.SpillParent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SpillingToRange | null | for-in | — | 读取 `Range.SpillingToRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Style | object | for-in | — | 读取 `Range.Style`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SubscribeTo | function | for-in | — | `Range.SubscribeTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Subtotal | function | for-in | — | `Range.Subtotal(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Summary | null | for-in | — | 读取 `Range.Summary`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Table | function | for-in | — | `Range.Table(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Text | string | for-in | — | 读取 `Range.Text`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TextToColumns | function | for-in | — | `Range.TextToColumns(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Top | number | for-in | — | 读取 `Range.Top`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UnMerge | function | for-in | — | `Range.UnMerge(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Ungroup | function | for-in | — | `Range.Ungroup(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UseStandardHeight | boolean | for-in | — | 读取 `Range.UseStandardHeight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UseStandardWidth | boolean | for-in | — | 读取 `Range.UseStandardWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Validation | object | for-in | — | 读取 `Range.Validation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Value | function | for-in | — | `Range.Value(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Value2 | object | for-in | — | 读取 `Range.Value2`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| VerticalAlignment | number | for-in | — | 读取 `Range.VerticalAlignment`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Width | number | for-in | — | 读取 `Range.Width`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Worksheet | object | for-in | — | 读取 `Range.Worksheet`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WrapText | boolean | for-in | — | 读取 `Range.WrapText`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| XPath | null | for-in | — | 读取 `Range.XPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| _BorderAround | function | for-in | — | `Range._BorderAround(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _Default | function | for-in | — | `Range._Default(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _PasteSpecial | function | for-in | — | `Range._PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _PrintOut | function | for-in | — | `Range._PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| __PrintOut | function | for-in | — | `Range.__PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |

### `Shapes` (30 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| AddCallout | function | for-in | — | `Shapes.AddCallout(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddCanvas | function | for-in | — | `Shapes.AddCanvas(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddChart | function | for-in | — | `Shapes.AddChart(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddChart2 | function | for-in | — | `Shapes.AddChart2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddConnector | function | for-in | — | `Shapes.AddConnector(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddCurve | function | for-in | — | `Shapes.AddCurve(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddDiagram | function | for-in | — | `Shapes.AddDiagram(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddFormControl | function | for-in | — | `Shapes.AddFormControl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddLabel | function | for-in | — | `Shapes.AddLabel(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddLine | function | for-in | — | `Shapes.AddLine(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddMath | function | for-in | — | `Shapes.AddMath(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddOLEObject | function | for-in | — | `Shapes.AddOLEObject(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddPicture | function | for-in | — | `Shapes.AddPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddPicture2 | function | for-in | — | `Shapes.AddPicture2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddPolyline | function | for-in | — | `Shapes.AddPolyline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddShape | function | for-in | — | `Shapes.AddShape(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddSmartArt | function | for-in | — | `Shapes.AddSmartArt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddTextEffect | function | for-in | — | `Shapes.AddTextEffect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddTextbox | function | for-in | — | `Shapes.AddTextbox(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddWebShape | function | for-in | — | `Shapes.AddWebShape(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddWebShapeEx | function | for-in | — | `Shapes.AddWebShapeEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application | object | for-in | — | 读取 `Shapes.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BuildFreeform | function | for-in | — | `Shapes.BuildFreeform(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Count | number | for-in | — | 读取 `Shapes.Count`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Creator | number | for-in | — | 读取 `Shapes.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Item | function | for-in | — | `Shapes.Item(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Parent | object | for-in | — | 读取 `Shapes.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Range | function | for-in | — | `Shapes.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectAll | function | for-in | — | `Shapes.SelectAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| _Default | function | for-in | — | `Shapes._Default(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |

## 候选成员检查

`candidateScan` 是针对候选路径的存在性/类型快照，不是完整方法调用测试。

| 对象 | 成员 | 存在状态 | 类型 |
| --- | --- | --- | --- |
| Application | Name | 支持 | string |
| Application | Version | 支持 | string |
| Application | Build | 支持 | number |
| Application | Path | 支持 | string |
| Application | StartupPath | 支持 | string |
| Application | OperatingSystem | 支持 | string |
| Application | UserName | 支持 | string |
| Application | ActiveWindow | 支持 | object |
| Application | Windows | 支持 | object |
| Application | Selection | 支持 | object |
| Application | ApiEvent | 支持 | object |
| Application | CommandBars | 支持 | object |
| Application | COMAddIns | 支持 | null |
| Application | Visible | 支持 | boolean |
| Application | DisplayAlerts | 支持 | boolean |
| Application | ScreenUpdating | 支持 | boolean |
| Application | StatusBar | 支持 | string |
| Application | Caption | 支持 | string |
| Application | LanguageSettings | 支持 | object |
| Application | Options | 缺失 | undefined |
| Application | RecentFiles | 支持 | object |
| Application | FileDialog | 支持 | function |
| Application | Undo | 支持 | function |
| Application | Redo | 缺失 | undefined |
| Application | Run | 支持 | function |
| Application | OnTime | 支持 | function |
| Application | SendKeys | 支持 | function |
| Application | Quit | 支持 | function |
| Application | Activate | 缺失 | undefined |
| Application | Calculate | 支持 | function |
| Application | CalculateFull | 支持 | function |
| Application | Documents | 缺失 | undefined |
| Application | ActiveDocument | 缺失 | undefined |
| Application | Workbooks | 支持 | object |
| Application | ActiveWorkbook | 支持 | object |
| Application | Presentations | 缺失 | undefined |
| Application | ActivePresentation | 缺失 | undefined |
| Application | Slides | 缺失 | undefined |
| Application | Sheets | 支持 | object |
| Application | AddCustomFunction | 支持 | function |
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
| Application | EtApplication | 支持 | function |
| Application | WppApplication | 缺失 | undefined |
| Application | WpsApplication | 缺失 | undefined |
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
| wpsGlobal | AddCustomFunction | 支持 | function |
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
| wpsGlobalModern | AddCustomFunction | 支持 | function |
| wpsGlobalModern | RemoveCustomFunction | 缺失 | undefined |
| wpsGlobalModern | RemoveAllCustomFunctions | 缺失 | undefined |
| wpsGlobalModern | PluginStorage | 支持 | object |
| wpsGlobalModern | WpsAddonMgr | 缺失 | undefined |
| wpsGlobalModern | WpsInvoke | 缺失 | undefined |
| wpsGlobalModern | WpsClient | 缺失 | undefined |
| Workbook | Name | 支持 | string |
| Workbook | FullName | 支持 | string |
| Workbook | Path | 支持 | string |
| Workbook | Saved | 支持 | boolean |
| Workbook | Sheets | 支持 | object |
| Workbook | Worksheets | 支持 | object |
| Workbook | ActiveSheet | 支持 | object |
| Workbook | Names | 支持 | object |
| Workbook | Styles | 支持 | object |
| Workbook | BuiltinDocumentProperties | 支持 | object |
| Workbook | CustomDocumentProperties | 支持 | object |
| Workbook | Save | 支持 | function |
| Workbook | SaveAs | 支持 | function |
| Workbook | Close | 支持 | function |
| Workbook | Protect | 支持 | function |
| Workbook | Unprotect | 支持 | function |
| Workbook | RefreshAll | 支持 | function |
| Workbook | Connections | 支持 | object |
| Workbook | PivotCaches | 支持 | function |
| Worksheet | Name | 支持 | string |
| Worksheet | Index | 支持 | number |
| Worksheet | Cells | 支持 | object |
| Worksheet | Range | 支持 | function |
| Worksheet | Rows | 支持 | object |
| Worksheet | Columns | 支持 | object |
| Worksheet | UsedRange | 支持 | object |
| Worksheet | Shapes | 支持 | object |
| Worksheet | ChartObjects | 支持 | function |
| Worksheet | Charts | 缺失 | undefined |
| Worksheet | Names | 支持 | object |
| Worksheet | Hyperlinks | 支持 | object |
| Worksheet | Comments | 支持 | object |
| Worksheet | AutoFilter | 支持 | null |
| Worksheet | PageSetup | 支持 | object |
| Worksheet | Protect | 支持 | function |
| Worksheet | Unprotect | 支持 | function |
| Worksheet | Activate | 支持 | function |
| Worksheet | Select | 支持 | function |
| Worksheet | Delete | 支持 | function |
| Worksheet | Copy | 支持 | function |
| Worksheet | Move | 支持 | function |
| Range | Address | 支持 | function |
| Range | Value | 支持 | function |
| Range | Value2 | 支持 | object |
| Range | Text | 支持 | string |
| Range | Formula | 支持 | object |
| Range | FormulaR1C1 | 支持 | object |
| Range | NumberFormat | 支持 | string |
| Range | Font | 支持 | object |
| Range | Interior | 支持 | object |
| Range | Borders | 支持 | object |
| Range | HorizontalAlignment | 支持 | number |
| Range | VerticalAlignment | 支持 | number |
| Range | MergeCells | 支持 | boolean |
| Range | Rows | 支持 | object |
| Range | Columns | 支持 | object |
| Range | EntireRow | 支持 | object |
| Range | EntireColumn | 支持 | object |
| Range | Row | 支持 | number |
| Range | Column | 支持 | number |
| Range | Count | 支持 | number |
| Range | Cells | 支持 | object |
| Range | Areas | 支持 | object |
| Range | CurrentRegion | 支持 | object |
| Range | UsedRange | 缺失 | undefined |
| Range | Offset | 支持 | function |
| Range | Resize | 支持 | function |
| Range | End | 支持 | function |
| Range | SpecialCells | 支持 | function |
| Range | Find | 支持 | function |
| Range | Replace | 支持 | function |
| Range | Sort | 支持 | function |
| Range | AutoFilter | 支持 | function |
| Range | AdvancedFilter | 支持 | function |
| Range | Copy | 支持 | function |
| Range | Cut | 支持 | function |
| Range | PasteSpecial | 支持 | function |
| Range | Clear | 支持 | function |
| Range | ClearContents | 支持 | function |
| Range | ClearFormats | 支持 | function |
| Range | Delete | 支持 | function |
| Range | Insert | 支持 | function |
| Range | Merge | 支持 | function |
| Range | UnMerge | 支持 | function |
| Range | Select | 支持 | function |
| Range | Activate | 支持 | function |
| Range | Name | 支持 | null |
| Range | Comment | 支持 | null |
| Range | AddComment | 支持 | function |
| Range | Hyperlinks | 支持 | object |
| Range | Validation | 支持 | object |
| Range | FormatConditions | 支持 | object |
| Range | Locked | 支持 | boolean |
| Range | Hidden | 支持 | null |
| Range | ColumnWidth | 支持 | number |
| Range | RowHeight | 支持 | number |
| Range | WrapText | 支持 | boolean |
| Range | ShrinkToFit | 支持 | boolean |

## 应用侧建议

- 使用 `documentId` 定位文档，不要以文件名路由。
- 先检查活动对象、集合 Count 与目标名称；集合通常用 1-based `Item(index)`。
- 读 Range/表格/图表时控制输出规模，只返回标量、数组、普通 JSON 对象。
- API 返回 COM/WPS 宿主代理对象时不要直接 `return object`；显式映射为 JSON 字段。
- 本目录中带 `write` 的探测仅说明诊断工具在临时文档上完成操作；对 MCP 调用仍需严格遵循 `wps_run_render` 边界。
