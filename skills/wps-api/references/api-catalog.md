# 完整 API 成员目录

按报告的 `discovered` 对象成员展开，去掉了与 `Application` 重复的 `wpsGlobal` / `window.wps` 等别名。`function` 表示函数成员可见，不代表参数/效果已验证。查找显式验证结果应返回对应宿主 API guide 的“显式探测结果”。

本目录保留历史宿主成员名称；ActiveWorkbook/ActivePresentation/ActiveDocument 及 Selection 指向活动上下文，不是本次绑定。查询、Transform、Render 中使用 `wpsDocument` 访问指定文档，并按引用快照的明确位置读取选区。宿主函数的存在性也不表示可在只读通道调用；修改只放在 Render。

| 宿主 | 对象 | 成员 | 类型 | 验证范围 | 使用说明 |
| --- | --- | --- | --- | --- | --- |
| Presentation / WPP | ActiveWindow | Activate | function | 仅发现/枚举 | `ActiveWindow.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | Active | number | 仅发现/枚举 | 读取 `ActiveWindow.Active`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | ActivePane | object | 仅发现/枚举 | 读取 `ActiveWindow.ActivePane`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | Application | object | 仅发现/枚举 | 读取 `ActiveWindow.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | BlackAndWhite | number | 仅发现/枚举 | 读取 `ActiveWindow.BlackAndWhite`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | Caption | string | 仅发现/枚举 | 读取 `ActiveWindow.Caption`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | Close | function | 仅发现/枚举 | `ActiveWindow.Close(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | ExpandSection | function | 仅发现/枚举 | `ActiveWindow.ExpandSection(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | FitToPage | function | 仅发现/枚举 | `ActiveWindow.FitToPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | GetID | function | 仅发现/枚举 | `ActiveWindow.GetID(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | GetWindowEx | function | 仅发现/枚举 | `ActiveWindow.GetWindowEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | Height | number | 仅发现/枚举 | 读取 `ActiveWindow.Height`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | IsSectionExpanded | function | 仅发现/枚举 | `ActiveWindow.IsSectionExpanded(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | LargeScroll | function | 仅发现/枚举 | `ActiveWindow.LargeScroll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | Left | number | 仅发现/枚举 | 读取 `ActiveWindow.Left`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | MainWindow | object | 仅发现/枚举 | 读取 `ActiveWindow.MainWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | NewWindow | function | 仅发现/枚举 | `ActiveWindow.NewWindow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | Panes | object | 仅发现/枚举 | 读取 `ActiveWindow.Panes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | Parent | object | 仅发现/枚举 | 读取 `ActiveWindow.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | PointsToScreenPixelsX | function | 仅发现/枚举 | `ActiveWindow.PointsToScreenPixelsX(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | PointsToScreenPixelsY | function | 仅发现/枚举 | `ActiveWindow.PointsToScreenPixelsY(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | Presentation | object | 仅发现/枚举 | 读取 `ActiveWindow.Presentation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | RangeFromPoint | function | 仅发现/枚举 | `ActiveWindow.RangeFromPoint(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | ScrollIntoView | function | 仅发现/枚举 | `ActiveWindow.ScrollIntoView(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | Selection | object | 仅发现/枚举 | 读取 `ActiveWindow.Selection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | SmallScroll | function | 仅发现/枚举 | `ActiveWindow.SmallScroll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ActiveWindow | SplitHorizontal | number | 仅发现/枚举 | 读取 `ActiveWindow.SplitHorizontal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | SplitVertical | number | 仅发现/枚举 | 读取 `ActiveWindow.SplitVertical`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | Top | number | 仅发现/枚举 | 读取 `ActiveWindow.Top`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | View | object | 仅发现/枚举 | 读取 `ActiveWindow.View`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | ViewType | number | 仅发现/枚举 | 读取 `ActiveWindow.ViewType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | Width | number | 仅发现/枚举 | 读取 `ActiveWindow.Width`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ActiveWindow | WindowState | number | 仅发现/枚举 | 读取 `ActiveWindow.WindowState`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ApiEvent | AddApiEventListener | function | 有同名显式探测；详情看宿主章节 | `ApiEvent.AddApiEventListener(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ApiEvent | Cancel | boolean | 仅发现/枚举 | 读取 `ApiEvent.Cancel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | ApiEvent | RemoveApiEventListener | function | 有同名显式探测；详情看宿主章节 | `ApiEvent.RemoveApiEventListener(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | ApiEvent | RightsInfo | number | 仅发现/枚举 | 读取 `ApiEvent.RightsInfo`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Activate | function | 有同名显式探测；详情看宿主章节 | `Application.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | ActivatePromeBrowserPage | function | 仅发现/枚举 | `Application.ActivatePromeBrowserPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | Active | number | 仅发现/枚举 | 读取 `Application.Active`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | ActiveEncryptionSession | number | 仅发现/枚举 | 读取 `Application.ActiveEncryptionSession`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | ActiveMainWindow | object | 仅发现/枚举 | 读取 `Application.ActiveMainWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | ActivePresentation | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.ActivePresentation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | ActivePrinter | string | 仅发现/枚举 | 读取 `Application.ActivePrinter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | ActiveProtectedViewWindow | object | 仅发现/枚举 | 读取 `Application.ActiveProtectedViewWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | ActiveWindow | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.ActiveWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | AddIns | object | 仅发现/枚举 | 读取 `Application.AddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | alert | function | 仅发现/枚举 | `Application.alert(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | AnswerWizard | object | 仅发现/枚举 | 读取 `Application.AnswerWizard`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | ApiEvent | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.ApiEvent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Application | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Arg2Json | function | 仅发现/枚举 | `Application.Arg2Json(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | Assistance | object | 仅发现/枚举 | 读取 `Application.Assistance`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Assistant | object | 仅发现/枚举 | 读取 `Application.Assistant`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | AutoCorrect | object | 仅发现/枚举 | 读取 `Application.AutoCorrect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | AutomationSecurity | number | 仅发现/枚举 | 读取 `Application.AutomationSecurity`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | BrowserGroups | object | 仅发现/枚举 | 读取 `Application.BrowserGroups`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Build | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Build`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Caption | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Caption`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | ChartDataPointTrack | boolean | 仅发现/枚举 | 读取 `Application.ChartDataPointTrack`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | COMAddIns | null | 有同名显式探测；详情看宿主章节 | 读取 `Application.COMAddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | CommandBars | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.CommandBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Compress | object | 仅发现/枚举 | 读取 `Application.Compress`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | confirm | function | 仅发现/枚举 | `Application.confirm(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | CreateDataBuffer | function | 仅发现/枚举 | `Application.CreateDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | CreateObject | function | 仅发现/枚举 | `Application.CreateObject(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | CreatePromeBrowserPage | function | 仅发现/枚举 | `Application.CreatePromeBrowserPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | CreatePromeFakeTab | function | 仅发现/枚举 | `Application.CreatePromeFakeTab(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | CreateTaskPane | function | 有同名显式探测；详情看宿主章节 | `Application.CreateTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | CreateWebDialog | function | 有同名显式探测；详情看宿主章节 | `Application.CreateWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | Creator | number | 仅发现/枚举 | 读取 `Application.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | CurrentWPSAddIn | object | 仅发现/枚举 | 读取 `Application.CurrentWPSAddIn`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | CustomDomain | string | 仅发现/枚举 | 读取 `Application.CustomDomain`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | DefaultWebOptions | object | 仅发现/枚举 | 读取 `Application.DefaultWebOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | DeleteDataBuffer | function | 仅发现/枚举 | `Application.DeleteDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | Dialogs | null | 仅发现/枚举 | 读取 `Application.Dialogs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | DisplayAlerts | number | 有同名显式探测；详情看宿主章节 | 读取 `Application.DisplayAlerts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | DisplayDocumentInformationPanel | boolean | 仅发现/枚举 | 读取 `Application.DisplayDocumentInformationPanel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | DisplayGridLines | number | 仅发现/枚举 | 读取 `Application.DisplayGridLines`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | DisplayGuides | number | 仅发现/枚举 | 读取 `Application.DisplayGuides`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Enum | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Enum`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Env | object | 仅发现/枚举 | 读取 `Application.Env`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | ExecFunc | function | 仅发现/枚举 | `Application.ExecFunc(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | FeatureInstall | number | 仅发现/枚举 | 读取 `Application.FeatureInstall`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | FileConverters | object | 仅发现/枚举 | 读取 `Application.FileConverters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | FileDialog | function | 有同名显式探测；详情看宿主章节 | `Application.FileDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | FileFind | object | 仅发现/枚举 | 读取 `Application.FileFind`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | FileSearch | object | 仅发现/枚举 | 读取 `Application.FileSearch`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | FileSystem | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.FileSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | FileValidation | number | 仅发现/枚举 | 读取 `Application.FileValidation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | GetApplicationEx | function | 仅发现/枚举 | `Application.GetApplicationEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | GetDataBuffer | function | 仅发现/枚举 | `Application.GetDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | GetJSReturnValue | function | 仅发现/枚举 | `Application.GetJSReturnValue(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | GetOptionFlag | function | 仅发现/枚举 | `Application.GetOptionFlag(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | GetTaskPane | function | 有同名显式探测；详情看宿主章节 | `Application.GetTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | GetWebDialog | function | 有同名显式探测；详情看宿主章节 | `Application.GetWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | Height | number | 仅发现/枚举 | 读取 `Application.Height`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Help | function | 仅发现/枚举 | `Application.Help(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | InfoCollect | object | 仅发现/枚举 | 读取 `Application.InfoCollect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | IsLastIOBroken | number | 仅发现/枚举 | 读取 `Application.IsLastIOBroken`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | IsSandboxed | boolean | 仅发现/枚举 | 读取 `Application.IsSandboxed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | JS2Variant | function | 仅发现/枚举 | `Application.JS2Variant(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | JSIDE | null | 仅发现/枚举 | 读取 `Application.JSIDE`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | LanguageSettings | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.LanguageSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | LaunchPublishSlidesDialog | function | 仅发现/枚举 | `Application.LaunchPublishSlidesDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | LaunchSendToPPTDialog | function | 仅发现/枚举 | `Application.LaunchSendToPPTDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | Left | number | 仅发现/枚举 | 读取 `Application.Left`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | MainWindows | object | 仅发现/枚举 | 读取 `Application.MainWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Marker | null | 仅发现/枚举 | 读取 `Application.Marker`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | MsoDebugOptions | object | 仅发现/枚举 | 读取 `Application.MsoDebugOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Name | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | NewEnum | object | 仅发现/枚举 | 读取 `Application.NewEnum`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | NewPresentation | object | 仅发现/枚举 | 读取 `Application.NewPresentation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | OAAssist | object | 仅发现/枚举 | 读取 `Application.OAAssist`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | OpenFileLocationInStartPage | function | 仅发现/枚举 | `Application.OpenFileLocationInStartPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | OpenThemeFile | function | 仅发现/枚举 | `Application.OpenThemeFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | OpenWebUrl | function | 仅发现/枚举 | `Application.OpenWebUrl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | OperatingSystem | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.OperatingSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Options | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Options`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Path | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Path`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | PluginStorage | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.PluginStorage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | PPFileDialog | function | 仅发现/枚举 | `Application.PPFileDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | Presentations | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Presentations`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | ProductCode | string | 仅发现/枚举 | 读取 `Application.ProductCode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | PromeAddPage | function | 仅发现/枚举 | `Application.PromeAddPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | PromeName | string | 仅发现/枚举 | 读取 `Application.PromeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | PromeNewDocument | function | 仅发现/枚举 | `Application.PromeNewDocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | PromeTidyModeChange | function | 仅发现/枚举 | `Application.PromeTidyModeChange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | prompt | function | 仅发现/枚举 | `Application.prompt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | ProtectedViewWindows | object | 仅发现/枚举 | 读取 `Application.ProtectedViewWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Quit | function | 有同名显式探测；详情看宿主章节 | `Application.Quit(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | ResampleMediaTasks | object | 仅发现/枚举 | 读取 `Application.ResampleMediaTasks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | ribbonUI | object | 仅发现/枚举 | 读取 `Application.ribbonUI`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Run | function | 有同名显式探测；详情看宿主章节 | `Application.Run(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | SetOptionFlag | function | 仅发现/枚举 | `Application.SetOptionFlag(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | SetPerfMarker | function | 仅发现/枚举 | `Application.SetPerfMarker(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | ShowDialog | function | 有同名显式探测；详情看宿主章节 | `Application.ShowDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | ShowDialogEx | function | 仅发现/枚举 | `Application.ShowDialogEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | ShowExceptionError | function | 仅发现/枚举 | `Application.ShowExceptionError(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | ShowStartupDialog | number | 仅发现/枚举 | 读取 `Application.ShowStartupDialog`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | ShowWindowsInTaskbar | number | 仅发现/枚举 | 读取 `Application.ShowWindowsInTaskbar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | SlideShowWindows | object | 仅发现/枚举 | 读取 `Application.SlideShowWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | SmartArtColors | object | 仅发现/枚举 | 读取 `Application.SmartArtColors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | SmartArtLayouts | object | 仅发现/枚举 | 读取 `Application.SmartArtLayouts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | SmartArtQuickStyles | object | 仅发现/枚举 | 读取 `Application.SmartArtQuickStyles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | StartAccess | function | 仅发现/枚举 | `Application.StartAccess(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | StartNewUndoEntry | function | 仅发现/枚举 | `Application.StartNewUndoEntry(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | TabPages | object | 仅发现/枚举 | 读取 `Application.TabPages`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | TaskPanesEx | object | 仅发现/枚举 | 读取 `Application.TaskPanesEx`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | ThisBrowser | object | 仅发现/枚举 | 读取 `Application.ThisBrowser`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Top | number | 仅发现/枚举 | 读取 `Application.Top`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | UpdateRibbon | function | 有同名显式探测；详情看宿主章节 | `Application.UpdateRibbon(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | UserName | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.UserName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Version | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Version`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Visible | number | 有同名显式探测；详情看宿主章节 | 读取 `Application.Visible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | WebJS2Variant | function | 仅发现/枚举 | `Application.WebJS2Variant(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | WebShape | null | 仅发现/枚举 | 读取 `Application.WebShape`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Width | number | 仅发现/枚举 | 读取 `Application.Width`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | Windows | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Windows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | WindowState | number | 仅发现/枚举 | 读取 `Application.WindowState`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | WppApplication | function | 有同名显式探测；详情看宿主章节 | `Application.WppApplication(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Application | WpsAccount | object | 仅发现/枚举 | 读取 `Application.WpsAccount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | WPSAddIns | object | 仅发现/枚举 | 读取 `Application.WPSAddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | WPSCloudService | object | 仅发现/枚举 | 读取 `Application.WPSCloudService`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | WpsConfig | object | 仅发现/枚举 | 读取 `Application.WpsConfig`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | WpsHttpRequests | object | 仅发现/枚举 | 读取 `Application.WpsHttpRequests`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Application | WrapCallbackArg | function | 仅发现/枚举 | `Application.WrapCallbackArg(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | absoluteFilePath | function | 仅发现/枚举 | `FileSystem.absoluteFilePath(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | absolutePath | function | 仅发现/枚举 | `FileSystem.absolutePath(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | AppendFile | function | 仅发现/枚举 | `FileSystem.AppendFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | constants | object | 仅发现/枚举 | 读取 `FileSystem.constants`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | FileSystem | copyFileSync | function | 仅发现/枚举 | `FileSystem.copyFileSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | Exists | function | 仅发现/枚举 | `FileSystem.Exists(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | existsSync | function | 仅发现/枚举 | `FileSystem.existsSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | isWritable | function | 仅发现/枚举 | `FileSystem.isWritable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | Mkdir | function | 仅发现/枚举 | `FileSystem.Mkdir(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | mkdirSync | function | 仅发现/枚举 | `FileSystem.mkdirSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | mkdtempSync | function | 仅发现/枚举 | `FileSystem.mkdtempSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | readAsBinaryString | function | 仅发现/枚举 | `FileSystem.readAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | readdirSync | function | 仅发现/枚举 | `FileSystem.readdirSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | ReadFile | function | 仅发现/枚举 | `FileSystem.ReadFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | ReadFileAsArrayBuffer | function | 仅发现/枚举 | `FileSystem.ReadFileAsArrayBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | readFileString | function | 仅发现/枚举 | `FileSystem.readFileString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | Remove | function | 仅发现/枚举 | `FileSystem.Remove(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | rmdirSync | function | 仅发现/枚举 | `FileSystem.rmdirSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | stat | function | 仅发现/枚举 | `FileSystem.stat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | tmpdir | function | 仅发现/枚举 | `FileSystem.tmpdir(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | toNativeSeparators | function | 仅发现/枚举 | `FileSystem.toNativeSeparators(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | unlinkSync | function | 仅发现/枚举 | `FileSystem.unlinkSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | writeAsBinaryString | function | 仅发现/枚举 | `FileSystem.writeAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | WriteFile | function | 仅发现/枚举 | `FileSystem.WriteFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | writeFileString | function | 仅发现/枚举 | `FileSystem.writeFileString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | FileSystem | writeSliceAsBinaryString | function | 仅发现/枚举 | `FileSystem.writeSliceAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | AcceptAll | function | 仅发现/枚举 | `Presentation.AcceptAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | ActiveWindow | object | 仅发现/枚举 | 读取 `Presentation.ActiveWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | AddBaseline | function | 仅发现/枚举 | `Presentation.AddBaseline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | AddTitleMaster | function | 仅发现/枚举 | `Presentation.AddTitleMaster(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | AddToFavorites | function | 仅发现/枚举 | `Presentation.AddToFavorites(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | Application | object | 仅发现/枚举 | 读取 `Presentation.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | ApplyTemplate | function | 仅发现/枚举 | `Presentation.ApplyTemplate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | ApplyTemplate2 | function | 仅发现/枚举 | `Presentation.ApplyTemplate2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | ApplyTheme | function | 仅发现/枚举 | `Presentation.ApplyTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | Broadcast | object | 仅发现/枚举 | 读取 `Presentation.Broadcast`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | BuiltInDocumentProperties | object | 仅发现/枚举 | 读取 `Presentation.BuiltInDocumentProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | CanCheckIn | function | 仅发现/枚举 | `Presentation.CanCheckIn(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | ChartDataPointTrack | boolean | 仅发现/枚举 | 读取 `Presentation.ChartDataPointTrack`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | CheckIn | function | 仅发现/枚举 | `Presentation.CheckIn(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | CheckInWithVersion | function | 仅发现/枚举 | `Presentation.CheckInWithVersion(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | Close | function | 仅发现/枚举 | `Presentation.Close(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | Coauthoring | object | 仅发现/枚举 | 读取 `Presentation.Coauthoring`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | ColorSchemes | object | 仅发现/枚举 | 读取 `Presentation.ColorSchemes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | CommandBars | object | 仅发现/枚举 | 读取 `Presentation.CommandBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Container | null | 仅发现/枚举 | 读取 `Presentation.Container`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | ContentTypeProperties | object | 仅发现/枚举 | 读取 `Presentation.ContentTypeProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Convert | function | 仅发现/枚举 | `Presentation.Convert(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | Convert2 | function | 仅发现/枚举 | `Presentation.Convert2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | CreateVideo | function | 仅发现/枚举 | `Presentation.CreateVideo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | CreateVideoStatus | number | 仅发现/枚举 | 读取 `Presentation.CreateVideoStatus`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | CustomDocumentProperties | object | 仅发现/枚举 | 读取 `Presentation.CustomDocumentProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | CustomerData | object | 仅发现/枚举 | 读取 `Presentation.CustomerData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | CustomXMLParts | object | 仅发现/枚举 | 读取 `Presentation.CustomXMLParts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | DefaultLanguageID | number | 仅发现/枚举 | 读取 `Presentation.DefaultLanguageID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | DefaultShape | object | 仅发现/枚举 | 读取 `Presentation.DefaultShape`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | DeleteSection | function | 仅发现/枚举 | `Presentation.DeleteSection(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | Designs | object | 仅发现/枚举 | 读取 `Presentation.Designs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | DisableSections | function | 仅发现/枚举 | `Presentation.DisableSections(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | DisplayComments | number | 仅发现/枚举 | 读取 `Presentation.DisplayComments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | DocumentInspectors | object | 仅发现/枚举 | 读取 `Presentation.DocumentInspectors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | DocumentLibraryVersions | object | 仅发现/枚举 | 读取 `Presentation.DocumentLibraryVersions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | EncryptionProvider | string | 仅发现/枚举 | 读取 `Presentation.EncryptionProvider`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | EndReview | function | 仅发现/枚举 | `Presentation.EndReview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | EnsureAllMediaUpgraded | function | 仅发现/枚举 | `Presentation.EnsureAllMediaUpgraded(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | EnvelopeVisible | number | 仅发现/枚举 | 读取 `Presentation.EnvelopeVisible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Export | function | 仅发现/枚举 | `Presentation.Export(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | ExportAsFixedFormat | function | 仅发现/枚举 | `Presentation.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | ExportAsFixedFormat2 | function | 仅发现/枚举 | `Presentation.ExportAsFixedFormat2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | ExtraColors | object | 仅发现/枚举 | 读取 `Presentation.ExtraColors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | FarEastLineBreakLanguage | number | 仅发现/枚举 | 读取 `Presentation.FarEastLineBreakLanguage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | FarEastLineBreakLevel | number | 仅发现/枚举 | 读取 `Presentation.FarEastLineBreakLevel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Final | boolean | 仅发现/枚举 | 读取 `Presentation.Final`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | FollowHyperlink | function | 仅发现/枚举 | `Presentation.FollowHyperlink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | Fonts | object | 仅发现/枚举 | 读取 `Presentation.Fonts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | FullName | string | 仅发现/枚举 | 读取 `Presentation.FullName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | GetPresentationEx | function | 仅发现/枚举 | `Presentation.GetPresentationEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | GetWorkflowTasks | function | 仅发现/枚举 | `Presentation.GetWorkflowTasks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | GetWorkflowTemplates | function | 仅发现/枚举 | `Presentation.GetWorkflowTemplates(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | GridDistance | number | 仅发现/枚举 | 读取 `Presentation.GridDistance`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Guides | object | 仅发现/枚举 | 读取 `Presentation.Guides`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | HandoutMaster | object | 仅发现/枚举 | 读取 `Presentation.HandoutMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | HasHandoutMaster | boolean | 仅发现/枚举 | 读取 `Presentation.HasHandoutMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | HasNotesMaster | boolean | 仅发现/枚举 | 读取 `Presentation.HasNotesMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | HasRevisionInfo | number | 仅发现/枚举 | 读取 `Presentation.HasRevisionInfo`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | HasSections | boolean | 仅发现/枚举 | 读取 `Presentation.HasSections`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | HasTitleMaster | number | 仅发现/枚举 | 读取 `Presentation.HasTitleMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | HasVBProject | boolean | 仅发现/枚举 | 读取 `Presentation.HasVBProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | HTMLProject | object | 仅发现/枚举 | 读取 `Presentation.HTMLProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | InMergeMode | boolean | 仅发现/枚举 | 读取 `Presentation.InMergeMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | InvalidateRightsInfo | function | 仅发现/枚举 | `Presentation.InvalidateRightsInfo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | JSProject | null | 仅发现/枚举 | 读取 `Presentation.JSProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | LayoutDirection | number | 仅发现/枚举 | 读取 `Presentation.LayoutDirection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | LockServerFile | function | 仅发现/枚举 | `Presentation.LockServerFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | MakeIntoTemplate | function | 仅发现/枚举 | `Presentation.MakeIntoTemplate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | Merge | function | 仅发现/枚举 | `Presentation.Merge(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | MergeWithBaseline | function | 仅发现/枚举 | `Presentation.MergeWithBaseline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | Name | string | 仅发现/枚举 | 读取 `Presentation.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | NewWindow | function | 仅发现/枚举 | `Presentation.NewWindow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | NoLineBreakAfter | string | 仅发现/枚举 | 读取 `Presentation.NoLineBreakAfter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | NoLineBreakBefore | string | 仅发现/枚举 | 读取 `Presentation.NoLineBreakBefore`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | NotesMaster | object | 仅发现/枚举 | 读取 `Presentation.NotesMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | PageSetup | object | 仅发现/枚举 | 读取 `Presentation.PageSetup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Parent | object | 仅发现/枚举 | 读取 `Presentation.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Password | string | 仅发现/枚举 | 读取 `Presentation.Password`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | PasswordEncryptionAlgorithm | string | 仅发现/枚举 | 读取 `Presentation.PasswordEncryptionAlgorithm`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | PasswordEncryptionFileProperties | boolean | 仅发现/枚举 | 读取 `Presentation.PasswordEncryptionFileProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | PasswordEncryptionKeyLength | number | 仅发现/枚举 | 读取 `Presentation.PasswordEncryptionKeyLength`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | PasswordEncryptionProvider | string | 仅发现/枚举 | 读取 `Presentation.PasswordEncryptionProvider`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Path | string | 仅发现/枚举 | 读取 `Presentation.Path`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Permission | object | 仅发现/枚举 | 读取 `Presentation.Permission`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | PrintOptions | object | 仅发现/枚举 | 读取 `Presentation.PrintOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | PrintOut | function | 仅发现/枚举 | `Presentation.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | PublishObjects | object | 仅发现/枚举 | 读取 `Presentation.PublishObjects`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | PublishSlides | function | 仅发现/枚举 | `Presentation.PublishSlides(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | ReadOnly | number | 仅发现/枚举 | 读取 `Presentation.ReadOnly`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | RejectAll | function | 仅发现/枚举 | `Presentation.RejectAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | ReloadAs | function | 仅发现/枚举 | `Presentation.ReloadAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | RemoveBaseline | function | 仅发现/枚举 | `Presentation.RemoveBaseline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | RemoveDocumentInformation | function | 仅发现/枚举 | `Presentation.RemoveDocumentInformation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | RemovePersonalInformation | number | 仅发现/枚举 | 读取 `Presentation.RemovePersonalInformation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | ReplyWithChanges | function | 仅发现/枚举 | `Presentation.ReplyWithChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | Research | object | 仅发现/枚举 | 读取 `Presentation.Research`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Save | function | 仅发现/枚举 | `Presentation.Save(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | SaveAs | function | 仅发现/枚举 | `Presentation.SaveAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | SaveAsBinaryString | function | 仅发现/枚举 | `Presentation.SaveAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | SaveAsUrl | function | 仅发现/枚举 | `Presentation.SaveAsUrl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | SaveCopyAs | function | 仅发现/枚举 | `Presentation.SaveCopyAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | Saved | number | 仅发现/枚举 | 读取 `Presentation.Saved`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | sblt | function | 仅发现/枚举 | `Presentation.sblt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | SectionCount | number | 仅发现/枚举 | 读取 `Presentation.SectionCount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | SectionProperties | object | 仅发现/枚举 | 读取 `Presentation.SectionProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | sectionTitle | function | 仅发现/枚举 | `Presentation.sectionTitle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | SendFaxOverInternet | function | 仅发现/枚举 | `Presentation.SendFaxOverInternet(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | SendForReview | function | 仅发现/枚举 | `Presentation.SendForReview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | ServerPolicy | object | 仅发现/枚举 | 读取 `Presentation.ServerPolicy`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | SetPasswordEncryptionOptions | function | 仅发现/枚举 | `Presentation.SetPasswordEncryptionOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | SetUndoText | function | 仅发现/枚举 | `Presentation.SetUndoText(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | SharedWorkspace | object | 仅发现/枚举 | 读取 `Presentation.SharedWorkspace`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Signatures | object | 仅发现/枚举 | 读取 `Presentation.Signatures`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | SlideMaster | object | 仅发现/枚举 | 读取 `Presentation.SlideMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Slides | object | 仅发现/枚举 | 读取 `Presentation.Slides`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | SlideShowSettings | object | 仅发现/枚举 | 读取 `Presentation.SlideShowSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | SlideShowWindow | null | 仅发现/枚举 | 读取 `Presentation.SlideShowWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | SnapToGrid | number | 仅发现/枚举 | 读取 `Presentation.SnapToGrid`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Sync | object | 仅发现/枚举 | 读取 `Presentation.Sync`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | Tags | object | 仅发现/枚举 | 读取 `Presentation.Tags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | TemplateName | string | 仅发现/枚举 | 读取 `Presentation.TemplateName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | TitleMaster | object | 仅发现/枚举 | 读取 `Presentation.TitleMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | UpdateLinks | function | 仅发现/枚举 | `Presentation.UpdateLinks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | VBASigned | number | 仅发现/枚举 | 读取 `Presentation.VBASigned`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | WebOptions | object | 仅发现/枚举 | 读取 `Presentation.WebOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | WebPagePreview | function | 仅发现/枚举 | `Presentation.WebPagePreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Presentation | Windows | object | 仅发现/枚举 | 读取 `Presentation.Windows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Presentation | WritePassword | string | 仅发现/枚举 | 读取 `Presentation.WritePassword`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Selection | Application | object | 仅发现/枚举 | 读取 `Selection.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Selection | ChildShapeRange | null | 仅发现/枚举 | 读取 `Selection.ChildShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Selection | Copy | function | 仅发现/枚举 | `Selection.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Selection | Cut | function | 仅发现/枚举 | `Selection.Cut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Selection | Delete | function | 仅发现/枚举 | `Selection.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Selection | HasChildShapeRange | null | 仅发现/枚举 | 读取 `Selection.HasChildShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Selection | Parent | object | 仅发现/枚举 | 读取 `Selection.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Selection | ShapeRange | null | 仅发现/枚举 | 读取 `Selection.ShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Selection | SlideRange | object | 仅发现/枚举 | 读取 `Selection.SlideRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Selection | TextRange | null | 仅发现/枚举 | 读取 `Selection.TextRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Selection | TextRange2 | object | 仅发现/枚举 | 读取 `Selection.TextRange2`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Selection | Type | number | 仅发现/枚举 | 读取 `Selection.Type`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Selection | Unselect | function | 仅发现/枚举 | `Selection.Unselect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | ActionSettings | object | 仅发现/枚举 | 读取 `Shape.ActionSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Adjustments | object | 仅发现/枚举 | 读取 `Shape.Adjustments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | AlternativeText | string | 仅发现/枚举 | 读取 `Shape.AlternativeText`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | AnimationSettings | object | 仅发现/枚举 | 读取 `Shape.AnimationSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Application | object | 仅发现/枚举 | 读取 `Shape.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Apply | function | 仅发现/枚举 | `Shape.Apply(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | ApplyAnimation | function | 仅发现/枚举 | `Shape.ApplyAnimation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | AutoShapeType | number | 仅发现/枚举 | 读取 `Shape.AutoShapeType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | BackgroundStyle | number | 仅发现/枚举 | 读取 `Shape.BackgroundStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | BlackWhiteMode | number | 仅发现/枚举 | 读取 `Shape.BlackWhiteMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Callout | object | 仅发现/枚举 | 读取 `Shape.Callout`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | CanvasCropBottom | function | 仅发现/枚举 | `Shape.CanvasCropBottom(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | CanvasCropLeft | function | 仅发现/枚举 | `Shape.CanvasCropLeft(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | CanvasCropRight | function | 仅发现/枚举 | `Shape.CanvasCropRight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | CanvasCropTop | function | 仅发现/枚举 | `Shape.CanvasCropTop(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | CanvasItems | object | 仅发现/枚举 | 读取 `Shape.CanvasItems`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Chart | null | 仅发现/枚举 | 读取 `Shape.Chart`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Child | number | 仅发现/枚举 | 读取 `Shape.Child`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | ConnectionSiteCount | number | 仅发现/枚举 | 读取 `Shape.ConnectionSiteCount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Connector | number | 仅发现/枚举 | 读取 `Shape.Connector`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | ConnectorFormat | null | 仅发现/枚举 | 读取 `Shape.ConnectorFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | ConvertTextToSmartArt | function | 仅发现/枚举 | `Shape.ConvertTextToSmartArt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | Copy | function | 仅发现/枚举 | `Shape.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | Creator | number | 仅发现/枚举 | 读取 `Shape.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | CustomerData | object | 仅发现/枚举 | 读取 `Shape.CustomerData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Cut | function | 仅发现/枚举 | `Shape.Cut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | Delete | function | 仅发现/枚举 | `Shape.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | Diagram | object | 仅发现/枚举 | 读取 `Shape.Diagram`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | DiagramNode | object | 仅发现/枚举 | 读取 `Shape.DiagramNode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Duplicate | function | 有同名显式探测；详情看宿主章节 | `Shape.Duplicate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | Export | function | 仅发现/枚举 | `Shape.Export(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | Fill | object | 仅发现/枚举 | 读取 `Shape.Fill`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Flip | function | 仅发现/枚举 | `Shape.Flip(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | Glow | object | 仅发现/枚举 | 读取 `Shape.Glow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | GroupItems | null | 仅发现/枚举 | 读取 `Shape.GroupItems`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | HasChart | number | 仅发现/枚举 | 读取 `Shape.HasChart`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | HasDiagram | number | 仅发现/枚举 | 读取 `Shape.HasDiagram`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | HasDiagramNode | number | 仅发现/枚举 | 读取 `Shape.HasDiagramNode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | HasSmartArt | number | 仅发现/枚举 | 读取 `Shape.HasSmartArt`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | HasTable | number | 仅发现/枚举 | 读取 `Shape.HasTable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | HasTextFrame | number | 仅发现/枚举 | 读取 `Shape.HasTextFrame`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | HasWebShape | number | 仅发现/枚举 | 读取 `Shape.HasWebShape`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Height | number | 仅发现/枚举 | 读取 `Shape.Height`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | HorizontalFlip | number | 仅发现/枚举 | 读取 `Shape.HorizontalFlip`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Id | number | 仅发现/枚举 | 读取 `Shape.Id`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | IdentificationText | null | 仅发现/枚举 | 读取 `Shape.IdentificationText`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | IncrementLeft | function | 仅发现/枚举 | `Shape.IncrementLeft(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | IncrementRotation | function | 仅发现/枚举 | `Shape.IncrementRotation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | IncrementTop | function | 仅发现/枚举 | `Shape.IncrementTop(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | Left | number | 仅发现/枚举 | 读取 `Shape.Left`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Line | object | 仅发现/枚举 | 读取 `Shape.Line`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | LinkFormat | object | 仅发现/枚举 | 读取 `Shape.LinkFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | LockAspectRatio | number | 仅发现/枚举 | 读取 `Shape.LockAspectRatio`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | MediaFormat | object | 仅发现/枚举 | 读取 `Shape.MediaFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | MediaType | null | 仅发现/枚举 | 读取 `Shape.MediaType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Name | string | 仅发现/枚举 | 读取 `Shape.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Nodes | object | 仅发现/枚举 | 读取 `Shape.Nodes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | OLEFormat | object | 仅发现/枚举 | 读取 `Shape.OLEFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Parent | object | 仅发现/枚举 | 读取 `Shape.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | ParentGroup | object | 仅发现/枚举 | 读取 `Shape.ParentGroup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | PickUp | function | 仅发现/枚举 | `Shape.PickUp(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | PickupAnimation | function | 仅发现/枚举 | `Shape.PickupAnimation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | PictureFormat | null | 仅发现/枚举 | 读取 `Shape.PictureFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | PlaceholderFormat | object | 仅发现/枚举 | 读取 `Shape.PlaceholderFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Reflection | object | 仅发现/枚举 | 读取 `Shape.Reflection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | RerouteConnections | function | 仅发现/枚举 | `Shape.RerouteConnections(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | Rotation | number | 仅发现/枚举 | 读取 `Shape.Rotation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | RTF | null | 仅发现/枚举 | 读取 `Shape.RTF`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | SaveAsPicture | function | 仅发现/枚举 | `Shape.SaveAsPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | ScaleHeight | function | 仅发现/枚举 | `Shape.ScaleHeight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | ScaleWidth | function | 仅发现/枚举 | `Shape.ScaleWidth(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | Script | object | 仅发现/枚举 | 读取 `Shape.Script`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Select | function | 仅发现/枚举 | `Shape.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | SetShapesDefaultProperties | function | 仅发现/枚举 | `Shape.SetShapesDefaultProperties(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | Shadow | object | 仅发现/枚举 | 读取 `Shape.Shadow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | ShapeStyle | number | 仅发现/枚举 | 读取 `Shape.ShapeStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | SmartArt | null | 仅发现/枚举 | 读取 `Shape.SmartArt`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | SoftEdge | object | 仅发现/枚举 | 读取 `Shape.SoftEdge`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | SoundFormat | object | 仅发现/枚举 | 读取 `Shape.SoundFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Table | null | 仅发现/枚举 | 读取 `Shape.Table`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Tags | object | 仅发现/枚举 | 读取 `Shape.Tags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | TextEffect | object | 仅发现/枚举 | 读取 `Shape.TextEffect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | TextFrame | object | 仅发现/枚举 | 读取 `Shape.TextFrame`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | TextFrame2 | object | 仅发现/枚举 | 读取 `Shape.TextFrame2`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | ThreeD | object | 仅发现/枚举 | 读取 `Shape.ThreeD`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Title | string | 仅发现/枚举 | 读取 `Shape.Title`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Top | number | 仅发现/枚举 | 读取 `Shape.Top`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Type | number | 仅发现/枚举 | 读取 `Shape.Type`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Ungroup | function | 仅发现/枚举 | `Shape.Ungroup(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | UpgradeMedia | function | 仅发现/枚举 | `Shape.UpgradeMedia(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | VerticalFlip | number | 仅发现/枚举 | 读取 `Shape.VerticalFlip`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Vertices | null | 仅发现/枚举 | 读取 `Shape.Vertices`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Visible | number | 仅发现/枚举 | 读取 `Shape.Visible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | WebShape | object | 仅发现/枚举 | 读取 `Shape.WebShape`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | Width | number | 仅发现/枚举 | 读取 `Shape.Width`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shape | ZOrder | function | 仅发现/枚举 | `Shape.ZOrder(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shape | ZOrderPosition | number | 仅发现/枚举 | 读取 `Shape.ZOrderPosition`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shapes | AddCallout | function | 仅发现/枚举 | `Shapes.AddCallout(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddCanvas | function | 仅发现/枚举 | `Shapes.AddCanvas(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddChart | function | 仅发现/枚举 | `Shapes.AddChart(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddChart2 | function | 仅发现/枚举 | `Shapes.AddChart2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddComment | function | 仅发现/枚举 | `Shapes.AddComment(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddConnector | function | 仅发现/枚举 | `Shapes.AddConnector(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddCurve | function | 仅发现/枚举 | `Shapes.AddCurve(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddDiagram | function | 仅发现/枚举 | `Shapes.AddDiagram(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddLabel | function | 仅发现/枚举 | `Shapes.AddLabel(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddLine | function | 仅发现/枚举 | `Shapes.AddLine(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddMath | function | 仅发现/枚举 | `Shapes.AddMath(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddMediaObject | function | 仅发现/枚举 | `Shapes.AddMediaObject(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddMediaObject2 | function | 仅发现/枚举 | `Shapes.AddMediaObject2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddMediaObjectFromEmbedTag | function | 仅发现/枚举 | `Shapes.AddMediaObjectFromEmbedTag(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddOLEObject | function | 仅发现/枚举 | `Shapes.AddOLEObject(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddPicture | function | 仅发现/枚举 | `Shapes.AddPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddPicture2 | function | 仅发现/枚举 | `Shapes.AddPicture2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddPlaceholder | function | 仅发现/枚举 | `Shapes.AddPlaceholder(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddPolyline | function | 仅发现/枚举 | `Shapes.AddPolyline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddShape | function | 仅发现/枚举 | `Shapes.AddShape(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddSmartArt | function | 仅发现/枚举 | `Shapes.AddSmartArt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddTable | function | 有同名显式探测；详情看宿主章节 | `Shapes.AddTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddTextbox | function | 有同名显式探测；详情看宿主章节 | `Shapes.AddTextbox(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddTextEffect | function | 仅发现/枚举 | `Shapes.AddTextEffect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddTitle | function | 仅发现/枚举 | `Shapes.AddTitle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddWebShape | function | 仅发现/枚举 | `Shapes.AddWebShape(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | AddWebShapeEx | function | 仅发现/枚举 | `Shapes.AddWebShapeEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | Application | object | 仅发现/枚举 | 读取 `Shapes.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shapes | BuildFreeform | function | 仅发现/枚举 | `Shapes.BuildFreeform(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | Count | number | 仅发现/枚举 | 读取 `Shapes.Count`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shapes | Creator | number | 仅发现/枚举 | 读取 `Shapes.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shapes | HasTitle | number | 仅发现/枚举 | 读取 `Shapes.HasTitle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shapes | Item | function | 仅发现/枚举 | `Shapes.Item(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | Parent | object | 仅发现/枚举 | 读取 `Shapes.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shapes | Paste | function | 仅发现/枚举 | `Shapes.Paste(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | PasteSpecial | function | 仅发现/枚举 | `Shapes.PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | Placeholders | object | 仅发现/枚举 | 读取 `Shapes.Placeholders`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Shapes | Range | function | 仅发现/枚举 | `Shapes.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | SelectAll | function | 仅发现/枚举 | `Shapes.SelectAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Shapes | Title | null | 仅发现/枚举 | 读取 `Shapes.Title`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | Application | object | 仅发现/枚举 | 读取 `Slide.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | ApplyTemplate | function | 仅发现/枚举 | `Slide.ApplyTemplate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | ApplyTemplate2 | function | 仅发现/枚举 | `Slide.ApplyTemplate2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | ApplyTheme | function | 仅发现/枚举 | `Slide.ApplyTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | ApplyThemeColorScheme | function | 仅发现/枚举 | `Slide.ApplyThemeColorScheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | Background | object | 仅发现/枚举 | 读取 `Slide.Background`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | BackgroundStyle | number | 仅发现/枚举 | 读取 `Slide.BackgroundStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | ColorScheme | object | 仅发现/枚举 | 读取 `Slide.ColorScheme`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | Comments | null | 仅发现/枚举 | 读取 `Slide.Comments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | Copy | function | 仅发现/枚举 | `Slide.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | CopyFormatPainter | function | 仅发现/枚举 | `Slide.CopyFormatPainter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | CustomerData | object | 仅发现/枚举 | 读取 `Slide.CustomerData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | CustomLayout | object | 仅发现/枚举 | 读取 `Slide.CustomLayout`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | Cut | function | 仅发现/枚举 | `Slide.Cut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | Delete | function | 仅发现/枚举 | `Slide.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | Design | object | 仅发现/枚举 | 读取 `Slide.Design`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | DisplayMasterShapes | number | 仅发现/枚举 | 读取 `Slide.DisplayMasterShapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | Duplicate | function | 仅发现/枚举 | `Slide.Duplicate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | Export | function | 仅发现/枚举 | `Slide.Export(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | FollowMasterBackground | number | 仅发现/枚举 | 读取 `Slide.FollowMasterBackground`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | HasNotesPage | number | 仅发现/枚举 | 读取 `Slide.HasNotesPage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | HeadersFooters | object | 仅发现/枚举 | 读取 `Slide.HeadersFooters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | Hyperlinks | object | 仅发现/枚举 | 读取 `Slide.Hyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | Layout | number | 仅发现/枚举 | 读取 `Slide.Layout`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | Master | object | 仅发现/枚举 | 读取 `Slide.Master`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | MoveTo | function | 仅发现/枚举 | `Slide.MoveTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | MoveToSectionStart | function | 仅发现/枚举 | `Slide.MoveToSectionStart(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | Name | string | 仅发现/枚举 | 读取 `Slide.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | NotesPage | object | 仅发现/枚举 | 读取 `Slide.NotesPage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | Parent | object | 仅发现/枚举 | 读取 `Slide.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | PasteFormatPainter | function | 仅发现/枚举 | `Slide.PasteFormatPainter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | PrintSteps | number | 仅发现/枚举 | 读取 `Slide.PrintSteps`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | PublishSlides | function | 仅发现/枚举 | `Slide.PublishSlides(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | Scripts | object | 仅发现/枚举 | 读取 `Slide.Scripts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | sectionIndex | number | 仅发现/枚举 | 读取 `Slide.sectionIndex`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | SectionNumber | number | 仅发现/枚举 | 读取 `Slide.SectionNumber`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | Select | function | 仅发现/枚举 | `Slide.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slide | Shapes | object | 仅发现/枚举 | 读取 `Slide.Shapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | SlideID | number | 仅发现/枚举 | 读取 `Slide.SlideID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | SlideIndex | number | 仅发现/枚举 | 读取 `Slide.SlideIndex`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | SlideNumber | number | 仅发现/枚举 | 读取 `Slide.SlideNumber`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | SlideShowTransition | object | 仅发现/枚举 | 读取 `Slide.SlideShowTransition`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | Tags | object | 仅发现/枚举 | 读取 `Slide.Tags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | ThemeColorScheme | object | 仅发现/枚举 | 读取 `Slide.ThemeColorScheme`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slide | TimeLine | object | 仅发现/枚举 | 读取 `Slide.TimeLine`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slides | Add | function | 仅发现/枚举 | `Slides.Add(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slides | AddSlide | function | 仅发现/枚举 | `Slides.AddSlide(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slides | Application | object | 仅发现/枚举 | 读取 `Slides.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slides | Count | number | 仅发现/枚举 | 读取 `Slides.Count`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slides | FindBySlideID | function | 仅发现/枚举 | `Slides.FindBySlideID(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slides | InsertFromFile | function | 仅发现/枚举 | `Slides.InsertFromFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slides | Item | function | 仅发现/枚举 | `Slides.Item(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slides | Parent | object | 仅发现/枚举 | 读取 `Slides.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentation / WPP | Slides | Paste | function | 仅发现/枚举 | `Slides.Paste(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation / WPP | Slides | Range | function | 仅发现/枚举 | `Slides.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | ApiEvent | AddApiEventListener | function | 有同名显式探测；详情看宿主章节 | `ApiEvent.AddApiEventListener(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | ApiEvent | Cancel | boolean | 仅发现/枚举 | 读取 `ApiEvent.Cancel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | ApiEvent | RemoveApiEventListener | function | 有同名显式探测；详情看宿主章节 | `ApiEvent.RemoveApiEventListener(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | ApiEvent | RightsInfo | number | 仅发现/枚举 | 读取 `ApiEvent.RightsInfo`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | _Default | string | 仅发现/枚举 | 读取 `Application._Default`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | _Evaluate | function | 仅发现/枚举 | `Application._Evaluate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | _FindFile | function | 仅发现/枚举 | `Application._FindFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | _MacroOptions | function | 仅发现/枚举 | `Application._MacroOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | _Run2 | function | 仅发现/枚举 | `Application._Run2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | _Wait | function | 仅发现/枚举 | `Application._Wait(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | _WSFunction | function | 仅发现/枚举 | `Application._WSFunction(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ActivateMicrosoftApp | function | 仅发现/枚举 | `Application.ActivateMicrosoftApp(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ActivatePromeBrowserPage | function | 仅发现/枚举 | `Application.ActivatePromeBrowserPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ActiveCell | object | 仅发现/枚举 | 读取 `Application.ActiveCell`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ActiveChart | null | 仅发现/枚举 | 读取 `Application.ActiveChart`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ActiveDialog | object | 仅发现/枚举 | 读取 `Application.ActiveDialog`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ActiveEncryptionSession | number | 仅发现/枚举 | 读取 `Application.ActiveEncryptionSession`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ActiveMainWindow | object | 仅发现/枚举 | 读取 `Application.ActiveMainWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ActiveMenuBar | object | 仅发现/枚举 | 读取 `Application.ActiveMenuBar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ActivePrinter | string | 仅发现/枚举 | 读取 `Application.ActivePrinter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ActiveProtectedViewWindow | null | 仅发现/枚举 | 读取 `Application.ActiveProtectedViewWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ActiveSheet | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.ActiveSheet`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ActiveWindow | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.ActiveWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ActiveWorkbook | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.ActiveWorkbook`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | AddChartAutoFormat | function | 仅发现/枚举 | `Application.AddChartAutoFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | AddCustomFunction | function | 有同名显式探测；详情看宿主章节 | `Application.AddCustomFunction(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | AddCustomList | function | 仅发现/枚举 | `Application.AddCustomList(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | AddIns | object | 仅发现/枚举 | 读取 `Application.AddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | AddIns2 | object | 仅发现/枚举 | 读取 `Application.AddIns2`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | alert | function | 仅发现/枚举 | `Application.alert(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | AlertBeforeOverwriting | boolean | 仅发现/枚举 | 读取 `Application.AlertBeforeOverwriting`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | AltStartupPath | string | 仅发现/枚举 | 读取 `Application.AltStartupPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | AlwaysUseClearType | boolean | 仅发现/枚举 | 读取 `Application.AlwaysUseClearType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | AnswerWizard | object | 仅发现/枚举 | 读取 `Application.AnswerWizard`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ApiEvent | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.ApiEvent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Application | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ArbitraryXMLSupportAvailable | boolean | 仅发现/枚举 | 读取 `Application.ArbitraryXMLSupportAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Arg2Json | function | 仅发现/枚举 | `Application.Arg2Json(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | AskToUpdateLinks | boolean | 仅发现/枚举 | 读取 `Application.AskToUpdateLinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Assistance | object | 仅发现/枚举 | 读取 `Application.Assistance`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Assistant | object | 仅发现/枚举 | 读取 `Application.Assistant`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | AutoCorrect | object | 仅发现/枚举 | 读取 `Application.AutoCorrect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | AutoFormatAsYouTypeReplaceHyperlinks | boolean | 仅发现/枚举 | 读取 `Application.AutoFormatAsYouTypeReplaceHyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | AutomationSecurity | number | 仅发现/枚举 | 读取 `Application.AutomationSecurity`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | AutoPercentEntry | boolean | 仅发现/枚举 | 读取 `Application.AutoPercentEntry`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | AutoRecover | object | 仅发现/枚举 | 读取 `Application.AutoRecover`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | BrowserGroups | object | 仅发现/枚举 | 读取 `Application.BrowserGroups`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Build | number | 有同名显式探测；详情看宿主章节 | 读取 `Application.Build`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Calculate | function | 有同名显式探测；详情看宿主章节 | `Application.Calculate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | CalculateBeforeSave | boolean | 仅发现/枚举 | 读取 `Application.CalculateBeforeSave`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CalculateFull | function | 有同名显式探测；详情看宿主章节 | `Application.CalculateFull(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | CalculateFullRebuild | function | 仅发现/枚举 | `Application.CalculateFullRebuild(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | CalculateUntilAsyncQueriesDone | function | 仅发现/枚举 | `Application.CalculateUntilAsyncQueriesDone(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Calculation | number | 仅发现/枚举 | 读取 `Application.Calculation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CalculationInterruptKey | number | 仅发现/枚举 | 读取 `Application.CalculationInterruptKey`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CalculationState | number | 仅发现/枚举 | 读取 `Application.CalculationState`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CalculationVersion | number | 仅发现/枚举 | 读取 `Application.CalculationVersion`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Caller | function | 仅发现/枚举 | `Application.Caller(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | CanPlaySounds | boolean | 仅发现/枚举 | 读取 `Application.CanPlaySounds`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CanRecordSounds | boolean | 仅发现/枚举 | 读取 `Application.CanRecordSounds`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Caption | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Caption`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CellDragAndDrop | boolean | 仅发现/枚举 | 读取 `Application.CellDragAndDrop`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Cells | object | 仅发现/枚举 | 读取 `Application.Cells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CentimetersToPoints | function | 仅发现/枚举 | `Application.CentimetersToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ChartDataPointTrack | boolean | 仅发现/枚举 | 读取 `Application.ChartDataPointTrack`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Charts | object | 仅发现/枚举 | 读取 `Application.Charts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CheckAbort | function | 仅发现/枚举 | `Application.CheckAbort(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | CheckSpelling | function | 仅发现/枚举 | `Application.CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ClipboardFormats | function | 仅发现/枚举 | `Application.ClipboardFormats(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ClusterConnector | string | 仅发现/枚举 | 读取 `Application.ClusterConnector`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ColorButtons | boolean | 仅发现/枚举 | 读取 `Application.ColorButtons`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Columns | object | 仅发现/枚举 | 读取 `Application.Columns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | COMAddIns | null | 有同名显式探测；详情看宿主章节 | 读取 `Application.COMAddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CommandBars | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.CommandBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CommandUnderlines | number | 仅发现/枚举 | 读取 `Application.CommandUnderlines`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Compress | object | 仅发现/枚举 | 读取 `Application.Compress`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | confirm | function | 仅发现/枚举 | `Application.confirm(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ConstrainNumeric | boolean | 仅发现/枚举 | 读取 `Application.ConstrainNumeric`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ControlCharacters | boolean | 仅发现/枚举 | 读取 `Application.ControlCharacters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ConvertFormula | function | 仅发现/枚举 | `Application.ConvertFormula(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | CopyObjectsWithCells | boolean | 仅发现/枚举 | 读取 `Application.CopyObjectsWithCells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CreateDataBuffer | function | 仅发现/枚举 | `Application.CreateDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | CreateObject | function | 仅发现/枚举 | `Application.CreateObject(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | CreatePromeBrowserPage | function | 仅发现/枚举 | `Application.CreatePromeBrowserPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | CreatePromeFakeTab | function | 仅发现/枚举 | `Application.CreatePromeFakeTab(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | CreateTaskPane | function | 有同名显式探测；详情看宿主章节 | `Application.CreateTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | CreateWebDialog | function | 有同名显式探测；详情看宿主章节 | `Application.CreateWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Creator | number | 仅发现/枚举 | 读取 `Application.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CurrentWPSAddIn | object | 仅发现/枚举 | 读取 `Application.CurrentWPSAddIn`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Cursor | number | 仅发现/枚举 | 读取 `Application.Cursor`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CursorMovement | number | 仅发现/枚举 | 读取 `Application.CursorMovement`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CustomDomain | string | 仅发现/枚举 | 读取 `Application.CustomDomain`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CustomListCount | number | 仅发现/枚举 | 读取 `Application.CustomListCount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | CutCopyMode | number | 仅发现/枚举 | 读取 `Application.CutCopyMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DataEntryMode | number | 仅发现/枚举 | 读取 `Application.DataEntryMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DDEAppReturnCode | number | 仅发现/枚举 | 读取 `Application.DDEAppReturnCode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DDEExecute | function | 仅发现/枚举 | `Application.DDEExecute(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | DDEInitiate | function | 仅发现/枚举 | `Application.DDEInitiate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | DDEPoke | function | 仅发现/枚举 | `Application.DDEPoke(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | DDERequest | function | 仅发现/枚举 | `Application.DDERequest(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | DDETerminate | function | 仅发现/枚举 | `Application.DDETerminate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | DebugTools | object | 仅发现/枚举 | 读取 `Application.DebugTools`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DecimalSeparator | string | 仅发现/枚举 | 读取 `Application.DecimalSeparator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DefaultFilePath | string | 仅发现/枚举 | 读取 `Application.DefaultFilePath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DefaultSaveFormat | number | 仅发现/枚举 | 读取 `Application.DefaultSaveFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DefaultSheetDirection | number | 仅发现/枚举 | 读取 `Application.DefaultSheetDirection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DefaultWebOptions | object | 仅发现/枚举 | 读取 `Application.DefaultWebOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DeferAsyncQueries | boolean | 仅发现/枚举 | 读取 `Application.DeferAsyncQueries`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DeleteChartAutoFormat | function | 仅发现/枚举 | `Application.DeleteChartAutoFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | DeleteCustomList | function | 仅发现/枚举 | `Application.DeleteCustomList(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | DeleteDataBuffer | function | 仅发现/枚举 | `Application.DeleteDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dialogs | object | 仅发现/枚举 | 读取 `Application.Dialogs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DialogSheets | object | 仅发现/枚举 | 读取 `Application.DialogSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayAlerts | boolean | 有同名显式探测；详情看宿主章节 | 读取 `Application.DisplayAlerts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayClipboardWindow | boolean | 仅发现/枚举 | 读取 `Application.DisplayClipboardWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayCommentIndicator | number | 仅发现/枚举 | 读取 `Application.DisplayCommentIndicator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayDocumentActionTaskPane | boolean | 仅发现/枚举 | 读取 `Application.DisplayDocumentActionTaskPane`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayDocumentInformationPanel | boolean | 仅发现/枚举 | 读取 `Application.DisplayDocumentInformationPanel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayExcel4Menus | boolean | 仅发现/枚举 | 读取 `Application.DisplayExcel4Menus`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayFormulaAutoComplete | boolean | 仅发现/枚举 | 读取 `Application.DisplayFormulaAutoComplete`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayFormulaBar | boolean | 仅发现/枚举 | 读取 `Application.DisplayFormulaBar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayFullScreen | boolean | 仅发现/枚举 | 读取 `Application.DisplayFullScreen`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayFunctionToolTips | boolean | 仅发现/枚举 | 读取 `Application.DisplayFunctionToolTips`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayInfoWindow | boolean | 仅发现/枚举 | 读取 `Application.DisplayInfoWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayInsertOptions | boolean | 仅发现/枚举 | 读取 `Application.DisplayInsertOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayNoteIndicator | boolean | 仅发现/枚举 | 读取 `Application.DisplayNoteIndicator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayPasteOptions | boolean | 仅发现/枚举 | 读取 `Application.DisplayPasteOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayRecentFiles | boolean | 仅发现/枚举 | 读取 `Application.DisplayRecentFiles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayScrollBars | boolean | 仅发现/枚举 | 读取 `Application.DisplayScrollBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayStatusBar | boolean | 仅发现/枚举 | 读取 `Application.DisplayStatusBar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | DisplayXMLSourcePane | function | 仅发现/枚举 | `Application.DisplayXMLSourcePane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | DoubleClick | function | 仅发现/枚举 | `Application.DoubleClick(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy1 | function | 仅发现/枚举 | `Application.Dummy1(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy10 | function | 仅发现/枚举 | `Application.Dummy10(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy101 | null | 仅发现/枚举 | 读取 `Application.Dummy101`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Dummy11 | function | 仅发现/枚举 | `Application.Dummy11(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy12 | function | 仅发现/枚举 | `Application.Dummy12(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy13 | function | 仅发现/枚举 | `Application.Dummy13(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy14 | function | 仅发现/枚举 | `Application.Dummy14(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy2 | function | 仅发现/枚举 | `Application.Dummy2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy20 | function | 仅发现/枚举 | `Application.Dummy20(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy22 | boolean | 仅发现/枚举 | 读取 `Application.Dummy22`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Dummy23 | boolean | 仅发现/枚举 | 读取 `Application.Dummy23`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Dummy3 | function | 仅发现/枚举 | `Application.Dummy3(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy4 | function | 仅发现/枚举 | `Application.Dummy4(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy5 | function | 仅发现/枚举 | `Application.Dummy5(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy6 | function | 仅发现/枚举 | `Application.Dummy6(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy7 | function | 仅发现/枚举 | `Application.Dummy7(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy8 | function | 仅发现/枚举 | `Application.Dummy8(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Dummy9 | function | 仅发现/枚举 | `Application.Dummy9(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | EditDirectlyInCell | boolean | 仅发现/枚举 | 读取 `Application.EditDirectlyInCell`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | EnableAnimations | boolean | 仅发现/枚举 | 读取 `Application.EnableAnimations`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | EnableAutoComplete | boolean | 仅发现/枚举 | 读取 `Application.EnableAutoComplete`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | EnableCancelKey | number | 仅发现/枚举 | 读取 `Application.EnableCancelKey`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | EnableCheckFileExtensions | boolean | 仅发现/枚举 | 读取 `Application.EnableCheckFileExtensions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | EnableEvents | boolean | 仅发现/枚举 | 读取 `Application.EnableEvents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | EnableLargeOperationAlert | boolean | 仅发现/枚举 | 读取 `Application.EnableLargeOperationAlert`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | EnableLivePreview | boolean | 仅发现/枚举 | 读取 `Application.EnableLivePreview`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | EnableMacroAnimations | boolean | 仅发现/枚举 | 读取 `Application.EnableMacroAnimations`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | EnableSound | boolean | 仅发现/枚举 | 读取 `Application.EnableSound`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | EnableTipWizard | boolean | 仅发现/枚举 | 读取 `Application.EnableTipWizard`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Enum | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Enum`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Env | object | 仅发现/枚举 | 读取 `Application.Env`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ErrorCheckingOptions | object | 仅发现/枚举 | 读取 `Application.ErrorCheckingOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | EtApplication | function | 有同名显式探测；详情看宿主章节 | `Application.EtApplication(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Evaluate | function | 仅发现/枚举 | `Application.Evaluate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Excel4IntlMacroSheets | object | 仅发现/枚举 | 读取 `Application.Excel4IntlMacroSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Excel4MacroSheets | object | 仅发现/枚举 | 读取 `Application.Excel4MacroSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ExecFunc | function | 仅发现/枚举 | `Application.ExecFunc(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ExecuteExcel4Macro | function | 仅发现/枚举 | `Application.ExecuteExcel4Macro(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ExtendList | boolean | 仅发现/枚举 | 读取 `Application.ExtendList`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | FeatureInstall | number | 仅发现/枚举 | 读取 `Application.FeatureInstall`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | FileConverters | function | 仅发现/枚举 | `Application.FileConverters(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | FileDialog | function | 有同名显式探测；详情看宿主章节 | `Application.FileDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | FileExportConverters | object | 仅发现/枚举 | 读取 `Application.FileExportConverters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | FileFind | object | 仅发现/枚举 | 读取 `Application.FileFind`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | FileSearch | object | 仅发现/枚举 | 读取 `Application.FileSearch`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | FileSystem | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.FileSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | FileValidation | number | 仅发现/枚举 | 读取 `Application.FileValidation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | FileValidationPivot | number | 仅发现/枚举 | 读取 `Application.FileValidationPivot`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | FindFile | function | 仅发现/枚举 | `Application.FindFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | FindFormat | object | 仅发现/枚举 | 读取 `Application.FindFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | FixedDecimal | boolean | 仅发现/枚举 | 读取 `Application.FixedDecimal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | FixedDecimalPlaces | number | 仅发现/枚举 | 读取 `Application.FixedDecimalPlaces`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | FlashFill | boolean | 仅发现/枚举 | 读取 `Application.FlashFill`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | FlashFillMode | boolean | 仅发现/枚举 | 读取 `Application.FlashFillMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | FormulaBarHeight | number | 仅发现/枚举 | 读取 `Application.FormulaBarHeight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | GenerateGetPivotData | boolean | 仅发现/枚举 | 读取 `Application.GenerateGetPivotData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | GenerateTableRefs | number | 仅发现/枚举 | 读取 `Application.GenerateTableRefs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | GetApplicationEx | function | 仅发现/枚举 | `Application.GetApplicationEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | GetCustomListContents | function | 仅发现/枚举 | `Application.GetCustomListContents(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | GetCustomListNum | function | 仅发现/枚举 | `Application.GetCustomListNum(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | GetDataBuffer | function | 仅发现/枚举 | `Application.GetDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | GetJSReturnValue | function | 仅发现/枚举 | `Application.GetJSReturnValue(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | GetOpenFilename | function | 仅发现/枚举 | `Application.GetOpenFilename(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | GetPhonetic | function | 仅发现/枚举 | `Application.GetPhonetic(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | GetSaveAsFilename | function | 仅发现/枚举 | `Application.GetSaveAsFilename(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | GetTaskPane | function | 有同名显式探测；详情看宿主章节 | `Application.GetTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | GetWebDialog | function | 有同名显式探测；详情看宿主章节 | `Application.GetWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Goto | function | 仅发现/枚举 | `Application.Goto(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Height | number | 仅发现/枚举 | 读取 `Application.Height`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Help | function | 仅发现/枚举 | `Application.Help(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | HighQualityModeForGraphics | boolean | 仅发现/枚举 | 读取 `Application.HighQualityModeForGraphics`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Hinstance | number | 仅发现/枚举 | 读取 `Application.Hinstance`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | HinstancePtr | number | 仅发现/枚举 | 读取 `Application.HinstancePtr`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Hwnd | number | 仅发现/枚举 | 读取 `Application.Hwnd`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | IgnoreRemoteRequests | boolean | 仅发现/枚举 | 读取 `Application.IgnoreRemoteRequests`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | InchesToPoints | function | 仅发现/枚举 | `Application.InchesToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | InfoCollect | object | 仅发现/枚举 | 读取 `Application.InfoCollect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | InputBox | function | 仅发现/枚举 | `Application.InputBox(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Interactive | boolean | 仅发现/枚举 | 读取 `Application.Interactive`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | International | function | 仅发现/枚举 | `Application.International(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Intersect | function | 仅发现/枚举 | `Application.Intersect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | IsLastIOBroken | number | 仅发现/枚举 | 读取 `Application.IsLastIOBroken`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | IsSandboxed | boolean | 仅发现/枚举 | 读取 `Application.IsSandboxed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Iteration | boolean | 仅发现/枚举 | 读取 `Application.Iteration`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | JS2Variant | function | 仅发现/枚举 | `Application.JS2Variant(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | JSIDE | null | 仅发现/枚举 | 读取 `Application.JSIDE`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | LanguageSettings | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.LanguageSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | LargeButtons | boolean | 仅发现/枚举 | 读取 `Application.LargeButtons`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | LargeOperationCellThousandCount | number | 仅发现/枚举 | 读取 `Application.LargeOperationCellThousandCount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Left | number | 仅发现/枚举 | 读取 `Application.Left`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | LibraryPath | string | 仅发现/枚举 | 读取 `Application.LibraryPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MacroOptions | function | 仅发现/枚举 | `Application.MacroOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | MailLogoff | function | 仅发现/枚举 | `Application.MailLogoff(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | MailLogon | function | 仅发现/枚举 | `Application.MailLogon(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | MailSession | null | 仅发现/枚举 | 读取 `Application.MailSession`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MailSystem | number | 仅发现/枚举 | 读取 `Application.MailSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MainWindows | object | 仅发现/枚举 | 读取 `Application.MainWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MapPaperSize | boolean | 仅发现/枚举 | 读取 `Application.MapPaperSize`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MathCoprocessorAvailable | boolean | 仅发现/枚举 | 读取 `Application.MathCoprocessorAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MaxChange | number | 仅发现/枚举 | 读取 `Application.MaxChange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MaxIterations | number | 仅发现/枚举 | 读取 `Application.MaxIterations`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MeasurementUnit | number | 仅发现/枚举 | 读取 `Application.MeasurementUnit`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MemoryFree | number | 仅发现/枚举 | 读取 `Application.MemoryFree`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MemoryTotal | number | 仅发现/枚举 | 读取 `Application.MemoryTotal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MemoryUsed | number | 仅发现/枚举 | 读取 `Application.MemoryUsed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MenuBars | object | 仅发现/枚举 | 读取 `Application.MenuBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MergeInstances | boolean | 仅发现/枚举 | 读取 `Application.MergeInstances`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Modules | object | 仅发现/枚举 | 读取 `Application.Modules`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MouseAvailable | boolean | 仅发现/枚举 | 读取 `Application.MouseAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MoveAfterReturn | boolean | 仅发现/枚举 | 读取 `Application.MoveAfterReturn`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MoveAfterReturnDirection | number | 仅发现/枚举 | 读取 `Application.MoveAfterReturnDirection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | MultiThreadedCalculation | object | 仅发现/枚举 | 读取 `Application.MultiThreadedCalculation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Name | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Names | object | 仅发现/枚举 | 读取 `Application.Names`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | NetworkTemplatesPath | string | 仅发现/枚举 | 读取 `Application.NetworkTemplatesPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | NewEnum | object | 仅发现/枚举 | 读取 `Application.NewEnum`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | NewWorkbook | object | 仅发现/枚举 | 读取 `Application.NewWorkbook`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | NextLetter | function | 仅发现/枚举 | `Application.NextLetter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | OAAssist | object | 仅发现/枚举 | 读取 `Application.OAAssist`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ODBCErrors | object | 仅发现/枚举 | 读取 `Application.ODBCErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ODBCTimeout | number | 仅发现/枚举 | 读取 `Application.ODBCTimeout`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Office | object | 仅发现/枚举 | 读取 `Application.Office`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | OLEDBErrors | null | 仅发现/枚举 | 读取 `Application.OLEDBErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | OnCalculate | string | 仅发现/枚举 | 读取 `Application.OnCalculate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | OnData | string | 仅发现/枚举 | 读取 `Application.OnData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | OnDoubleClick | string | 仅发现/枚举 | 读取 `Application.OnDoubleClick`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | OnEntry | string | 仅发现/枚举 | 读取 `Application.OnEntry`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | OnKey | function | 仅发现/枚举 | `Application.OnKey(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | OnRepeat | function | 仅发现/枚举 | `Application.OnRepeat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | OnSheetActivate | string | 仅发现/枚举 | 读取 `Application.OnSheetActivate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | OnSheetDeactivate | string | 仅发现/枚举 | 读取 `Application.OnSheetDeactivate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | OnTime | function | 有同名显式探测；详情看宿主章节 | `Application.OnTime(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | OnUndo | function | 仅发现/枚举 | `Application.OnUndo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | OnWindow | string | 仅发现/枚举 | 读取 `Application.OnWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | OpenFileLocationInStartPage | function | 仅发现/枚举 | `Application.OpenFileLocationInStartPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | OpenWebUrl | function | 仅发现/枚举 | `Application.OpenWebUrl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | OperatingSystem | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.OperatingSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | OrganizationName | string | 仅发现/枚举 | 读取 `Application.OrganizationName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Parent | object | 仅发现/枚举 | 读取 `Application.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Path | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Path`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | PathSeparator | string | 仅发现/枚举 | 读取 `Application.PathSeparator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | PivotTableSelection | boolean | 仅发现/枚举 | 读取 `Application.PivotTableSelection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | PluginStorage | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.PluginStorage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | PreviousSelections | function | 仅发现/枚举 | `Application.PreviousSelections(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | PrintCommunication | boolean | 仅发现/枚举 | 读取 `Application.PrintCommunication`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ProductCode | string | 仅发现/枚举 | 读取 `Application.ProductCode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | PromeAddPage | function | 仅发现/枚举 | `Application.PromeAddPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | PromeName | string | 仅发现/枚举 | 读取 `Application.PromeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | PromeNewDocument | function | 仅发现/枚举 | `Application.PromeNewDocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | PromeTidyModeChange | function | 仅发现/枚举 | `Application.PromeTidyModeChange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | prompt | function | 仅发现/枚举 | `Application.prompt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | PromptForSummaryInfo | boolean | 仅发现/枚举 | 读取 `Application.PromptForSummaryInfo`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ProtectedViewWindows | object | 仅发现/枚举 | 读取 `Application.ProtectedViewWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | QuickAnalysis | object | 仅发现/枚举 | 读取 `Application.QuickAnalysis`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Quit | function | 有同名显式探测；详情看宿主章节 | `Application.Quit(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Quitting | boolean | 仅发现/枚举 | 读取 `Application.Quitting`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Range | function | 仅发现/枚举 | `Application.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Ready | boolean | 仅发现/枚举 | 读取 `Application.Ready`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | RecentFiles | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.RecentFiles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | RecordMacro | function | 仅发现/枚举 | `Application.RecordMacro(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | RecordRelative | boolean | 仅发现/枚举 | 读取 `Application.RecordRelative`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ReferenceStyle | number | 仅发现/枚举 | 读取 `Application.ReferenceStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | RegisteredFunctions | function | 仅发现/枚举 | `Application.RegisteredFunctions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | RegisterXLL | function | 仅发现/枚举 | `Application.RegisterXLL(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Repeat | function | 仅发现/枚举 | `Application.Repeat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ReplaceFormat | object | 仅发现/枚举 | 读取 `Application.ReplaceFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ResetTipWizard | function | 仅发现/枚举 | `Application.ResetTipWizard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ribbonUI | object | 仅发现/枚举 | 读取 `Application.ribbonUI`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | RollZoom | boolean | 仅发现/枚举 | 读取 `Application.RollZoom`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Rows | object | 仅发现/枚举 | 读取 `Application.Rows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | RTD | object | 仅发现/枚举 | 读取 `Application.RTD`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Run | function | 有同名显式探测；详情看宿主章节 | `Application.Run(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Save | function | 仅发现/枚举 | `Application.Save(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | SaveISO8601Dates | boolean | 仅发现/枚举 | 读取 `Application.SaveISO8601Dates`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | SaveWorkspace | function | 仅发现/枚举 | `Application.SaveWorkspace(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ScreenUpdating | boolean | 有同名显式探测；详情看宿主章节 | 读取 `Application.ScreenUpdating`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Selection | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Selection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | SendKeys | function | 有同名显式探测；详情看宿主章节 | `Application.SendKeys(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | SetDefaultChart | function | 仅发现/枚举 | `Application.SetDefaultChart(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | SharePointVersion | function | 仅发现/枚举 | `Application.SharePointVersion(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Sheets | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Sheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | SheetsInNewWorkbook | number | 仅发现/枚举 | 读取 `Application.SheetsInNewWorkbook`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ShortcutMenus | function | 仅发现/枚举 | `Application.ShortcutMenus(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ShowChartTipNames | boolean | 仅发现/枚举 | 读取 `Application.ShowChartTipNames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ShowChartTipValues | boolean | 仅发现/枚举 | 读取 `Application.ShowChartTipValues`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ShowDevTools | boolean | 仅发现/枚举 | 读取 `Application.ShowDevTools`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ShowDialog | function | 有同名显式探测；详情看宿主章节 | `Application.ShowDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ShowDialogEx | function | 仅发现/枚举 | `Application.ShowDialogEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ShowExceptionError | function | 仅发现/枚举 | `Application.ShowExceptionError(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | ShowMenuFloaties | boolean | 仅发现/枚举 | 读取 `Application.ShowMenuFloaties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ShowQuickAnalysis | boolean | 仅发现/枚举 | 读取 `Application.ShowQuickAnalysis`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ShowSelectionFloaties | boolean | 仅发现/枚举 | 读取 `Application.ShowSelectionFloaties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ShowStartupDialog | boolean | 仅发现/枚举 | 读取 `Application.ShowStartupDialog`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ShowToolTips | boolean | 仅发现/枚举 | 读取 `Application.ShowToolTips`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ShowWindowsInTaskbar | boolean | 仅发现/枚举 | 读取 `Application.ShowWindowsInTaskbar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | SmartArtColors | object | 仅发现/枚举 | 读取 `Application.SmartArtColors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | SmartArtLayouts | object | 仅发现/枚举 | 读取 `Application.SmartArtLayouts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | SmartArtQuickStyles | object | 仅发现/枚举 | 读取 `Application.SmartArtQuickStyles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | SmartTagRecognizers | object | 仅发现/枚举 | 读取 `Application.SmartTagRecognizers`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Speech | object | 仅发现/枚举 | 读取 `Application.Speech`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | SpellingOptions | object | 仅发现/枚举 | 读取 `Application.SpellingOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | StandardFont | string | 仅发现/枚举 | 读取 `Application.StandardFont`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | StandardFontSize | number | 仅发现/枚举 | 读取 `Application.StandardFontSize`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | StartAccess | function | 仅发现/枚举 | `Application.StartAccess(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | StartupEdit | function | 仅发现/枚举 | `Application.StartupEdit(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | StartupPath | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.StartupPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | StatusBar | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.StatusBar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Support | function | 仅发现/枚举 | `Application.Support(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | TabPages | object | 仅发现/枚举 | 读取 `Application.TabPages`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | TaskPanesEx | object | 仅发现/枚举 | 读取 `Application.TaskPanesEx`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | TemplatesPath | string | 仅发现/枚举 | 读取 `Application.TemplatesPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ThisBrowser | object | 仅发现/枚举 | 读取 `Application.ThisBrowser`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ThisCell | null | 仅发现/枚举 | 读取 `Application.ThisCell`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ThisWorkbook | object | 仅发现/枚举 | 读取 `Application.ThisWorkbook`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | ThousandsSeparator | string | 仅发现/枚举 | 读取 `Application.ThousandsSeparator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Toolbars | object | 仅发现/枚举 | 读取 `Application.Toolbars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Top | number | 仅发现/枚举 | 读取 `Application.Top`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | TransitionMenuKey | string | 仅发现/枚举 | 读取 `Application.TransitionMenuKey`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | TransitionMenuKeyAction | number | 仅发现/枚举 | 读取 `Application.TransitionMenuKeyAction`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | TransitionNavigKeys | boolean | 仅发现/枚举 | 读取 `Application.TransitionNavigKeys`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | UILanguage | number | 仅发现/枚举 | 读取 `Application.UILanguage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Undo | function | 有同名显式探测；详情看宿主章节 | `Application.Undo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Union | function | 仅发现/枚举 | `Application.Union(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | UpdateRibbon | function | 有同名显式探测；详情看宿主章节 | `Application.UpdateRibbon(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | UsableHeight | number | 仅发现/枚举 | 读取 `Application.UsableHeight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | UsableWidth | number | 仅发现/枚举 | 读取 `Application.UsableWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | UseClusterConnector | boolean | 仅发现/枚举 | 读取 `Application.UseClusterConnector`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | UsedObjects | object | 仅发现/枚举 | 读取 `Application.UsedObjects`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | UserControl | boolean | 仅发现/枚举 | 读取 `Application.UserControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | UserLibraryPath | string | 仅发现/枚举 | 读取 `Application.UserLibraryPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | UserName | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.UserName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | UseSystemSeparators | boolean | 仅发现/枚举 | 读取 `Application.UseSystemSeparators`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Value | string | 仅发现/枚举 | 读取 `Application.Value`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Version | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Version`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Visible | boolean | 有同名显式探测；详情看宿主章节 | 读取 `Application.Visible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Volatile | function | 仅发现/枚举 | `Application.Volatile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | Wait | function | 仅发现/枚举 | `Application.Wait(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | WarnOnFunctionNameConflict | boolean | 仅发现/枚举 | 读取 `Application.WarnOnFunctionNameConflict`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Watches | object | 仅发现/枚举 | 读取 `Application.Watches`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | WebJS2Variant | function | 仅发现/枚举 | `Application.WebJS2Variant(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Application | WebShape | null | 仅发现/枚举 | 读取 `Application.WebShape`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Width | number | 仅发现/枚举 | 读取 `Application.Width`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Windows | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Windows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | WindowsForPens | boolean | 仅发现/枚举 | 读取 `Application.WindowsForPens`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | WindowState | number | 仅发现/枚举 | 读取 `Application.WindowState`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Workbooks | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Workbooks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | WorksheetFunction | object | 仅发现/枚举 | 读取 `Application.WorksheetFunction`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | Worksheets | object | 仅发现/枚举 | 读取 `Application.Worksheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | WpsAccount | object | 仅发现/枚举 | 读取 `Application.WpsAccount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | WPSAddIns | object | 仅发现/枚举 | 读取 `Application.WPSAddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | WPSCloudService | object | 仅发现/枚举 | 读取 `Application.WPSCloudService`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | WpsConfig | object | 仅发现/枚举 | 读取 `Application.WpsConfig`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | WpsHttpRequests | object | 仅发现/枚举 | 读取 `Application.WpsHttpRequests`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Application | WrapCallbackArg | function | 仅发现/枚举 | `Application.WrapCallbackArg(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | absoluteFilePath | function | 仅发现/枚举 | `FileSystem.absoluteFilePath(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | absolutePath | function | 仅发现/枚举 | `FileSystem.absolutePath(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | AppendFile | function | 仅发现/枚举 | `FileSystem.AppendFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | constants | object | 仅发现/枚举 | 读取 `FileSystem.constants`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | FileSystem | copyFileSync | function | 仅发现/枚举 | `FileSystem.copyFileSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | Exists | function | 仅发现/枚举 | `FileSystem.Exists(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | existsSync | function | 仅发现/枚举 | `FileSystem.existsSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | isWritable | function | 仅发现/枚举 | `FileSystem.isWritable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | Mkdir | function | 仅发现/枚举 | `FileSystem.Mkdir(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | mkdirSync | function | 仅发现/枚举 | `FileSystem.mkdirSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | mkdtempSync | function | 仅发现/枚举 | `FileSystem.mkdtempSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | readAsBinaryString | function | 仅发现/枚举 | `FileSystem.readAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | readdirSync | function | 仅发现/枚举 | `FileSystem.readdirSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | ReadFile | function | 仅发现/枚举 | `FileSystem.ReadFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | ReadFileAsArrayBuffer | function | 仅发现/枚举 | `FileSystem.ReadFileAsArrayBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | readFileString | function | 仅发现/枚举 | `FileSystem.readFileString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | Remove | function | 仅发现/枚举 | `FileSystem.Remove(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | rmdirSync | function | 仅发现/枚举 | `FileSystem.rmdirSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | stat | function | 仅发现/枚举 | `FileSystem.stat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | tmpdir | function | 仅发现/枚举 | `FileSystem.tmpdir(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | toNativeSeparators | function | 仅发现/枚举 | `FileSystem.toNativeSeparators(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | unlinkSync | function | 仅发现/枚举 | `FileSystem.unlinkSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | writeAsBinaryString | function | 仅发现/枚举 | `FileSystem.writeAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | WriteFile | function | 仅发现/枚举 | `FileSystem.WriteFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | writeFileString | function | 仅发现/枚举 | `FileSystem.writeFileString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | FileSystem | writeSliceAsBinaryString | function | 仅发现/枚举 | `FileSystem.writeSliceAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | __PrintOut | function | 仅发现/枚举 | `Range.__PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | _BorderAround | function | 仅发现/枚举 | `Range._BorderAround(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | _Default | function | 仅发现/枚举 | `Range._Default(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | _PasteSpecial | function | 仅发现/枚举 | `Range._PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | _PrintOut | function | 仅发现/枚举 | `Range._PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Activate | function | 仅发现/枚举 | `Range.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | AddComment | function | 仅发现/枚举 | `Range.AddComment(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | AddIndent | number | 仅发现/枚举 | 读取 `Range.AddIndent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Address | function | 仅发现/枚举 | `Range.Address(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | AddressLocal | function | 仅发现/枚举 | `Range.AddressLocal(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | AdvancedFilter | function | 仅发现/枚举 | `Range.AdvancedFilter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | AllocateChanges | function | 仅发现/枚举 | `Range.AllocateChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | AllowEdit | boolean | 仅发现/枚举 | 读取 `Range.AllowEdit`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Application | object | 仅发现/枚举 | 读取 `Range.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | ApplyNames | function | 仅发现/枚举 | `Range.ApplyNames(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | ApplyOutlineStyles | function | 仅发现/枚举 | `Range.ApplyOutlineStyles(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Areas | object | 仅发现/枚举 | 读取 `Range.Areas`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | AutoComplete | function | 仅发现/枚举 | `Range.AutoComplete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | AutoFill | function | 仅发现/枚举 | `Range.AutoFill(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | AutoFilter | function | 仅发现/枚举 | `Range.AutoFilter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | AutoFit | function | 仅发现/枚举 | `Range.AutoFit(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | AutoFormat | function | 仅发现/枚举 | `Range.AutoFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | AutoOutline | function | 仅发现/枚举 | `Range.AutoOutline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | BorderAround | function | 仅发现/枚举 | `Range.BorderAround(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Borders | object | 仅发现/枚举 | 读取 `Range.Borders`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Calculate | function | 仅发现/枚举 | `Range.Calculate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | CalculateRowMajorOrder | function | 仅发现/枚举 | `Range.CalculateRowMajorOrder(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Cells | object | 仅发现/枚举 | 读取 `Range.Cells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Characters | function | 仅发现/枚举 | `Range.Characters(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | CheckSpelling | function | 仅发现/枚举 | `Range.CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Clear | function | 仅发现/枚举 | `Range.Clear(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | ClearComments | function | 仅发现/枚举 | `Range.ClearComments(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | ClearContents | function | 仅发现/枚举 | `Range.ClearContents(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | ClearFormats | function | 仅发现/枚举 | `Range.ClearFormats(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | ClearHyperlinks | function | 仅发现/枚举 | `Range.ClearHyperlinks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | ClearNotes | function | 仅发现/枚举 | `Range.ClearNotes(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | ClearOutline | function | 仅发现/枚举 | `Range.ClearOutline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Column | number | 仅发现/枚举 | 读取 `Range.Column`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | ColumnDifferences | function | 仅发现/枚举 | `Range.ColumnDifferences(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Columns | object | 仅发现/枚举 | 读取 `Range.Columns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | ColumnWidth | number | 仅发现/枚举 | 读取 `Range.ColumnWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Comment | null | 仅发现/枚举 | 读取 `Range.Comment`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Consolidate | function | 仅发现/枚举 | `Range.Consolidate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Copy | function | 有同名显式探测；详情看宿主章节 | `Range.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | CopyFromRecordset | function | 仅发现/枚举 | `Range.CopyFromRecordset(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | CopyPicture | function | 仅发现/枚举 | `Range.CopyPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Count | number | 仅发现/枚举 | 读取 `Range.Count`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | CountLarge | number | 仅发现/枚举 | 读取 `Range.CountLarge`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | CreateNames | function | 仅发现/枚举 | `Range.CreateNames(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | CreatePublisher | function | 仅发现/枚举 | `Range.CreatePublisher(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Creator | number | 仅发现/枚举 | 读取 `Range.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | CurrentArray | object | 仅发现/枚举 | 读取 `Range.CurrentArray`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | CurrentRegion | object | 仅发现/枚举 | 读取 `Range.CurrentRegion`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Cut | function | 仅发现/枚举 | `Range.Cut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | DataSeries | function | 仅发现/枚举 | `Range.DataSeries(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Delete | function | 有同名显式探测；详情看宿主章节 | `Range.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Dependents | null | 仅发现/枚举 | 读取 `Range.Dependents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | DialogBox | function | 仅发现/枚举 | `Range.DialogBox(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | DirectDependents | null | 仅发现/枚举 | 读取 `Range.DirectDependents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | DirectPrecedents | null | 仅发现/枚举 | 读取 `Range.DirectPrecedents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Dirty | function | 仅发现/枚举 | `Range.Dirty(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | DiscardChanges | function | 仅发现/枚举 | `Range.DiscardChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | DisplayFormat | object | 仅发现/枚举 | 读取 `Range.DisplayFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | EditionOptions | function | 仅发现/枚举 | `Range.EditionOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | End | function | 仅发现/枚举 | `Range.End(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | EntireColumn | object | 仅发现/枚举 | 读取 `Range.EntireColumn`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | EntireRow | object | 仅发现/枚举 | 读取 `Range.EntireRow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Errors | null | 仅发现/枚举 | 读取 `Range.Errors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | ExportAsFixedFormat | function | 仅发现/枚举 | `Range.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | FillDown | function | 仅发现/枚举 | `Range.FillDown(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | FillLeft | function | 仅发现/枚举 | `Range.FillLeft(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | FillRight | function | 仅发现/枚举 | `Range.FillRight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | FillUp | function | 仅发现/枚举 | `Range.FillUp(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Find | function | 有同名显式探测；详情看宿主章节 | `Range.Find(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | FindNext | function | 仅发现/枚举 | `Range.FindNext(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | FindPrevious | function | 仅发现/枚举 | `Range.FindPrevious(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | FlashFill | function | 仅发现/枚举 | `Range.FlashFill(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Font | object | 仅发现/枚举 | 读取 `Range.Font`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | FormatConditions | object | 仅发现/枚举 | 读取 `Range.FormatConditions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Formula | object | 仅发现/枚举 | 读取 `Range.Formula`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Formula2 | object | 仅发现/枚举 | 读取 `Range.Formula2`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Formula2Local | object | 仅发现/枚举 | 读取 `Range.Formula2Local`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Formula2R1C1 | object | 仅发现/枚举 | 读取 `Range.Formula2R1C1`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Formula2R1C1Local | object | 仅发现/枚举 | 读取 `Range.Formula2R1C1Local`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | FormulaArray | string | 仅发现/枚举 | 读取 `Range.FormulaArray`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | FormulaHidden | boolean | 仅发现/枚举 | 读取 `Range.FormulaHidden`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | FormulaLabel | number | 仅发现/枚举 | 读取 `Range.FormulaLabel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | FormulaLocal | object | 仅发现/枚举 | 读取 `Range.FormulaLocal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | FormulaR1C1 | object | 仅发现/枚举 | 读取 `Range.FormulaR1C1`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | FormulaR1C1Local | object | 仅发现/枚举 | 读取 `Range.FormulaR1C1Local`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | FunctionWizard | function | 仅发现/枚举 | `Range.FunctionWizard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | GetRangeEx | function | 仅发现/枚举 | `Range.GetRangeEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | GoalSeek | function | 仅发现/枚举 | `Range.GoalSeek(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Group | function | 仅发现/枚举 | `Range.Group(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | HasArray | boolean | 仅发现/枚举 | 读取 `Range.HasArray`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | HasFormula | boolean | 仅发现/枚举 | 读取 `Range.HasFormula`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | HasSpill | boolean | 仅发现/枚举 | 读取 `Range.HasSpill`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Height | number | 仅发现/枚举 | 读取 `Range.Height`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Hidden | null | 仅发现/枚举 | 读取 `Range.Hidden`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | HorizontalAlignment | number | 仅发现/枚举 | 读取 `Range.HorizontalAlignment`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Hyperlinks | object | 仅发现/枚举 | 读取 `Range.Hyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | ID | null | 仅发现/枚举 | 读取 `Range.ID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | IndentLevel | number | 仅发现/枚举 | 读取 `Range.IndentLevel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Insert | function | 有同名显式探测；详情看宿主章节 | `Range.Insert(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | InsertIndent | function | 仅发现/枚举 | `Range.InsertIndent(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Interior | object | 仅发现/枚举 | 读取 `Range.Interior`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Item | function | 仅发现/枚举 | `Range.Item(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Justify | function | 仅发现/枚举 | `Range.Justify(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Left | number | 仅发现/枚举 | 读取 `Range.Left`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | ListHeaderRows | number | 仅发现/枚举 | 读取 `Range.ListHeaderRows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | ListNames | function | 仅发现/枚举 | `Range.ListNames(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | ListObject | null | 仅发现/枚举 | 读取 `Range.ListObject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | LocationInTable | null | 仅发现/枚举 | 读取 `Range.LocationInTable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Locked | boolean | 仅发现/枚举 | 读取 `Range.Locked`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | MDX | string | 仅发现/枚举 | 读取 `Range.MDX`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Merge | function | 有同名显式探测；详情看宿主章节 | `Range.Merge(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | MergeArea | null | 仅发现/枚举 | 读取 `Range.MergeArea`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | MergeCells | boolean | 仅发现/枚举 | 读取 `Range.MergeCells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Name | null | 仅发现/枚举 | 读取 `Range.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | NavigateArrow | function | 仅发现/枚举 | `Range.NavigateArrow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Next | object | 仅发现/枚举 | 读取 `Range.Next`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | NoteText | function | 仅发现/枚举 | `Range.NoteText(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | NumberFormat | string | 仅发现/枚举 | 读取 `Range.NumberFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | NumberFormatLocal | string | 仅发现/枚举 | 读取 `Range.NumberFormatLocal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Offset | function | 仅发现/枚举 | `Range.Offset(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Orientation | number | 仅发现/枚举 | 读取 `Range.Orientation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | OutlineLevel | null | 仅发现/枚举 | 读取 `Range.OutlineLevel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | PageBreak | number | 仅发现/枚举 | 读取 `Range.PageBreak`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Parent | object | 仅发现/枚举 | 读取 `Range.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Parse | function | 仅发现/枚举 | `Range.Parse(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | PasteSpecial | function | 仅发现/枚举 | `Range.PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Phonetic | object | 仅发现/枚举 | 读取 `Range.Phonetic`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Phonetics | object | 仅发现/枚举 | 读取 `Range.Phonetics`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | PivotCell | null | 仅发现/枚举 | 读取 `Range.PivotCell`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | PivotField | null | 仅发现/枚举 | 读取 `Range.PivotField`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | PivotItem | null | 仅发现/枚举 | 读取 `Range.PivotItem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | PivotTable | null | 仅发现/枚举 | 读取 `Range.PivotTable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Precedents | null | 仅发现/枚举 | 读取 `Range.Precedents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | PrefixCharacter | string | 仅发现/枚举 | 读取 `Range.PrefixCharacter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Previous | null | 仅发现/枚举 | 读取 `Range.Previous`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | PrintOut | function | 仅发现/枚举 | `Range.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | PrintPreview | function | 仅发现/枚举 | `Range.PrintPreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | QueryTable | null | 仅发现/枚举 | 读取 `Range.QueryTable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Range | function | 仅发现/枚举 | `Range.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | RangeEx | object | 仅发现/枚举 | 读取 `Range.RangeEx`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | ReadingOrder | number | 仅发现/枚举 | 读取 `Range.ReadingOrder`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | RealValue2 | object | 仅发现/枚举 | 读取 `Range.RealValue2`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | RemoveDuplicates | function | 仅发现/枚举 | `Range.RemoveDuplicates(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | RemoveSubtotal | function | 仅发现/枚举 | `Range.RemoveSubtotal(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Replace | function | 仅发现/枚举 | `Range.Replace(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Resize | function | 仅发现/枚举 | `Range.Resize(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Row | number | 仅发现/枚举 | 读取 `Range.Row`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | RowDifferences | function | 仅发现/枚举 | `Range.RowDifferences(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | RowHeight | number | 仅发现/枚举 | 读取 `Range.RowHeight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Rows | object | 仅发现/枚举 | 读取 `Range.Rows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Run | function | 仅发现/枚举 | `Range.Run(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Select | function | 有同名显式探测；详情看宿主章节 | `Range.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | ServerActions | object | 仅发现/枚举 | 读取 `Range.ServerActions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | SetPhonetic | function | 仅发现/枚举 | `Range.SetPhonetic(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Show | function | 仅发现/枚举 | `Range.Show(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | ShowDependents | function | 仅发现/枚举 | `Range.ShowDependents(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | ShowDetail | null | 仅发现/枚举 | 读取 `Range.ShowDetail`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | ShowErrors | function | 仅发现/枚举 | `Range.ShowErrors(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | ShowPrecedents | function | 仅发现/枚举 | `Range.ShowPrecedents(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | ShrinkToFit | boolean | 仅发现/枚举 | 读取 `Range.ShrinkToFit`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | SmartTags | object | 仅发现/枚举 | 读取 `Range.SmartTags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Sort | function | 仅发现/枚举 | `Range.Sort(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | SortSpecial | function | 仅发现/枚举 | `Range.SortSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | SoundNote | object | 仅发现/枚举 | 读取 `Range.SoundNote`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | SparklineGroups | object | 仅发现/枚举 | 读取 `Range.SparklineGroups`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Speak | function | 仅发现/枚举 | `Range.Speak(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | SpecialCells | function | 仅发现/枚举 | `Range.SpecialCells(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | SpillingToRange | null | 仅发现/枚举 | 读取 `Range.SpillingToRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | SpillParent | null | 仅发现/枚举 | 读取 `Range.SpillParent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Style | object | 仅发现/枚举 | 读取 `Range.Style`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | SubscribeTo | function | 仅发现/枚举 | `Range.SubscribeTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Subtotal | function | 仅发现/枚举 | `Range.Subtotal(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Summary | null | 仅发现/枚举 | 读取 `Range.Summary`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Table | function | 仅发现/枚举 | `Range.Table(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Text | string | 仅发现/枚举 | 读取 `Range.Text`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | TextToColumns | function | 仅发现/枚举 | `Range.TextToColumns(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Top | number | 仅发现/枚举 | 读取 `Range.Top`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Ungroup | function | 仅发现/枚举 | `Range.Ungroup(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | UnMerge | function | 有同名显式探测；详情看宿主章节 | `Range.UnMerge(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | UseStandardHeight | boolean | 仅发现/枚举 | 读取 `Range.UseStandardHeight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | UseStandardWidth | boolean | 仅发现/枚举 | 读取 `Range.UseStandardWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Validation | object | 仅发现/枚举 | 读取 `Range.Validation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Value | function | 仅发现/枚举 | `Range.Value(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Range | Value2 | object | 仅发现/枚举 | 读取 `Range.Value2`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | VerticalAlignment | number | 仅发现/枚举 | 读取 `Range.VerticalAlignment`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Width | number | 仅发现/枚举 | 读取 `Range.Width`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | Worksheet | object | 仅发现/枚举 | 读取 `Range.Worksheet`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | WrapText | boolean | 仅发现/枚举 | 读取 `Range.WrapText`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Range | XPath | null | 仅发现/枚举 | 读取 `Range.XPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Shapes | _Default | function | 仅发现/枚举 | `Shapes._Default(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddCallout | function | 仅发现/枚举 | `Shapes.AddCallout(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddCanvas | function | 仅发现/枚举 | `Shapes.AddCanvas(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddChart | function | 仅发现/枚举 | `Shapes.AddChart(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddChart2 | function | 仅发现/枚举 | `Shapes.AddChart2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddConnector | function | 仅发现/枚举 | `Shapes.AddConnector(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddCurve | function | 仅发现/枚举 | `Shapes.AddCurve(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddDiagram | function | 仅发现/枚举 | `Shapes.AddDiagram(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddFormControl | function | 仅发现/枚举 | `Shapes.AddFormControl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddLabel | function | 仅发现/枚举 | `Shapes.AddLabel(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddLine | function | 仅发现/枚举 | `Shapes.AddLine(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddMath | function | 仅发现/枚举 | `Shapes.AddMath(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddOLEObject | function | 仅发现/枚举 | `Shapes.AddOLEObject(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddPicture | function | 仅发现/枚举 | `Shapes.AddPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddPicture2 | function | 仅发现/枚举 | `Shapes.AddPicture2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddPolyline | function | 仅发现/枚举 | `Shapes.AddPolyline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddShape | function | 有同名显式探测；详情看宿主章节 | `Shapes.AddShape(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddSmartArt | function | 仅发现/枚举 | `Shapes.AddSmartArt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddTextbox | function | 有同名显式探测；详情看宿主章节 | `Shapes.AddTextbox(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddTextEffect | function | 仅发现/枚举 | `Shapes.AddTextEffect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddWebShape | function | 仅发现/枚举 | `Shapes.AddWebShape(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | AddWebShapeEx | function | 仅发现/枚举 | `Shapes.AddWebShapeEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | Application | object | 仅发现/枚举 | 读取 `Shapes.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Shapes | BuildFreeform | function | 仅发现/枚举 | `Shapes.BuildFreeform(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | Count | number | 仅发现/枚举 | 读取 `Shapes.Count`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Shapes | Creator | number | 仅发现/枚举 | 读取 `Shapes.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Shapes | Item | function | 仅发现/枚举 | `Shapes.Item(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | Parent | object | 仅发现/枚举 | 读取 `Shapes.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Shapes | Range | function | 仅发现/枚举 | `Shapes.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Shapes | SelectAll | function | 仅发现/枚举 | `Shapes.SelectAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | __PrintOut | function | 仅发现/枚举 | `Workbook.__PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | _CodeName | string | 仅发现/枚举 | 读取 `Workbook._CodeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | _PrintOut | function | 仅发现/枚举 | `Workbook._PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | _Protect | function | 仅发现/枚举 | `Workbook._Protect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | _ProtectSharing | function | 仅发现/枚举 | `Workbook._ProtectSharing(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | _ReadOnlyRecommended | boolean | 仅发现/枚举 | 读取 `Workbook._ReadOnlyRecommended`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | _SaveAs | function | 仅发现/枚举 | `Workbook._SaveAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | AcceptAllChanges | function | 仅发现/枚举 | `Workbook.AcceptAllChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | AcceptLabelsInFormulas | boolean | 仅发现/枚举 | 读取 `Workbook.AcceptLabelsInFormulas`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | AccuracyVersion | number | 仅发现/枚举 | 读取 `Workbook.AccuracyVersion`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Activate | function | 仅发现/枚举 | `Workbook.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | ActiveChart | null | 仅发现/枚举 | 读取 `Workbook.ActiveChart`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ActiveSheet | object | 仅发现/枚举 | 读取 `Workbook.ActiveSheet`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ActiveSlicer | null | 仅发现/枚举 | 读取 `Workbook.ActiveSlicer`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | AddToFavorites | function | 仅发现/枚举 | `Workbook.AddToFavorites(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Application | object | 仅发现/枚举 | 读取 `Workbook.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ApplyTheme | function | 仅发现/枚举 | `Workbook.ApplyTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Author | string | 仅发现/枚举 | 读取 `Workbook.Author`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | AutoUpdateFrequency | number | 仅发现/枚举 | 读取 `Workbook.AutoUpdateFrequency`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | AutoUpdateSaveChanges | null | 仅发现/枚举 | 读取 `Workbook.AutoUpdateSaveChanges`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | BreakLink | function | 仅发现/枚举 | `Workbook.BreakLink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | BuiltinDocumentProperties | object | 仅发现/枚举 | 读取 `Workbook.BuiltinDocumentProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | CalculationVersion | number | 仅发现/枚举 | 读取 `Workbook.CalculationVersion`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | CanCheckIn | function | 仅发现/枚举 | `Workbook.CanCheckIn(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | CaseSensitive | boolean | 仅发现/枚举 | 读取 `Workbook.CaseSensitive`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ChangeFileAccess | function | 仅发现/枚举 | `Workbook.ChangeFileAccess(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | ChangeHistoryDuration | number | 仅发现/枚举 | 读取 `Workbook.ChangeHistoryDuration`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ChangeLink | function | 仅发现/枚举 | `Workbook.ChangeLink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | ChartDataPointTrack | boolean | 仅发现/枚举 | 读取 `Workbook.ChartDataPointTrack`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Charts | object | 仅发现/枚举 | 读取 `Workbook.Charts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | CheckCompatibility | boolean | 仅发现/枚举 | 读取 `Workbook.CheckCompatibility`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | CheckIn | function | 仅发现/枚举 | `Workbook.CheckIn(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | CheckInWithVersion | function | 仅发现/枚举 | `Workbook.CheckInWithVersion(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Close | function | 仅发现/枚举 | `Workbook.Close(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | CodeName | string | 仅发现/枚举 | 读取 `Workbook.CodeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Colors | function | 仅发现/枚举 | `Workbook.Colors(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | CommandBars | object | 仅发现/枚举 | 读取 `Workbook.CommandBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Comments | string | 仅发现/枚举 | 读取 `Workbook.Comments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ConflictResolution | number | 仅发现/枚举 | 读取 `Workbook.ConflictResolution`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Connections | object | 仅发现/枚举 | 读取 `Workbook.Connections`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ConnectionsDisabled | boolean | 仅发现/枚举 | 读取 `Workbook.ConnectionsDisabled`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Container | null | 仅发现/枚举 | 读取 `Workbook.Container`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ContentTypeProperties | object | 仅发现/枚举 | 读取 `Workbook.ContentTypeProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | CreateBackup | boolean | 仅发现/枚举 | 读取 `Workbook.CreateBackup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Creator | number | 仅发现/枚举 | 读取 `Workbook.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | CustomDocumentProperties | object | 仅发现/枚举 | 读取 `Workbook.CustomDocumentProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | CustomViews | object | 仅发现/枚举 | 读取 `Workbook.CustomViews`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | CustomXMLParts | object | 仅发现/枚举 | 读取 `Workbook.CustomXMLParts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Date1904 | boolean | 仅发现/枚举 | 读取 `Workbook.Date1904`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | DefaultPivotTableStyle | string | 仅发现/枚举 | 读取 `Workbook.DefaultPivotTableStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | DefaultSlicerStyle | string | 仅发现/枚举 | 读取 `Workbook.DefaultSlicerStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | DefaultTableStyle | string | 仅发现/枚举 | 读取 `Workbook.DefaultTableStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | DefaultTimelineStyle | null | 仅发现/枚举 | 读取 `Workbook.DefaultTimelineStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | DeleteNumberFormat | function | 仅发现/枚举 | `Workbook.DeleteNumberFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | DialogSheets | object | 仅发现/枚举 | 读取 `Workbook.DialogSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | DisplayDrawingObjects | number | 仅发现/枚举 | 读取 `Workbook.DisplayDrawingObjects`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | DisplayInkComments | boolean | 仅发现/枚举 | 读取 `Workbook.DisplayInkComments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | DocumentInspectors | object | 仅发现/枚举 | 读取 `Workbook.DocumentInspectors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | DocumentLibraryVersions | object | 仅发现/枚举 | 读取 `Workbook.DocumentLibraryVersions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | DoNotPromptForConvert | boolean | 仅发现/枚举 | 读取 `Workbook.DoNotPromptForConvert`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Dummy16 | function | 仅发现/枚举 | `Workbook.Dummy16(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Dummy17 | function | 仅发现/枚举 | `Workbook.Dummy17(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Dummy26 | function | 仅发现/枚举 | `Workbook.Dummy26(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Dummy27 | function | 仅发现/枚举 | `Workbook.Dummy27(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | EnableAutoRecover | boolean | 仅发现/枚举 | 读取 `Workbook.EnableAutoRecover`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | EnableConnections | function | 仅发现/枚举 | `Workbook.EnableConnections(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | EncryptionProvider | string | 仅发现/枚举 | 读取 `Workbook.EncryptionProvider`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | EndReview | function | 仅发现/枚举 | `Workbook.EndReview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | EnvelopeVisible | boolean | 仅发现/枚举 | 读取 `Workbook.EnvelopeVisible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Excel4IntlMacroSheets | object | 仅发现/枚举 | 读取 `Workbook.Excel4IntlMacroSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Excel4MacroSheets | object | 仅发现/枚举 | 读取 `Workbook.Excel4MacroSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Excel8CompatibilityMode | boolean | 仅发现/枚举 | 读取 `Workbook.Excel8CompatibilityMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ExclusiveAccess | function | 仅发现/枚举 | `Workbook.ExclusiveAccess(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | ExportAsFixedFormat | function | 仅发现/枚举 | `Workbook.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | FileFormat | number | 仅发现/枚举 | 读取 `Workbook.FileFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Final | boolean | 仅发现/枚举 | 读取 `Workbook.Final`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | FollowHyperlink | function | 仅发现/枚举 | `Workbook.FollowHyperlink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | ForceFullCalculation | boolean | 仅发现/枚举 | 读取 `Workbook.ForceFullCalculation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ForwardMailer | function | 仅发现/枚举 | `Workbook.ForwardMailer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | FullName | string | 仅发现/枚举 | 读取 `Workbook.FullName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | FullNameURLEncoded | string | 仅发现/枚举 | 读取 `Workbook.FullNameURLEncoded`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | GetWorkbookEx | function | 仅发现/枚举 | `Workbook.GetWorkbookEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | GetWorkflowTasks | function | 仅发现/枚举 | `Workbook.GetWorkflowTasks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | GetWorkflowTemplates | function | 仅发现/枚举 | `Workbook.GetWorkflowTemplates(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | HasMailer | boolean | 仅发现/枚举 | 读取 `Workbook.HasMailer`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | HasPassword | boolean | 仅发现/枚举 | 读取 `Workbook.HasPassword`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | HasRoutingSlip | boolean | 仅发现/枚举 | 读取 `Workbook.HasRoutingSlip`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | HasVBProject | null | 仅发现/枚举 | 读取 `Workbook.HasVBProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | HighlightChangesOnScreen | boolean | 仅发现/枚举 | 读取 `Workbook.HighlightChangesOnScreen`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | HighlightChangesOptions | function | 仅发现/枚举 | `Workbook.HighlightChangesOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | HTMLProject | object | 仅发现/枚举 | 读取 `Workbook.HTMLProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | IconSets | object | 仅发现/枚举 | 读取 `Workbook.IconSets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | InactiveListBorderVisible | boolean | 仅发现/枚举 | 读取 `Workbook.InactiveListBorderVisible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | InvalidateRightsInfo | function | 仅发现/枚举 | `Workbook.InvalidateRightsInfo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | IsAddin | boolean | 仅发现/枚举 | 读取 `Workbook.IsAddin`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | IsInplace | boolean | 仅发现/枚举 | 读取 `Workbook.IsInplace`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | JSProject | null | 仅发现/枚举 | 读取 `Workbook.JSProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | KeepChangeHistory | boolean | 仅发现/枚举 | 读取 `Workbook.KeepChangeHistory`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Keywords | string | 仅发现/枚举 | 读取 `Workbook.Keywords`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | LinkInfo | function | 仅发现/枚举 | `Workbook.LinkInfo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | LinkSources | function | 仅发现/枚举 | `Workbook.LinkSources(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | ListChangesOnNewSheet | boolean | 仅发现/枚举 | 读取 `Workbook.ListChangesOnNewSheet`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | LockServerFile | function | 仅发现/枚举 | `Workbook.LockServerFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Mailer | object | 仅发现/枚举 | 读取 `Workbook.Mailer`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | MergeWorkbook | function | 仅发现/枚举 | `Workbook.MergeWorkbook(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Model | object | 仅发现/枚举 | 读取 `Workbook.Model`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Modules | object | 仅发现/枚举 | 读取 `Workbook.Modules`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | MultiUserEditing | boolean | 仅发现/枚举 | 读取 `Workbook.MultiUserEditing`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Name | string | 仅发现/枚举 | 读取 `Workbook.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Names | object | 仅发现/枚举 | 读取 `Workbook.Names`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | NewWindow | function | 仅发现/枚举 | `Workbook.NewWindow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | OnSave | string | 仅发现/枚举 | 读取 `Workbook.OnSave`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | OnSheetActivate | string | 仅发现/枚举 | 读取 `Workbook.OnSheetActivate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | OnSheetDeactivate | string | 仅发现/枚举 | 读取 `Workbook.OnSheetDeactivate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | OpenLinks | function | 仅发现/枚举 | `Workbook.OpenLinks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Parent | object | 仅发现/枚举 | 读取 `Workbook.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Password | string | 仅发现/枚举 | 读取 `Workbook.Password`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | PasswordEncryptionAlgorithm | string | 仅发现/枚举 | 读取 `Workbook.PasswordEncryptionAlgorithm`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | PasswordEncryptionFileProperties | boolean | 仅发现/枚举 | 读取 `Workbook.PasswordEncryptionFileProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | PasswordEncryptionKeyLength | number | 仅发现/枚举 | 读取 `Workbook.PasswordEncryptionKeyLength`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | PasswordEncryptionProvider | string | 仅发现/枚举 | 读取 `Workbook.PasswordEncryptionProvider`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Path | string | 仅发现/枚举 | 读取 `Workbook.Path`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Permission | object | 仅发现/枚举 | 读取 `Workbook.Permission`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | PersonalViewListSettings | boolean | 仅发现/枚举 | 读取 `Workbook.PersonalViewListSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | PersonalViewPrintSettings | boolean | 仅发现/枚举 | 读取 `Workbook.PersonalViewPrintSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | PivotCaches | function | 仅发现/枚举 | `Workbook.PivotCaches(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | PivotTables | null | 仅发现/枚举 | 读取 `Workbook.PivotTables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | PivotTableWizard | function | 仅发现/枚举 | `Workbook.PivotTableWizard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Post | function | 仅发现/枚举 | `Workbook.Post(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | PrecisionAsDisplayed | boolean | 仅发现/枚举 | 读取 `Workbook.PrecisionAsDisplayed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | PrintOut | function | 仅发现/枚举 | `Workbook.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | PrintPreview | function | 仅发现/枚举 | `Workbook.PrintPreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Protect | function | 仅发现/枚举 | `Workbook.Protect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | ProtectSharing | function | 仅发现/枚举 | `Workbook.ProtectSharing(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | ProtectStructure | boolean | 仅发现/枚举 | 读取 `Workbook.ProtectStructure`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ProtectWindows | boolean | 仅发现/枚举 | 读取 `Workbook.ProtectWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | PublishObjects | object | 仅发现/枚举 | 读取 `Workbook.PublishObjects`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | PurgeChangeHistoryNow | function | 仅发现/枚举 | `Workbook.PurgeChangeHistoryNow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Queries | object | 仅发现/枚举 | 读取 `Workbook.Queries`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ReadOnly | boolean | 仅发现/枚举 | 读取 `Workbook.ReadOnly`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ReadOnlyRecommended | boolean | 仅发现/枚举 | 读取 `Workbook.ReadOnlyRecommended`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | RecheckSmartTags | function | 仅发现/枚举 | `Workbook.RecheckSmartTags(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | RefreshAll | function | 仅发现/枚举 | `Workbook.RefreshAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | RejectAllChanges | function | 仅发现/枚举 | `Workbook.RejectAllChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | ReloadAs | function | 仅发现/枚举 | `Workbook.ReloadAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | RemoveDocumentInformation | function | 仅发现/枚举 | `Workbook.RemoveDocumentInformation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | RemovePersonalInformation | boolean | 仅发现/枚举 | 读取 `Workbook.RemovePersonalInformation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | RemoveUser | function | 仅发现/枚举 | `Workbook.RemoveUser(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Reply | function | 仅发现/枚举 | `Workbook.Reply(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | ReplyAll | function | 仅发现/枚举 | `Workbook.ReplyAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | ReplyWithChanges | function | 仅发现/枚举 | `Workbook.ReplyWithChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Research | object | 仅发现/枚举 | 读取 `Workbook.Research`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ResetColors | function | 仅发现/枚举 | `Workbook.ResetColors(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | RevisionNumber | number | 仅发现/枚举 | 读取 `Workbook.RevisionNumber`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Route | function | 仅发现/枚举 | `Workbook.Route(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Routed | boolean | 仅发现/枚举 | 读取 `Workbook.Routed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | RoutingSlip | object | 仅发现/枚举 | 读取 `Workbook.RoutingSlip`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | RunAutoMacros | function | 仅发现/枚举 | `Workbook.RunAutoMacros(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Save | function | 仅发现/枚举 | `Workbook.Save(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | SaveAs | function | 仅发现/枚举 | `Workbook.SaveAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | SaveAsBinaryString | function | 仅发现/枚举 | `Workbook.SaveAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | SaveAsUrl | function | 仅发现/枚举 | `Workbook.SaveAsUrl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | SaveAsXMLData | function | 仅发现/枚举 | `Workbook.SaveAsXMLData(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | SaveCopyAs | function | 仅发现/枚举 | `Workbook.SaveCopyAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Saved | boolean | 仅发现/枚举 | 读取 `Workbook.Saved`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | SaveLinkValues | boolean | 仅发现/枚举 | 读取 `Workbook.SaveLinkValues`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | sblt | function | 仅发现/枚举 | `Workbook.sblt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | SendFaxOverInternet | function | 仅发现/枚举 | `Workbook.SendFaxOverInternet(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | SendForReview | function | 仅发现/枚举 | `Workbook.SendForReview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | SendMail | function | 仅发现/枚举 | `Workbook.SendMail(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | SendMailer | function | 仅发现/枚举 | `Workbook.SendMailer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | ServerPolicy | object | 仅发现/枚举 | 读取 `Workbook.ServerPolicy`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ServerViewableItems | object | 仅发现/枚举 | 读取 `Workbook.ServerViewableItems`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | SetLinkOnData | function | 仅发现/枚举 | `Workbook.SetLinkOnData(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | SetPasswordEncryptionOptions | function | 仅发现/枚举 | `Workbook.SetPasswordEncryptionOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | SharedWorkspace | object | 仅发现/枚举 | 读取 `Workbook.SharedWorkspace`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Sheets | object | 仅发现/枚举 | 读取 `Workbook.Sheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ShowConflictHistory | boolean | 仅发现/枚举 | 读取 `Workbook.ShowConflictHistory`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ShowPivotChartActiveFields | boolean | 仅发现/枚举 | 读取 `Workbook.ShowPivotChartActiveFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ShowPivotTableFieldList | boolean | 仅发现/枚举 | 读取 `Workbook.ShowPivotTableFieldList`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Signatures | object | 仅发现/枚举 | 读取 `Workbook.Signatures`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | SlicerCaches | object | 仅发现/枚举 | 读取 `Workbook.SlicerCaches`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | SmartDocument | object | 仅发现/枚举 | 读取 `Workbook.SmartDocument`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | SmartTagOptions | object | 仅发现/枚举 | 读取 `Workbook.SmartTagOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Styles | object | 仅发现/枚举 | 读取 `Workbook.Styles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Subject | string | 仅发现/枚举 | 读取 `Workbook.Subject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Sync | object | 仅发现/枚举 | 读取 `Workbook.Sync`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | TableStyles | object | 仅发现/枚举 | 读取 `Workbook.TableStyles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | TemplateRemoveExtData | boolean | 仅发现/枚举 | 读取 `Workbook.TemplateRemoveExtData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Theme | object | 仅发现/枚举 | 读取 `Workbook.Theme`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Title | string | 仅发现/枚举 | 读取 `Workbook.Title`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | ToggleFormsDesign | function | 仅发现/枚举 | `Workbook.ToggleFormsDesign(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Unprotect | function | 仅发现/枚举 | `Workbook.Unprotect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | UnprotectSharing | function | 仅发现/枚举 | `Workbook.UnprotectSharing(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | UpdateFromFile | function | 仅发现/枚举 | `Workbook.UpdateFromFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | UpdateLink | function | 仅发现/枚举 | `Workbook.UpdateLink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | UpdateLinks | number | 仅发现/枚举 | 读取 `Workbook.UpdateLinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | UpdateRemoteReferences | boolean | 仅发现/枚举 | 读取 `Workbook.UpdateRemoteReferences`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | UserControl | boolean | 仅发现/枚举 | 读取 `Workbook.UserControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | UserStatus | object | 仅发现/枚举 | 读取 `Workbook.UserStatus`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | UseWholeCellCriteria | boolean | 仅发现/枚举 | 读取 `Workbook.UseWholeCellCriteria`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | UseWildcards | boolean | 仅发现/枚举 | 读取 `Workbook.UseWildcards`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | VBASigned | boolean | 仅发现/枚举 | 读取 `Workbook.VBASigned`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | WebOptions | object | 仅发现/枚举 | 读取 `Workbook.WebOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | WebPagePreview | function | 仅发现/枚举 | `Workbook.WebPagePreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | Windows | object | 仅发现/枚举 | 读取 `Workbook.Windows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | Worksheets | object | 仅发现/枚举 | 读取 `Workbook.Worksheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | WritePassword | string | 仅发现/枚举 | 读取 `Workbook.WritePassword`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | WriteReserved | boolean | 仅发现/枚举 | 读取 `Workbook.WriteReserved`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | WriteReservedBy | string | 仅发现/枚举 | 读取 `Workbook.WriteReservedBy`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | XmlImport | function | 仅发现/枚举 | `Workbook.XmlImport(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | XmlImportXml | function | 仅发现/枚举 | `Workbook.XmlImportXml(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Workbook | XmlMaps | object | 仅发现/枚举 | 读取 `Workbook.XmlMaps`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Workbook | XmlNamespaces | object | 仅发现/枚举 | 读取 `Workbook.XmlNamespaces`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | __PrintOut | function | 仅发现/枚举 | `Worksheet.__PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | _CheckSpelling | function | 仅发现/枚举 | `Worksheet._CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | _CodeName | string | 仅发现/枚举 | 读取 `Worksheet._CodeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | _DisplayRightToLeft | number | 仅发现/枚举 | 读取 `Worksheet._DisplayRightToLeft`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | _Evaluate | function | 仅发现/枚举 | `Worksheet._Evaluate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | _PasteSpecial | function | 仅发现/枚举 | `Worksheet._PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | _PrintOut | function | 仅发现/枚举 | `Worksheet._PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | _Protect | function | 仅发现/枚举 | `Worksheet._Protect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | _SaveAs | function | 仅发现/枚举 | `Worksheet._SaveAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Activate | function | 仅发现/枚举 | `Worksheet.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Application | object | 仅发现/枚举 | 读取 `Worksheet.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Arcs | function | 仅发现/枚举 | `Worksheet.Arcs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | AutoFilter | null | 仅发现/枚举 | 读取 `Worksheet.AutoFilter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | AutoFilterMode | boolean | 仅发现/枚举 | 读取 `Worksheet.AutoFilterMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Buttons | function | 仅发现/枚举 | `Worksheet.Buttons(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Calculate | function | 仅发现/枚举 | `Worksheet.Calculate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Cells | object | 仅发现/枚举 | 读取 `Worksheet.Cells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | ChartObjects | function | 仅发现/枚举 | `Worksheet.ChartObjects(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | CheckBoxes | function | 仅发现/枚举 | `Worksheet.CheckBoxes(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | CheckSpelling | function | 仅发现/枚举 | `Worksheet.CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | CircleInvalid | function | 仅发现/枚举 | `Worksheet.CircleInvalid(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | CircularReference | null | 仅发现/枚举 | 读取 `Worksheet.CircularReference`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | ClearArrows | function | 仅发现/枚举 | `Worksheet.ClearArrows(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | ClearCircles | function | 仅发现/枚举 | `Worksheet.ClearCircles(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | CodeName | string | 仅发现/枚举 | 读取 `Worksheet.CodeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Columns | object | 仅发现/枚举 | 读取 `Worksheet.Columns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Comments | object | 仅发现/枚举 | 读取 `Worksheet.Comments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | ConsolidationFunction | number | 仅发现/枚举 | 读取 `Worksheet.ConsolidationFunction`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | ConsolidationOptions | object | 仅发现/枚举 | 读取 `Worksheet.ConsolidationOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | ConsolidationSources | null | 仅发现/枚举 | 读取 `Worksheet.ConsolidationSources`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Copy | function | 仅发现/枚举 | `Worksheet.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Creator | number | 仅发现/枚举 | 读取 `Worksheet.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | CustomProperties | object | 仅发现/枚举 | 读取 `Worksheet.CustomProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Delete | function | 仅发现/枚举 | `Worksheet.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | DisplayAutomaticPageBreaks | boolean | 仅发现/枚举 | 读取 `Worksheet.DisplayAutomaticPageBreaks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | DisplayPageBreaks | boolean | 仅发现/枚举 | 读取 `Worksheet.DisplayPageBreaks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | DisplayRightToLeft | boolean | 仅发现/枚举 | 读取 `Worksheet.DisplayRightToLeft`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | DrawingObjects | function | 仅发现/枚举 | `Worksheet.DrawingObjects(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Drawings | function | 仅发现/枚举 | `Worksheet.Drawings(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | DropDowns | function | 仅发现/枚举 | `Worksheet.DropDowns(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | EnableAutoFilter | boolean | 仅发现/枚举 | 读取 `Worksheet.EnableAutoFilter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | EnableCalculation | boolean | 仅发现/枚举 | 读取 `Worksheet.EnableCalculation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | EnableFormatConditionsCalculation | boolean | 仅发现/枚举 | 读取 `Worksheet.EnableFormatConditionsCalculation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | EnableOutlining | boolean | 仅发现/枚举 | 读取 `Worksheet.EnableOutlining`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | EnablePivotTable | boolean | 仅发现/枚举 | 读取 `Worksheet.EnablePivotTable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | EnableSelection | number | 仅发现/枚举 | 读取 `Worksheet.EnableSelection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Evaluate | function | 仅发现/枚举 | `Worksheet.Evaluate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | ExportAsFixedFormat | function | 仅发现/枚举 | `Worksheet.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | ExportToPNG | function | 仅发现/枚举 | `Worksheet.ExportToPNG(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | FilterMode | boolean | 仅发现/枚举 | 读取 `Worksheet.FilterMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | GroupBoxes | function | 仅发现/枚举 | `Worksheet.GroupBoxes(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | GroupObjects | function | 仅发现/枚举 | `Worksheet.GroupObjects(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | HPageBreaks | object | 仅发现/枚举 | 读取 `Worksheet.HPageBreaks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Hyperlinks | object | 仅发现/枚举 | 读取 `Worksheet.Hyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Index | number | 仅发现/枚举 | 读取 `Worksheet.Index`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Labels | function | 仅发现/枚举 | `Worksheet.Labels(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Lines | function | 仅发现/枚举 | `Worksheet.Lines(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | ListBoxes | function | 仅发现/枚举 | `Worksheet.ListBoxes(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | ListObjects | object | 仅发现/枚举 | 读取 `Worksheet.ListObjects`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | MailEnvelope | object | 仅发现/枚举 | 读取 `Worksheet.MailEnvelope`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Move | function | 仅发现/枚举 | `Worksheet.Move(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Name | string | 仅发现/枚举 | 读取 `Worksheet.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Names | object | 仅发现/枚举 | 读取 `Worksheet.Names`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Next | null | 仅发现/枚举 | 读取 `Worksheet.Next`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | OLEObjects | function | 仅发现/枚举 | `Worksheet.OLEObjects(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | OnCalculate | string | 仅发现/枚举 | 读取 `Worksheet.OnCalculate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | OnData | string | 仅发现/枚举 | 读取 `Worksheet.OnData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | OnDoubleClick | string | 仅发现/枚举 | 读取 `Worksheet.OnDoubleClick`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | OnEntry | string | 仅发现/枚举 | 读取 `Worksheet.OnEntry`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | OnSheetActivate | string | 仅发现/枚举 | 读取 `Worksheet.OnSheetActivate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | OnSheetDeactivate | string | 仅发现/枚举 | 读取 `Worksheet.OnSheetDeactivate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | OptionButtons | function | 仅发现/枚举 | `Worksheet.OptionButtons(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Outline | object | 仅发现/枚举 | 读取 `Worksheet.Outline`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Ovals | function | 仅发现/枚举 | `Worksheet.Ovals(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | PageSetup | object | 仅发现/枚举 | 读取 `Worksheet.PageSetup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Parent | object | 仅发现/枚举 | 读取 `Worksheet.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Paste | function | 仅发现/枚举 | `Worksheet.Paste(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | PasteSpecial | function | 仅发现/枚举 | `Worksheet.PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Pictures | function | 仅发现/枚举 | `Worksheet.Pictures(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | PivotTables | function | 仅发现/枚举 | `Worksheet.PivotTables(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | PivotTableWizard | function | 仅发现/枚举 | `Worksheet.PivotTableWizard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Previous | null | 仅发现/枚举 | 读取 `Worksheet.Previous`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | PrintedCommentPages | number | 仅发现/枚举 | 读取 `Worksheet.PrintedCommentPages`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | PrintOut | function | 仅发现/枚举 | `Worksheet.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | PrintPreview | function | 仅发现/枚举 | `Worksheet.PrintPreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Protect | function | 仅发现/枚举 | `Worksheet.Protect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | ProtectContents | boolean | 仅发现/枚举 | 读取 `Worksheet.ProtectContents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | ProtectDrawingObjects | boolean | 仅发现/枚举 | 读取 `Worksheet.ProtectDrawingObjects`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Protection | object | 仅发现/枚举 | 读取 `Worksheet.Protection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | ProtectionMode | boolean | 仅发现/枚举 | 读取 `Worksheet.ProtectionMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | ProtectScenarios | boolean | 仅发现/枚举 | 读取 `Worksheet.ProtectScenarios`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | QueryTables | object | 仅发现/枚举 | 读取 `Worksheet.QueryTables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Range | function | 仅发现/枚举 | `Worksheet.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Rectangles | function | 仅发现/枚举 | `Worksheet.Rectangles(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | ResetAllPageBreaks | function | 仅发现/枚举 | `Worksheet.ResetAllPageBreaks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Rows | object | 仅发现/枚举 | 读取 `Worksheet.Rows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | SaveAs | function | 仅发现/枚举 | `Worksheet.SaveAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Scenarios | function | 仅发现/枚举 | `Worksheet.Scenarios(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Scripts | object | 仅发现/枚举 | 读取 `Worksheet.Scripts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | ScrollArea | string | 仅发现/枚举 | 读取 `Worksheet.ScrollArea`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | ScrollBars | function | 仅发现/枚举 | `Worksheet.ScrollBars(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Select | function | 仅发现/枚举 | `Worksheet.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | SetBackgroundPicture | function | 仅发现/枚举 | `Worksheet.SetBackgroundPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | Shapes | object | 仅发现/枚举 | 读取 `Worksheet.Shapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | ShowAllData | function | 仅发现/枚举 | `Worksheet.ShowAllData(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | ShowDataForm | function | 仅发现/枚举 | `Worksheet.ShowDataForm(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | SmartTags | object | 仅发现/枚举 | 读取 `Worksheet.SmartTags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Sort | object | 仅发现/枚举 | 读取 `Worksheet.Sort`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Spinners | function | 仅发现/枚举 | `Worksheet.Spinners(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | StandardHeight | number | 仅发现/枚举 | 读取 `Worksheet.StandardHeight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | StandardWidth | number | 仅发现/枚举 | 读取 `Worksheet.StandardWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Tab | object | 仅发现/枚举 | 读取 `Worksheet.Tab`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | TextBoxes | function | 仅发现/枚举 | `Worksheet.TextBoxes(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | TransitionExpEval | boolean | 仅发现/枚举 | 读取 `Worksheet.TransitionExpEval`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | TransitionFormEntry | boolean | 仅发现/枚举 | 读取 `Worksheet.TransitionFormEntry`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Type | number | 仅发现/枚举 | 读取 `Worksheet.Type`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Unprotect | function | 仅发现/枚举 | `Worksheet.Unprotect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | UsedRange | object | 仅发现/枚举 | 读取 `Worksheet.UsedRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | Visible | number | 仅发现/枚举 | 读取 `Worksheet.Visible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | VPageBreaks | object | 仅发现/枚举 | 读取 `Worksheet.VPageBreaks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | WorksheetEx | object | 仅发现/枚举 | 读取 `Worksheet.WorksheetEx`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheet | XmlDataQuery | function | 仅发现/枚举 | `Worksheet.XmlDataQuery(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheet | XmlMapQuery | function | 仅发现/枚举 | `Worksheet.XmlMapQuery(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | __PrintOut | function | 仅发现/枚举 | `Worksheets.__PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | _Default | function | 仅发现/枚举 | `Worksheets._Default(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | _PrintOut | function | 仅发现/枚举 | `Worksheets._PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | Add | function | 仅发现/枚举 | `Worksheets.Add(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | Add2 | function | 仅发现/枚举 | `Worksheets.Add2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | Application | object | 仅发现/枚举 | 读取 `Worksheets.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheets | Copy | function | 仅发现/枚举 | `Worksheets.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | Count | number | 仅发现/枚举 | 读取 `Worksheets.Count`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheets | Creator | number | 仅发现/枚举 | 读取 `Worksheets.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheets | Delete | function | 仅发现/枚举 | `Worksheets.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | FillAcrossSheets | function | 仅发现/枚举 | `Worksheets.FillAcrossSheets(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | HPageBreaks | object | 仅发现/枚举 | 读取 `Worksheets.HPageBreaks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheets | Item | function | 仅发现/枚举 | `Worksheets.Item(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | Move | function | 仅发现/枚举 | `Worksheets.Move(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | Parent | object | 仅发现/枚举 | 读取 `Worksheets.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheets | PrintOut | function | 仅发现/枚举 | `Worksheets.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | PrintPreview | function | 仅发现/枚举 | `Worksheets.PrintPreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | Select | function | 仅发现/枚举 | `Worksheets.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Spreadsheet / ET | Worksheets | Visible | null | 仅发现/枚举 | 读取 `Worksheets.Visible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Spreadsheet / ET | Worksheets | VPageBreaks | object | 仅发现/枚举 | 读取 `Worksheets.VPageBreaks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | ApiEvent | AddApiEventListener | function | 有同名显式探测；详情看宿主章节 | `ApiEvent.AddApiEventListener(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | ApiEvent | Cancel | boolean | 仅发现/枚举 | 读取 `ApiEvent.Cancel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | ApiEvent | RemoveApiEventListener | function | 有同名显式探测；详情看宿主章节 | `ApiEvent.RemoveApiEventListener(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | ApiEvent | RightsInfo | number | 仅发现/枚举 | 读取 `ApiEvent.RightsInfo`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Activate | function | 有同名显式探测；详情看宿主章节 | `Application.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ActivatePromeBrowserPage | function | 仅发现/枚举 | `Application.ActivatePromeBrowserPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ActiveDocument | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.ActiveDocument`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ActiveEncryptionSession | number | 仅发现/枚举 | 读取 `Application.ActiveEncryptionSession`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ActiveMainWindow | object | 仅发现/枚举 | 读取 `Application.ActiveMainWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ActivePrinter | string | 仅发现/枚举 | 读取 `Application.ActivePrinter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ActiveProtectedViewWindow | null | 仅发现/枚举 | 读取 `Application.ActiveProtectedViewWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ActiveWindow | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.ActiveWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | AddAddress | function | 仅发现/枚举 | `Application.AddAddress(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | AddIns | object | 仅发现/枚举 | 读取 `Application.AddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | alert | function | 仅发现/枚举 | `Application.alert(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | AnswerWizard | object | 仅发现/枚举 | 读取 `Application.AnswerWizard`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ApiEvent | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.ApiEvent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Application | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ArbitraryXMLSupportAvailable | boolean | 仅发现/枚举 | 读取 `Application.ArbitraryXMLSupportAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Arg2Json | function | 仅发现/枚举 | `Application.Arg2Json(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | Assistance | object | 仅发现/枚举 | 读取 `Application.Assistance`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Assistant | object | 仅发现/枚举 | 读取 `Application.Assistant`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | AutoCaptions | object | 仅发现/枚举 | 读取 `Application.AutoCaptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | AutoCorrect | object | 仅发现/枚举 | 读取 `Application.AutoCorrect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | AutoCorrectEmail | object | 仅发现/枚举 | 读取 `Application.AutoCorrectEmail`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | AutomaticChange | function | 仅发现/枚举 | `Application.AutomaticChange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | AutomationSecurity | number | 仅发现/枚举 | 读取 `Application.AutomationSecurity`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | BackgroundPrintingStatus | number | 仅发现/枚举 | 读取 `Application.BackgroundPrintingStatus`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | BackgroundSavingStatus | number | 仅发现/枚举 | 读取 `Application.BackgroundSavingStatus`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Bibliography | object | 仅发现/枚举 | 读取 `Application.Bibliography`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | BrowseExtraFileTypes | string | 仅发现/枚举 | 读取 `Application.BrowseExtraFileTypes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Browser | object | 仅发现/枚举 | 读取 `Application.Browser`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | BrowserGroups | object | 仅发现/枚举 | 读取 `Application.BrowserGroups`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Build | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Build`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | BuildFeatureCrew | string | 仅发现/枚举 | 读取 `Application.BuildFeatureCrew`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | BuildFull | string | 仅发现/枚举 | 读取 `Application.BuildFull`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | BuildKeyCode | function | 仅发现/枚举 | `Application.BuildKeyCode(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | CapsLock | boolean | 仅发现/枚举 | 读取 `Application.CapsLock`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Caption | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Caption`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | CaptionLabels | object | 仅发现/枚举 | 读取 `Application.CaptionLabels`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | CentimetersToPoints | function | 仅发现/枚举 | `Application.CentimetersToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ChangeFileOpenDirectory | function | 仅发现/枚举 | `Application.ChangeFileOpenDirectory(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ChartDataPointTrack | boolean | 仅发现/枚举 | 读取 `Application.ChartDataPointTrack`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | CheckGrammar | function | 仅发现/枚举 | `Application.CheckGrammar(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | CheckLanguage | boolean | 仅发现/枚举 | 读取 `Application.CheckLanguage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | CheckSpelling | function | 仅发现/枚举 | `Application.CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | CleanString | function | 仅发现/枚举 | `Application.CleanString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | COMAddIns | null | 有同名显式探测；详情看宿主章节 | 读取 `Application.COMAddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | CommandBars | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.CommandBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | CompareDocuments | function | 仅发现/枚举 | `Application.CompareDocuments(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | Compress | object | 仅发现/枚举 | 读取 `Application.Compress`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | confirm | function | 仅发现/枚举 | `Application.confirm(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | CreateDataBuffer | function | 仅发现/枚举 | `Application.CreateDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | CreateObject | function | 仅发现/枚举 | `Application.CreateObject(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | CreatePromeBrowserPage | function | 仅发现/枚举 | `Application.CreatePromeBrowserPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | CreatePromeFakeTab | function | 仅发现/枚举 | `Application.CreatePromeFakeTab(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | CreateTaskPane | function | 有同名显式探测；详情看宿主章节 | `Application.CreateTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | CreateWebDialog | function | 有同名显式探测；详情看宿主章节 | `Application.CreateWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | Creator | number | 仅发现/枚举 | 读取 `Application.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | CurrentWPSAddIn | object | 仅发现/枚举 | 读取 `Application.CurrentWPSAddIn`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | CustomDictionaries | object | 仅发现/枚举 | 读取 `Application.CustomDictionaries`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | CustomDomain | string | 仅发现/枚举 | 读取 `Application.CustomDomain`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | CustomizationContext | object | 仅发现/枚举 | 读取 `Application.CustomizationContext`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | DDEExecute | function | 仅发现/枚举 | `Application.DDEExecute(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | DDEInitiate | function | 仅发现/枚举 | `Application.DDEInitiate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | DDEPoke | function | 仅发现/枚举 | `Application.DDEPoke(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | DDERequest | function | 仅发现/枚举 | `Application.DDERequest(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | DDETerminate | function | 仅发现/枚举 | `Application.DDETerminate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | DDETerminateAll | function | 仅发现/枚举 | `Application.DDETerminateAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | DefaultLegalBlackline | boolean | 仅发现/枚举 | 读取 `Application.DefaultLegalBlackline`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | DefaultSaveFormat | string | 仅发现/枚举 | 读取 `Application.DefaultSaveFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | DefaultTableSeparator | string | 仅发现/枚举 | 读取 `Application.DefaultTableSeparator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | DefaultWebOptions | function | 仅发现/枚举 | `Application.DefaultWebOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | DeleteDataBuffer | function | 仅发现/枚举 | `Application.DeleteDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | Dialogs | object | 仅发现/枚举 | 读取 `Application.Dialogs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | DisableBackup | boolean | 仅发现/枚举 | 读取 `Application.DisableBackup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | DiscussionSupport | function | 仅发现/枚举 | `Application.DiscussionSupport(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | DisplayAlerts | number | 有同名显式探测；详情看宿主章节 | 读取 `Application.DisplayAlerts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | DisplayAutoCompleteTips | boolean | 仅发现/枚举 | 读取 `Application.DisplayAutoCompleteTips`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | DisplayDocumentInformationPanel | boolean | 仅发现/枚举 | 读取 `Application.DisplayDocumentInformationPanel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | DisplayRecentFiles | boolean | 仅发现/枚举 | 读取 `Application.DisplayRecentFiles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | DisplayScreenTips | boolean | 仅发现/枚举 | 读取 `Application.DisplayScreenTips`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | DisplayScrollBars | boolean | 仅发现/枚举 | 读取 `Application.DisplayScrollBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | DisplayStatusBar | boolean | 仅发现/枚举 | 读取 `Application.DisplayStatusBar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Documents | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Documents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | DontResetInsertionPointProperties | boolean | 仅发现/枚举 | 读取 `Application.DontResetInsertionPointProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Dummy1 | boolean | 仅发现/枚举 | 读取 `Application.Dummy1`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Dummy2 | function | 仅发现/枚举 | `Application.Dummy2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | Dummy4 | function | 仅发现/枚举 | `Application.Dummy4(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | EmailOptions | object | 仅发现/枚举 | 读取 `Application.EmailOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | EmailTemplate | string | 仅发现/枚举 | 读取 `Application.EmailTemplate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | EnableCancelKey | number | 仅发现/枚举 | 读取 `Application.EnableCancelKey`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Enum | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Enum`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Env | object | 仅发现/枚举 | 读取 `Application.Env`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ExecFunc | function | 仅发现/枚举 | `Application.ExecFunc(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | FeatureInstall | number | 仅发现/枚举 | 读取 `Application.FeatureInstall`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | FileConverters | null | 仅发现/枚举 | 读取 `Application.FileConverters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | FileDialog | function | 有同名显式探测；详情看宿主章节 | `Application.FileDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | FileSearch | object | 仅发现/枚举 | 读取 `Application.FileSearch`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | FileSystem | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.FileSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | FileValidation | number | 仅发现/枚举 | 读取 `Application.FileValidation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | FindKey | function | 仅发现/枚举 | `Application.FindKey(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | FocusInMailHeader | boolean | 仅发现/枚举 | 读取 `Application.FocusInMailHeader`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | FontNames | object | 仅发现/枚举 | 读取 `Application.FontNames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | GetAddress | function | 仅发现/枚举 | `Application.GetAddress(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | GetApplicationEx | function | 仅发现/枚举 | `Application.GetApplicationEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | GetDataBuffer | function | 仅发现/枚举 | `Application.GetDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | GetDefaultTheme | function | 仅发现/枚举 | `Application.GetDefaultTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | GetJSReturnValue | function | 仅发现/枚举 | `Application.GetJSReturnValue(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | GetPrintersList | function | 仅发现/枚举 | `Application.GetPrintersList(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | GetSpellingSuggestions | function | 仅发现/枚举 | `Application.GetSpellingSuggestions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | GetTaskPane | function | 有同名显式探测；详情看宿主章节 | `Application.GetTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | GetWebDialog | function | 有同名显式探测；详情看宿主章节 | `Application.GetWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | GoBack | function | 仅发现/枚举 | `Application.GoBack(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | GoForward | function | 仅发现/枚举 | `Application.GoForward(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | HangulHanjaDictionaries | null | 仅发现/枚举 | 读取 `Application.HangulHanjaDictionaries`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Height | number | 仅发现/枚举 | 读取 `Application.Height`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Help | function | 仅发现/枚举 | `Application.Help(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | HelpTool | function | 仅发现/枚举 | `Application.HelpTool(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | InchesToPoints | function | 仅发现/枚举 | `Application.InchesToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | InfoCollect | object | 仅发现/枚举 | 读取 `Application.InfoCollect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | International | function | 仅发现/枚举 | `Application.International(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | IsLastIOBroken | number | 仅发现/枚举 | 读取 `Application.IsLastIOBroken`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | IsObjectValid | function | 仅发现/枚举 | `Application.IsObjectValid(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | IsSandboxed | boolean | 仅发现/枚举 | 读取 `Application.IsSandboxed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | JS2Variant | function | 仅发现/枚举 | `Application.JS2Variant(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | JSIDE | null | 仅发现/枚举 | 读取 `Application.JSIDE`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | KeyBindings | object | 仅发现/枚举 | 读取 `Application.KeyBindings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Keyboard | function | 仅发现/枚举 | `Application.Keyboard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | KeyboardBidi | function | 仅发现/枚举 | `Application.KeyboardBidi(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | KeyboardLatin | function | 仅发现/枚举 | `Application.KeyboardLatin(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | KeysBoundTo | function | 仅发现/枚举 | `Application.KeysBoundTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | KeyString | function | 仅发现/枚举 | `Application.KeyString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | LandscapeFontNames | object | 仅发现/枚举 | 读取 `Application.LandscapeFontNames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Language | number | 仅发现/枚举 | 读取 `Application.Language`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Languages | null | 仅发现/枚举 | 读取 `Application.Languages`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | LanguageSettings | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.LanguageSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Left | number | 仅发现/枚举 | 读取 `Application.Left`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | LinesToPoints | function | 仅发现/枚举 | `Application.LinesToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ListCommands | function | 仅发现/枚举 | `Application.ListCommands(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ListGalleries | object | 仅发现/枚举 | 读取 `Application.ListGalleries`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | LoadMasterList | function | 仅发现/枚举 | `Application.LoadMasterList(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | LookupNameProperties | function | 仅发现/枚举 | `Application.LookupNameProperties(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | MacroContainer | null | 仅发现/枚举 | 读取 `Application.MacroContainer`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | MailingLabel | object | 仅发现/枚举 | 读取 `Application.MailingLabel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | MailMessage | object | 仅发现/枚举 | 读取 `Application.MailMessage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | MailSystem | number | 仅发现/枚举 | 读取 `Application.MailSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | MainWindows | object | 仅发现/枚举 | 读取 `Application.MainWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | MAPIAvailable | boolean | 仅发现/枚举 | 读取 `Application.MAPIAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | MathCoprocessorAvailable | boolean | 仅发现/枚举 | 读取 `Application.MathCoprocessorAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | MergeDocuments | function | 仅发现/枚举 | `Application.MergeDocuments(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | MillimetersToPoints | function | 仅发现/枚举 | `Application.MillimetersToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | MountVolume | function | 仅发现/枚举 | `Application.MountVolume(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | MouseAvailable | boolean | 仅发现/枚举 | 读取 `Application.MouseAvailable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Move | function | 仅发现/枚举 | `Application.Move(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | Name | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | NewDocument | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.NewDocument`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | NewEnum | object | 仅发现/枚举 | 读取 `Application.NewEnum`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | NewWindow | function | 仅发现/枚举 | `Application.NewWindow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | NextLetter | function | 仅发现/枚举 | `Application.NextLetter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | NormalTemplate | object | 仅发现/枚举 | 读取 `Application.NormalTemplate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | NumLock | boolean | 仅发现/枚举 | 读取 `Application.NumLock`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | OAAssist | object | 仅发现/枚举 | 读取 `Application.OAAssist`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | OfdExportOptions | object | 仅发现/枚举 | 读取 `Application.OfdExportOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Office | object | 仅发现/枚举 | 读取 `Application.Office`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | OMathAutoCorrect | object | 仅发现/枚举 | 读取 `Application.OMathAutoCorrect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | OnTime | function | 有同名显式探测；详情看宿主章节 | `Application.OnTime(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | OpenAttachmentsInFullScreen | boolean | 仅发现/枚举 | 读取 `Application.OpenAttachmentsInFullScreen`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | OpenFileLocationInStartPage | function | 仅发现/枚举 | `Application.OpenFileLocationInStartPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | OpenWebUrl | function | 仅发现/枚举 | `Application.OpenWebUrl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | Options | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Options`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | OrganizerCopy | function | 仅发现/枚举 | `Application.OrganizerCopy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | OrganizerDelete | function | 仅发现/枚举 | `Application.OrganizerDelete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | OrganizerRename | function | 仅发现/枚举 | `Application.OrganizerRename(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | Parent | object | 仅发现/枚举 | 读取 `Application.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Path | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Path`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | PathSeparator | string | 仅发现/枚举 | 读取 `Application.PathSeparator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | PdfExportOptions | object | 仅发现/枚举 | 读取 `Application.PdfExportOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | PicasToPoints | function | 仅发现/枚举 | `Application.PicasToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PickerDialog | object | 仅发现/枚举 | 读取 `Application.PickerDialog`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | PixelsToPoints | function | 仅发现/枚举 | `Application.PixelsToPoints(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PluginStorage | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.PluginStorage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | PointsToCentimeters | function | 仅发现/枚举 | `Application.PointsToCentimeters(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PointsToInches | function | 仅发现/枚举 | `Application.PointsToInches(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PointsToLines | function | 仅发现/枚举 | `Application.PointsToLines(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PointsToMillimeters | function | 仅发现/枚举 | `Application.PointsToMillimeters(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PointsToPicas | function | 仅发现/枚举 | `Application.PointsToPicas(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PointsToPixels | function | 仅发现/枚举 | `Application.PointsToPixels(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PortraitFontNames | object | 仅发现/枚举 | 读取 `Application.PortraitFontNames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | PrintOut | function | 仅发现/枚举 | `Application.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PrintOut2000 | function | 仅发现/枚举 | `Application.PrintOut2000(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PrintOutOld | function | 仅发现/枚举 | `Application.PrintOutOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PrintPreview | boolean | 仅发现/枚举 | 读取 `Application.PrintPreview`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ProductCode | function | 仅发现/枚举 | `Application.ProductCode(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PromeAddPage | function | 仅发现/枚举 | `Application.PromeAddPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PromeName | string | 仅发现/枚举 | 读取 `Application.PromeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | PromeNewDocument | function | 仅发现/枚举 | `Application.PromeNewDocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | PromeTidyModeChange | function | 仅发现/枚举 | `Application.PromeTidyModeChange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | prompt | function | 仅发现/枚举 | `Application.prompt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ProtectedViewWindows | object | 仅发现/枚举 | 读取 `Application.ProtectedViewWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ProtectEyes | boolean | 仅发现/枚举 | 读取 `Application.ProtectEyes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | PutFocusInMailHeader | function | 仅发现/枚举 | `Application.PutFocusInMailHeader(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | Quit | function | 有同名显式探测；详情看宿主章节 | `Application.Quit(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | RecentFiles | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.RecentFiles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Repeat | function | 仅发现/枚举 | `Application.Repeat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ResetIgnoreAll | function | 仅发现/枚举 | `Application.ResetIgnoreAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | Resize | function | 仅发现/枚举 | `Application.Resize(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | RestrictLinkedStyles | boolean | 仅发现/枚举 | 读取 `Application.RestrictLinkedStyles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ribbonUI | object | 仅发现/枚举 | 读取 `Application.ribbonUI`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Run | function | 有同名显式探测；详情看宿主章节 | `Application.Run(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | RunOld | function | 仅发现/枚举 | `Application.RunOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ScreenRefresh | function | 仅发现/枚举 | `Application.ScreenRefresh(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ScreenUpdating | boolean | 有同名显式探测；详情看宿主章节 | 读取 `Application.ScreenUpdating`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Selection | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Selection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | SendFax | function | 仅发现/枚举 | `Application.SendFax(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | SetDefaultTheme | function | 仅发现/枚举 | `Application.SetDefaultTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ShowAnimation | boolean | 仅发现/枚举 | 读取 `Application.ShowAnimation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ShowClipboard | function | 仅发现/枚举 | `Application.ShowClipboard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ShowDialog | function | 有同名显式探测；详情看宿主章节 | `Application.ShowDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ShowDialogEx | function | 仅发现/枚举 | `Application.ShowDialogEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ShowExceptionError | function | 仅发现/枚举 | `Application.ShowExceptionError(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ShowMe | function | 仅发现/枚举 | `Application.ShowMe(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ShowStartupDialog | boolean | 仅发现/枚举 | 读取 `Application.ShowStartupDialog`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ShowStylePreviews | boolean | 仅发现/枚举 | 读取 `Application.ShowStylePreviews`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ShowVisualBasicEditor | boolean | 仅发现/枚举 | 读取 `Application.ShowVisualBasicEditor`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ShowWindowsInTaskbar | boolean | 仅发现/枚举 | 读取 `Application.ShowWindowsInTaskbar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | SmartArtColors | object | 仅发现/枚举 | 读取 `Application.SmartArtColors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | SmartArtLayouts | object | 仅发现/枚举 | 读取 `Application.SmartArtLayouts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | SmartArtQuickStyles | object | 仅发现/枚举 | 读取 `Application.SmartArtQuickStyles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | SmartTagRecognizers | object | 仅发现/枚举 | 读取 `Application.SmartTagRecognizers`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | SmartTagTypes | object | 仅发现/枚举 | 读取 `Application.SmartTagTypes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | SpecialMode | boolean | 仅发现/枚举 | 读取 `Application.SpecialMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | StartAccess | function | 仅发现/枚举 | `Application.StartAccess(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | StartupPath | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.StartupPath`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | StatusBar | null | 有同名显式探测；详情看宿主章节 | 读取 `Application.StatusBar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | SubstituteFont | function | 仅发现/枚举 | `Application.SubstituteFont(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | SynonymInfo | function | 仅发现/枚举 | `Application.SynonymInfo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | System | object | 仅发现/枚举 | 读取 `Application.System`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | TabPages | object | 仅发现/枚举 | 读取 `Application.TabPages`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | TaskPanes | object | 仅发现/枚举 | 读取 `Application.TaskPanes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | TaskPanesEx | object | 仅发现/枚举 | 读取 `Application.TaskPanesEx`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Tasks | object | 仅发现/枚举 | 读取 `Application.Tasks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Templates | object | 仅发现/枚举 | 读取 `Application.Templates`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ThisBrowser | object | 仅发现/枚举 | 读取 `Application.ThisBrowser`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | ThreeWayMerge | function | 仅发现/枚举 | `Application.ThreeWayMerge(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | ToggleKeyboard | function | 仅发现/枚举 | `Application.ToggleKeyboard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | Top | number | 仅发现/枚举 | 读取 `Application.Top`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | UndoRecord | object | 仅发现/枚举 | 读取 `Application.UndoRecord`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | UpdateRibbon | function | 有同名显式探测；详情看宿主章节 | `Application.UpdateRibbon(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | UsableHeight | number | 仅发现/枚举 | 读取 `Application.UsableHeight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | UsableWidth | number | 仅发现/枚举 | 读取 `Application.UsableWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | UserAddress | string | 仅发现/枚举 | 读取 `Application.UserAddress`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | UserControl | boolean | 仅发现/枚举 | 读取 `Application.UserControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | UserInitials | string | 仅发现/枚举 | 读取 `Application.UserInitials`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | UserName | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.UserName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Version | string | 有同名显式探测；详情看宿主章节 | 读取 `Application.Version`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Visible | boolean | 有同名显式探测；详情看宿主章节 | 读取 `Application.Visible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | WebJS2Variant | function | 仅发现/枚举 | `Application.WebJS2Variant(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | WebShape | null | 仅发现/枚举 | 读取 `Application.WebShape`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Width | number | 仅发现/枚举 | 读取 `Application.Width`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | Windows | object | 有同名显式探测；详情看宿主章节 | 读取 `Application.Windows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | WindowState | number | 仅发现/枚举 | 读取 `Application.WindowState`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | WordBasic | object | 仅发现/枚举 | 读取 `Application.WordBasic`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | WpsAccount | object | 仅发现/枚举 | 读取 `Application.WpsAccount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | WPSAddIns | object | 仅发现/枚举 | 读取 `Application.WPSAddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | WpsApplication | function | 有同名显式探测；详情看宿主章节 | `Application.WpsApplication(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | WPSCloudService | object | 仅发现/枚举 | 读取 `Application.WPSCloudService`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | WpsConfig | object | 仅发现/枚举 | 读取 `Application.WpsConfig`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | WpsHttpRequests | object | 仅发现/枚举 | 读取 `Application.WpsHttpRequests`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Application | WrapCallbackArg | function | 仅发现/枚举 | `Application.WrapCallbackArg(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Application | XMLNamespaces | object | 仅发现/枚举 | 读取 `Application.XMLNamespaces`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | _CodeName | string | 仅发现/枚举 | 读取 `Document._CodeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | AcceptAllRevisions | function | 仅发现/枚举 | `Document.AcceptAllRevisions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | AcceptAllRevisionsShown | function | 仅发现/枚举 | `Document.AcceptAllRevisionsShown(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Activate | function | 仅发现/枚举 | `Document.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ActiveTheme | string | 仅发现/枚举 | 读取 `Document.ActiveTheme`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ActiveThemeDisplayName | string | 仅发现/枚举 | 读取 `Document.ActiveThemeDisplayName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ActiveWindow | object | 仅发现/枚举 | 读取 `Document.ActiveWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ActiveWritingStyle | function | 仅发现/枚举 | `Document.ActiveWritingStyle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | AddDocumentWorkspaceHeader | function | 仅发现/枚举 | `Document.AddDocumentWorkspaceHeader(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | AddMeetingWorkspaceHeader | function | 仅发现/枚举 | `Document.AddMeetingWorkspaceHeader(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | AddToFavorites | function | 仅发现/枚举 | `Document.AddToFavorites(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ApiEvent | object | 仅发现/枚举 | 读取 `Document.ApiEvent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Application | object | 仅发现/枚举 | 读取 `Document.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ApplyDocumentTheme | function | 仅发现/枚举 | `Document.ApplyDocumentTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ApplyQuickStyleSet | function | 仅发现/枚举 | `Document.ApplyQuickStyleSet(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ApplyQuickStyleSet2 | function | 仅发现/枚举 | `Document.ApplyQuickStyleSet2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ApplyTheme | function | 仅发现/枚举 | `Document.ApplyTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | AttachedTemplate | object | 仅发现/枚举 | 读取 `Document.AttachedTemplate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | AutoFormat | function | 仅发现/枚举 | `Document.AutoFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | AutoFormatOverride | boolean | 仅发现/枚举 | 读取 `Document.AutoFormatOverride`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | AutoHyphenation | boolean | 仅发现/枚举 | 读取 `Document.AutoHyphenation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | AutoSummarize | function | 仅发现/枚举 | `Document.AutoSummarize(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Background | object | 仅发现/枚举 | 读取 `Document.Background`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Bibliography | object | 仅发现/枚举 | 读取 `Document.Bibliography`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Bookmarks | object | 仅发现/枚举 | 读取 `Document.Bookmarks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Broadcast | object | 仅发现/枚举 | 读取 `Document.Broadcast`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | BuiltInDocumentProperties | object | 仅发现/枚举 | 读取 `Document.BuiltInDocumentProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | CanCheckin | function | 仅发现/枚举 | `Document.CanCheckin(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Characters | object | 仅发现/枚举 | 读取 `Document.Characters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ChartDataPointTrack | boolean | 仅发现/枚举 | 读取 `Document.ChartDataPointTrack`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | CheckConsistency | function | 仅发现/枚举 | `Document.CheckConsistency(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | CheckGrammar | function | 仅发现/枚举 | `Document.CheckGrammar(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | CheckIn | function | 仅发现/枚举 | `Document.CheckIn(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | CheckInWithVersion | function | 仅发现/枚举 | `Document.CheckInWithVersion(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | CheckNewSmartTags | function | 仅发现/枚举 | `Document.CheckNewSmartTags(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | CheckSpelling | function | 仅发现/枚举 | `Document.CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ChildNodeSuggestions | object | 仅发现/枚举 | 读取 `Document.ChildNodeSuggestions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ClearStyleInstance | function | 仅发现/枚举 | `Document.ClearStyleInstance(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ClickAndTypeParagraphStyle | string | 仅发现/枚举 | 读取 `Document.ClickAndTypeParagraphStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Close | function | 仅发现/枚举 | `Document.Close(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ClosePrintPreview | function | 仅发现/枚举 | `Document.ClosePrintPreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | CoAuthoring | object | 仅发现/枚举 | 读取 `Document.CoAuthoring`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | CodeName | string | 仅发现/枚举 | 读取 `Document.CodeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | CommandBars | object | 仅发现/枚举 | 读取 `Document.CommandBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Comments | object | 仅发现/枚举 | 读取 `Document.Comments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Compare | function | 仅发现/枚举 | `Document.Compare(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Compare2000 | function | 仅发现/枚举 | `Document.Compare2000(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Compare2002 | function | 仅发现/枚举 | `Document.Compare2002(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Compatibility | function | 仅发现/枚举 | `Document.Compatibility(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | CompatibilityMode | number | 仅发现/枚举 | 读取 `Document.CompatibilityMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ComputeStatistics | function | 仅发现/枚举 | `Document.ComputeStatistics(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ConsecutiveHyphensLimit | number | 仅发现/枚举 | 读取 `Document.ConsecutiveHyphensLimit`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Container | null | 仅发现/枚举 | 读取 `Document.Container`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Content | object | 仅发现/枚举 | 读取 `Document.Content`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ContentControls | object | 仅发现/枚举 | 读取 `Document.ContentControls`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ContentTypeProperties | object | 仅发现/枚举 | 读取 `Document.ContentTypeProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Convert | function | 仅发现/枚举 | `Document.Convert(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ConvertAutoHyphens | function | 仅发现/枚举 | `Document.ConvertAutoHyphens(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ConvertNumbersToText | function | 仅发现/枚举 | `Document.ConvertNumbersToText(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ConvertVietDoc | function | 仅发现/枚举 | `Document.ConvertVietDoc(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | CopyStylesFromTemplate | function | 仅发现/枚举 | `Document.CopyStylesFromTemplate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | CountNumberedItems | function | 仅发现/枚举 | `Document.CountNumberedItems(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | CreateLetterContent | function | 仅发现/枚举 | `Document.CreateLetterContent(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Creator | number | 仅发现/枚举 | 读取 `Document.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | CurrentRsid | number | 仅发现/枚举 | 读取 `Document.CurrentRsid`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | CustomDocumentProperties | object | 仅发现/枚举 | 读取 `Document.CustomDocumentProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | CustomXMLParts | object | 仅发现/枚举 | 读取 `Document.CustomXMLParts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | DataForm | function | 仅发现/枚举 | `Document.DataForm(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | DefaultTableStyle | null | 仅发现/枚举 | 读取 `Document.DefaultTableStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | DefaultTabStop | number | 仅发现/枚举 | 读取 `Document.DefaultTabStop`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | DefaultTargetFrame | string | 仅发现/枚举 | 读取 `Document.DefaultTargetFrame`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | DeleteAllComments | function | 仅发现/枚举 | `Document.DeleteAllComments(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | DeleteAllCommentsShown | function | 仅发现/枚举 | `Document.DeleteAllCommentsShown(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | DeleteAllEditableRanges | function | 仅发现/枚举 | `Document.DeleteAllEditableRanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | DeleteAllInkAnnotations | function | 仅发现/枚举 | `Document.DeleteAllInkAnnotations(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | DetectLanguage | function | 仅发现/枚举 | `Document.DetectLanguage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | DisableFeatures | boolean | 仅发现/枚举 | 读取 `Document.DisableFeatures`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | DisableFeaturesIntroducedAfter | number | 仅发现/枚举 | 读取 `Document.DisableFeaturesIntroducedAfter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | DocID | number | 仅发现/枚举 | 读取 `Document.DocID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | DocumentFields | object | 仅发现/枚举 | 读取 `Document.DocumentFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | DocumentInspectors | object | 仅发现/枚举 | 读取 `Document.DocumentInspectors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | DocumentLibraryVersions | object | 仅发现/枚举 | 读取 `Document.DocumentLibraryVersions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | DocumentTheme | object | 仅发现/枚举 | 读取 `Document.DocumentTheme`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | DoNotEmbedSystemFonts | boolean | 仅发现/枚举 | 读取 `Document.DoNotEmbedSystemFonts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | DowngradeDocument | function | 仅发现/枚举 | `Document.DowngradeDocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Dummy1 | null | 仅发现/枚举 | 读取 `Document.Dummy1`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Dummy2 | function | 仅发现/枚举 | `Document.Dummy2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Dummy3 | null | 仅发现/枚举 | 读取 `Document.Dummy3`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Dummy4 | function | 仅发现/枚举 | `Document.Dummy4(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | EditionOptions | function | 仅发现/枚举 | `Document.EditionOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Email | object | 仅发现/枚举 | 读取 `Document.Email`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | EmbedLinguisticData | boolean | 仅发现/枚举 | 读取 `Document.EmbedLinguisticData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | EmbedSmartTags | boolean | 仅发现/枚举 | 读取 `Document.EmbedSmartTags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | EmbedTrueTypeFonts | boolean | 仅发现/枚举 | 读取 `Document.EmbedTrueTypeFonts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | EncryptionProvider | string | 仅发现/枚举 | 读取 `Document.EncryptionProvider`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Endnotes | object | 仅发现/枚举 | 读取 `Document.Endnotes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | EndReview | function | 仅发现/枚举 | `Document.EndReview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | EnforceStyle | boolean | 仅发现/枚举 | 读取 `Document.EnforceStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Envelope | object | 仅发现/枚举 | 读取 `Document.Envelope`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ExportAsFixedFormat | function | 仅发现/枚举 | `Document.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ExportAsFixedFormatPassword | function | 仅发现/枚举 | `Document.ExportAsFixedFormatPassword(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | FarEastLineBreakLanguage | number | 仅发现/枚举 | 读取 `Document.FarEastLineBreakLanguage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | FarEastLineBreakLevel | number | 仅发现/枚举 | 读取 `Document.FarEastLineBreakLevel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Fields | object | 仅发现/枚举 | 读取 `Document.Fields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Final | boolean | 仅发现/枚举 | 读取 `Document.Final`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | FitToPages | function | 仅发现/枚举 | `Document.FitToPages(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | FollowHyperlink | function | 仅发现/枚举 | `Document.FollowHyperlink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Footnotes | object | 仅发现/枚举 | 读取 `Document.Footnotes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | FormattingShowClear | boolean | 仅发现/枚举 | 读取 `Document.FormattingShowClear`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | FormattingShowFilter | number | 仅发现/枚举 | 读取 `Document.FormattingShowFilter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | FormattingShowFont | boolean | 仅发现/枚举 | 读取 `Document.FormattingShowFont`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | FormattingShowNextLevel | boolean | 仅发现/枚举 | 读取 `Document.FormattingShowNextLevel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | FormattingShowNumbering | boolean | 仅发现/枚举 | 读取 `Document.FormattingShowNumbering`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | FormattingShowParagraph | boolean | 仅发现/枚举 | 读取 `Document.FormattingShowParagraph`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | FormattingShowUserStyleName | boolean | 仅发现/枚举 | 读取 `Document.FormattingShowUserStyleName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | FormFields | object | 仅发现/枚举 | 读取 `Document.FormFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | FormsDesign | boolean | 仅发现/枚举 | 读取 `Document.FormsDesign`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ForwardMailer | function | 仅发现/枚举 | `Document.ForwardMailer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Frames | object | 仅发现/枚举 | 读取 `Document.Frames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Frameset | object | 仅发现/枚举 | 读取 `Document.Frameset`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | FreezeLayout | function | 仅发现/枚举 | `Document.FreezeLayout(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | FullName | string | 仅发现/枚举 | 读取 `Document.FullName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | GetCrossReferenceItems | function | 仅发现/枚举 | `Document.GetCrossReferenceItems(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | GetDocumentEx | function | 仅发现/枚举 | `Document.GetDocumentEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | GetLetterContent | function | 仅发现/枚举 | `Document.GetLetterContent(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | GetWorkflowTasks | function | 仅发现/枚举 | `Document.GetWorkflowTasks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | GetWorkflowTemplates | function | 仅发现/枚举 | `Document.GetWorkflowTemplates(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | GoTo | function | 仅发现/枚举 | `Document.GoTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | GrammarChecked | boolean | 仅发现/枚举 | 读取 `Document.GrammarChecked`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | GrammaticalErrors | object | 仅发现/枚举 | 读取 `Document.GrammaticalErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | GridDistanceHorizontal | number | 仅发现/枚举 | 读取 `Document.GridDistanceHorizontal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | GridDistanceVertical | number | 仅发现/枚举 | 读取 `Document.GridDistanceVertical`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | GridOriginFromMargin | boolean | 仅发现/枚举 | 读取 `Document.GridOriginFromMargin`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | GridOriginHorizontal | number | 仅发现/枚举 | 读取 `Document.GridOriginHorizontal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | GridOriginVertical | number | 仅发现/枚举 | 读取 `Document.GridOriginVertical`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | GridSpaceBetweenHorizontalLines | number | 仅发现/枚举 | 读取 `Document.GridSpaceBetweenHorizontalLines`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | GridSpaceBetweenVerticalLines | number | 仅发现/枚举 | 读取 `Document.GridSpaceBetweenVerticalLines`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | HasMailer | boolean | 仅发现/枚举 | 读取 `Document.HasMailer`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | HasPassword | boolean | 仅发现/枚举 | 读取 `Document.HasPassword`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | HasRoutingSlip | boolean | 仅发现/枚举 | 读取 `Document.HasRoutingSlip`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | HasVBProject | boolean | 仅发现/枚举 | 读取 `Document.HasVBProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | HTMLDivisions | object | 仅发现/枚举 | 读取 `Document.HTMLDivisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | HTMLProject | object | 仅发现/枚举 | 读取 `Document.HTMLProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Hyperlinks | object | 仅发现/枚举 | 读取 `Document.Hyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | HyphenateCaps | boolean | 仅发现/枚举 | 读取 `Document.HyphenateCaps`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | HyphenationZone | number | 仅发现/枚举 | 读取 `Document.HyphenationZone`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Indexes | object | 仅发现/枚举 | 读取 `Document.Indexes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | InlineShapes | object | 仅发现/枚举 | 读取 `Document.InlineShapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | InvalidateRightsInfo | function | 仅发现/枚举 | `Document.InvalidateRightsInfo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | IsInAutosave | boolean | 仅发现/枚举 | 读取 `Document.IsInAutosave`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | IsMasterDocument | boolean | 仅发现/枚举 | 读取 `Document.IsMasterDocument`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | IsSubdocument | boolean | 仅发现/枚举 | 读取 `Document.IsSubdocument`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | JSProject | null | 仅发现/枚举 | 读取 `Document.JSProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | JustificationMode | number | 仅发现/枚举 | 读取 `Document.JustificationMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | KerningByAlgorithm | boolean | 仅发现/枚举 | 读取 `Document.KerningByAlgorithm`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Kind | number | 仅发现/枚举 | 读取 `Document.Kind`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | LanguageDetected | boolean | 仅发现/枚举 | 读取 `Document.LanguageDetected`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ListParagraphs | object | 仅发现/枚举 | 读取 `Document.ListParagraphs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Lists | object | 仅发现/枚举 | 读取 `Document.Lists`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ListTemplates | object | 仅发现/枚举 | 读取 `Document.ListTemplates`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | LockQuickStyleSet | boolean | 仅发现/枚举 | 读取 `Document.LockQuickStyleSet`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | LockServerFile | function | 仅发现/枚举 | `Document.LockServerFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | LockTheme | boolean | 仅发现/枚举 | 读取 `Document.LockTheme`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | MailEnvelope | null | 仅发现/枚举 | 读取 `Document.MailEnvelope`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Mailer | object | 仅发现/枚举 | 读取 `Document.Mailer`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | MailMerge | object | 仅发现/枚举 | 读取 `Document.MailMerge`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | MakeCompatibilityDefault | function | 仅发现/枚举 | `Document.MakeCompatibilityDefault(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ManualHyphenation | function | 仅发现/枚举 | `Document.ManualHyphenation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Merge | function | 仅发现/枚举 | `Document.Merge(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Merge2000 | function | 仅发现/枚举 | `Document.Merge2000(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Name | string | 仅发现/枚举 | 读取 `Document.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | NoLineBreakAfter | string | 仅发现/枚举 | 读取 `Document.NoLineBreakAfter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | NoLineBreakBefore | string | 仅发现/枚举 | 读取 `Document.NoLineBreakBefore`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OMathBreakBin | number | 仅发现/枚举 | 读取 `Document.OMathBreakBin`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OMathBreakSub | number | 仅发现/枚举 | 读取 `Document.OMathBreakSub`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OMathFontName | string | 仅发现/枚举 | 读取 `Document.OMathFontName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OMathIntSubSupLim | boolean | 仅发现/枚举 | 读取 `Document.OMathIntSubSupLim`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OMathJc | number | 仅发现/枚举 | 读取 `Document.OMathJc`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OMathLeftMargin | number | 仅发现/枚举 | 读取 `Document.OMathLeftMargin`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OMathNarySupSubLim | boolean | 仅发现/枚举 | 读取 `Document.OMathNarySupSubLim`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OMathRightMargin | number | 仅发现/枚举 | 读取 `Document.OMathRightMargin`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OMaths | object | 仅发现/枚举 | 读取 `Document.OMaths`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OMathSmallFrac | boolean | 仅发现/枚举 | 读取 `Document.OMathSmallFrac`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OMathWrap | number | 仅发现/枚举 | 读取 `Document.OMathWrap`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OpenEncoding | number | 仅发现/枚举 | 读取 `Document.OpenEncoding`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OptimizeForWord97 | boolean | 仅发现/枚举 | 读取 `Document.OptimizeForWord97`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | OriginalDocumentTitle | string | 仅发现/枚举 | 读取 `Document.OriginalDocumentTitle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | PageSetup | object | 仅发现/枚举 | 读取 `Document.PageSetup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Paragraphs | object | 仅发现/枚举 | 读取 `Document.Paragraphs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Parent | object | 仅发现/枚举 | 读取 `Document.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Password | null | 仅发现/枚举 | 读取 `Document.Password`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | PasswordEncryptionAlgorithm | string | 仅发现/枚举 | 读取 `Document.PasswordEncryptionAlgorithm`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | PasswordEncryptionFileProperties | boolean | 仅发现/枚举 | 读取 `Document.PasswordEncryptionFileProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | PasswordEncryptionKeyLength | number | 仅发现/枚举 | 读取 `Document.PasswordEncryptionKeyLength`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | PasswordEncryptionProvider | string | 仅发现/枚举 | 读取 `Document.PasswordEncryptionProvider`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Path | string | 仅发现/枚举 | 读取 `Document.Path`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Permission | object | 仅发现/枚举 | 读取 `Document.Permission`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Post | function | 仅发现/枚举 | `Document.Post(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | PresentIt | function | 仅发现/枚举 | `Document.PresentIt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | PrintFormsData | boolean | 仅发现/枚举 | 读取 `Document.PrintFormsData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | PrintFractionalWidths | boolean | 仅发现/枚举 | 读取 `Document.PrintFractionalWidths`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | PrintOut | function | 仅发现/枚举 | `Document.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | PrintOut2000 | function | 仅发现/枚举 | `Document.PrintOut2000(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | PrintOutOld | function | 仅发现/枚举 | `Document.PrintOutOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | PrintPostScriptOverText | boolean | 仅发现/枚举 | 读取 `Document.PrintPostScriptOverText`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | PrintPreview | function | 仅发现/枚举 | `Document.PrintPreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | PrintRevisions | boolean | 仅发现/枚举 | 读取 `Document.PrintRevisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Protect | function | 仅发现/枚举 | `Document.Protect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Protect2002 | function | 仅发现/枚举 | `Document.Protect2002(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ProtectionType | number | 仅发现/枚举 | 读取 `Document.ProtectionType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Range | function | 仅发现/枚举 | `Document.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ReadabilityStatistics | object | 仅发现/枚举 | 读取 `Document.ReadabilityStatistics`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ReadingLayoutSizeX | number | 仅发现/枚举 | 读取 `Document.ReadingLayoutSizeX`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ReadingLayoutSizeY | number | 仅发现/枚举 | 读取 `Document.ReadingLayoutSizeY`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ReadingModeLayoutFrozen | boolean | 仅发现/枚举 | 读取 `Document.ReadingModeLayoutFrozen`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ReadOnly | boolean | 仅发现/枚举 | 读取 `Document.ReadOnly`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ReadOnlyRecommended | boolean | 仅发现/枚举 | 读取 `Document.ReadOnlyRecommended`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | RecheckSmartTags | function | 仅发现/枚举 | `Document.RecheckSmartTags(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Redo | function | 仅发现/枚举 | `Document.Redo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | RejectAllRevisions | function | 仅发现/枚举 | `Document.RejectAllRevisions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | RejectAllRevisionsShown | function | 仅发现/枚举 | `Document.RejectAllRevisionsShown(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Reload | function | 仅发现/枚举 | `Document.Reload(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ReloadAs | function | 仅发现/枚举 | `Document.ReloadAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | RemoveDateAndTime | null | 仅发现/枚举 | 读取 `Document.RemoveDateAndTime`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | RemoveDocumentInformation | function | 仅发现/枚举 | `Document.RemoveDocumentInformation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | RemoveDocumentWorkspaceHeader | function | 仅发现/枚举 | `Document.RemoveDocumentWorkspaceHeader(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | RemoveLockedStyles | function | 仅发现/枚举 | `Document.RemoveLockedStyles(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | RemoveNumbers | function | 仅发现/枚举 | `Document.RemoveNumbers(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | RemovePersonalInformation | boolean | 仅发现/枚举 | 读取 `Document.RemovePersonalInformation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | RemoveSmartTags | function | 仅发现/枚举 | `Document.RemoveSmartTags(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | RemoveTheme | function | 仅发现/枚举 | `Document.RemoveTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Repaginate | function | 仅发现/枚举 | `Document.Repaginate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Reply | function | 仅发现/枚举 | `Document.Reply(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ReplyAll | function | 仅发现/枚举 | `Document.ReplyAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ReplyWithChanges | function | 仅发现/枚举 | `Document.ReplyWithChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Research | object | 仅发现/枚举 | 读取 `Document.Research`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ResetFormFields | function | 仅发现/枚举 | `Document.ResetFormFields(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ReturnToLastReadPosition | function | 仅发现/枚举 | `Document.ReturnToLastReadPosition(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | RevisedDocumentTitle | string | 仅发现/枚举 | 读取 `Document.RevisedDocumentTitle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Revisions | object | 仅发现/枚举 | 读取 `Document.Revisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Route | function | 仅发现/枚举 | `Document.Route(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Routed | boolean | 仅发现/枚举 | 读取 `Document.Routed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | RoutingSlip | object | 仅发现/枚举 | 读取 `Document.RoutingSlip`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | RunAutoMacro | function | 仅发现/枚举 | `Document.RunAutoMacro(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | RunLetterWizard | function | 仅发现/枚举 | `Document.RunLetterWizard(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Save | function | 仅发现/枚举 | `Document.Save(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SaveAs | function | 仅发现/枚举 | `Document.SaveAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SaveAs2 | function | 仅发现/枚举 | `Document.SaveAs2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SaveAs2000 | function | 仅发现/枚举 | `Document.SaveAs2000(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SaveAsBinaryString | function | 仅发现/枚举 | `Document.SaveAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SaveAsQuickStyleSet | function | 仅发现/枚举 | `Document.SaveAsQuickStyleSet(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SaveAsUrl | function | 仅发现/枚举 | `Document.SaveAsUrl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SaveCopyAs | function | 仅发现/枚举 | `Document.SaveCopyAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Saved | boolean | 仅发现/枚举 | 读取 `Document.Saved`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SaveEncoding | number | 仅发现/枚举 | 读取 `Document.SaveEncoding`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SaveFormat | number | 仅发现/枚举 | 读取 `Document.SaveFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SaveFormsData | boolean | 仅发现/枚举 | 读取 `Document.SaveFormsData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SaveSubsetFonts | boolean | 仅发现/枚举 | 读取 `Document.SaveSubsetFonts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | sblt | function | 仅发现/枚举 | `Document.sblt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Scripts | object | 仅发现/枚举 | 读取 `Document.Scripts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Sections | object | 仅发现/枚举 | 读取 `Document.Sections`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Select | function | 仅发现/枚举 | `Document.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SelectAllEditableRanges | function | 仅发现/枚举 | `Document.SelectAllEditableRanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SelectContentControlsByTag | function | 仅发现/枚举 | `Document.SelectContentControlsByTag(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SelectContentControlsByTitle | function | 仅发现/枚举 | `Document.SelectContentControlsByTitle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SelectLinkedControls | function | 仅发现/枚举 | `Document.SelectLinkedControls(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SelectNodes | function | 仅发现/枚举 | `Document.SelectNodes(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SelectSingleNode | function | 仅发现/枚举 | `Document.SelectSingleNode(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SelectStyleInstance | function | 仅发现/枚举 | `Document.SelectStyleInstance(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SelectUnlinkedControls | function | 仅发现/枚举 | `Document.SelectUnlinkedControls(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SendFax | function | 仅发现/枚举 | `Document.SendFax(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SendFaxOverInternet | function | 仅发现/枚举 | `Document.SendFaxOverInternet(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SendForReview | function | 仅发现/枚举 | `Document.SendForReview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SendMail | function | 仅发现/枚举 | `Document.SendMail(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SendMailer | function | 仅发现/枚举 | `Document.SendMailer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Sentences | object | 仅发现/枚举 | 读取 `Document.Sentences`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ServerPolicy | object | 仅发现/枚举 | 读取 `Document.ServerPolicy`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SetCompatibilityMode | function | 仅发现/枚举 | `Document.SetCompatibilityMode(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SetDefaultTableStyle | function | 仅发现/枚举 | `Document.SetDefaultTableStyle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SetLetterContent | function | 仅发现/枚举 | `Document.SetLetterContent(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | SetPasswordEncryptionOptions | function | 仅发现/枚举 | `Document.SetPasswordEncryptionOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Shapes | object | 仅发现/枚举 | 读取 `Document.Shapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SharedWorkspace | object | 仅发现/枚举 | 读取 `Document.SharedWorkspace`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ShowDocumentFieldTarget | number | 仅发现/枚举 | 读取 `Document.ShowDocumentFieldTarget`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ShowGrammaticalErrors | boolean | 仅发现/枚举 | 读取 `Document.ShowGrammaticalErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ShowRevisions | boolean | 仅发现/枚举 | 读取 `Document.ShowRevisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ShowSpellingErrors | boolean | 仅发现/枚举 | 读取 `Document.ShowSpellingErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ShowSummary | boolean | 仅发现/枚举 | 读取 `Document.ShowSummary`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Signatures | object | 仅发现/枚举 | 读取 `Document.Signatures`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SmartDocument | object | 仅发现/枚举 | 读取 `Document.SmartDocument`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SmartTags | object | 仅发现/枚举 | 读取 `Document.SmartTags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SmartTagsAsXMLProps | boolean | 仅发现/枚举 | 读取 `Document.SmartTagsAsXMLProps`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SnapToGrid | boolean | 仅发现/枚举 | 读取 `Document.SnapToGrid`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SnapToShapes | boolean | 仅发现/枚举 | 读取 `Document.SnapToShapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SpellingChecked | boolean | 仅发现/枚举 | 读取 `Document.SpellingChecked`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SpellingErrors | object | 仅发现/枚举 | 读取 `Document.SpellingErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | StoryRanges | object | 仅发现/枚举 | 读取 `Document.StoryRanges`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Styles | object | 仅发现/枚举 | 读取 `Document.Styles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | StyleSheets | object | 仅发现/枚举 | 读取 `Document.StyleSheets`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | StyleSortMethod | number | 仅发现/枚举 | 读取 `Document.StyleSortMethod`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Subdocuments | object | 仅发现/枚举 | 读取 `Document.Subdocuments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SummaryLength | number | 仅发现/枚举 | 读取 `Document.SummaryLength`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | SummaryViewMode | number | 仅发现/枚举 | 读取 `Document.SummaryViewMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Sync | object | 仅发现/枚举 | 读取 `Document.Sync`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Tables | object | 仅发现/枚举 | 读取 `Document.Tables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | TablesOfAuthorities | object | 仅发现/枚举 | 读取 `Document.TablesOfAuthorities`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | TablesOfAuthoritiesCategories | object | 仅发现/枚举 | 读取 `Document.TablesOfAuthoritiesCategories`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | TablesOfContents | object | 仅发现/枚举 | 读取 `Document.TablesOfContents`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | TablesOfFigures | object | 仅发现/枚举 | 读取 `Document.TablesOfFigures`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | TextEncoding | number | 仅发现/枚举 | 读取 `Document.TextEncoding`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | TextLineEnding | number | 仅发现/枚举 | 读取 `Document.TextLineEnding`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Theme | function | 仅发现/枚举 | `Document.Theme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ThemeColor | function | 仅发现/枚举 | `Document.ThemeColor(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ThemeFont | function | 仅发现/枚举 | `Document.ThemeFont(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ThemeFormat | function | 仅发现/枚举 | `Document.ThemeFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ToggleFormsDesign | function | 仅发现/枚举 | `Document.ToggleFormsDesign(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | TrackFormatting | boolean | 仅发现/枚举 | 读取 `Document.TrackFormatting`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | TrackMoves | boolean | 仅发现/枚举 | 读取 `Document.TrackMoves`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | TrackRevisions | boolean | 仅发现/枚举 | 读取 `Document.TrackRevisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | TransformDocument | function | 仅发现/枚举 | `Document.TransformDocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Type | number | 仅发现/枚举 | 读取 `Document.Type`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Undo | function | 仅发现/枚举 | `Document.Undo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | UndoClear | function | 仅发现/枚举 | `Document.UndoClear(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | UnfreezeLayout | function | 仅发现/枚举 | `Document.UnfreezeLayout(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Unprotect | function | 仅发现/枚举 | `Document.Unprotect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | UpdateStyles | function | 仅发现/枚举 | `Document.UpdateStyles(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | UpdateStylesOnOpen | boolean | 仅发现/枚举 | 读取 `Document.UpdateStylesOnOpen`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | UpdateSummaryProperties | function | 仅发现/枚举 | `Document.UpdateSummaryProperties(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | UseMathDefaults | boolean | 仅发现/枚举 | 读取 `Document.UseMathDefaults`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | UserControl | boolean | 仅发现/枚举 | 读取 `Document.UserControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Variables | object | 仅发现/枚举 | 读取 `Document.Variables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | VBASigned | boolean | 仅发现/枚举 | 读取 `Document.VBASigned`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Versions | null | 仅发现/枚举 | 读取 `Document.Versions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | ViewCode | function | 仅发现/枚举 | `Document.ViewCode(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | ViewPropertyBrowser | function | 仅发现/枚举 | `Document.ViewPropertyBrowser(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | WebOptions | object | 仅发现/枚举 | 读取 `Document.WebOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | WebPagePreview | function | 仅发现/枚举 | `Document.WebPagePreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Document | Windows | object | 仅发现/枚举 | 读取 `Document.Windows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | WordOpenXML | string | 仅发现/枚举 | 读取 `Document.WordOpenXML`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | Words | object | 仅发现/枚举 | 读取 `Document.Words`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | WritePassword | null | 仅发现/枚举 | 读取 `Document.WritePassword`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | WriteReserved | boolean | 仅发现/枚举 | 读取 `Document.WriteReserved`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | XMLHideNamespaces | boolean | 仅发现/枚举 | 读取 `Document.XMLHideNamespaces`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | XMLNodes | object | 仅发现/枚举 | 读取 `Document.XMLNodes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | XMLSaveDataOnly | boolean | 仅发现/枚举 | 读取 `Document.XMLSaveDataOnly`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | XMLSaveThroughXSLT | string | 仅发现/枚举 | 读取 `Document.XMLSaveThroughXSLT`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | XMLSchemaReferences | object | 仅发现/枚举 | 读取 `Document.XMLSchemaReferences`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | XMLSchemaViolations | object | 仅发现/枚举 | 读取 `Document.XMLSchemaViolations`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | XMLShowAdvancedErrors | boolean | 仅发现/枚举 | 读取 `Document.XMLShowAdvancedErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Document | XMLUseXSLTWhenSaving | boolean | 仅发现/枚举 | 读取 `Document.XMLUseXSLTWhenSaving`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | FileSystem | absoluteFilePath | function | 仅发现/枚举 | `FileSystem.absoluteFilePath(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | absolutePath | function | 仅发现/枚举 | `FileSystem.absolutePath(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | AppendFile | function | 仅发现/枚举 | `FileSystem.AppendFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | constants | object | 仅发现/枚举 | 读取 `FileSystem.constants`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | FileSystem | copyFileSync | function | 仅发现/枚举 | `FileSystem.copyFileSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | Exists | function | 仅发现/枚举 | `FileSystem.Exists(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | existsSync | function | 仅发现/枚举 | `FileSystem.existsSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | isWritable | function | 仅发现/枚举 | `FileSystem.isWritable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | Mkdir | function | 仅发现/枚举 | `FileSystem.Mkdir(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | mkdirSync | function | 仅发现/枚举 | `FileSystem.mkdirSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | mkdtempSync | function | 仅发现/枚举 | `FileSystem.mkdtempSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | readAsBinaryString | function | 仅发现/枚举 | `FileSystem.readAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | readdirSync | function | 仅发现/枚举 | `FileSystem.readdirSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | ReadFile | function | 仅发现/枚举 | `FileSystem.ReadFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | ReadFileAsArrayBuffer | function | 仅发现/枚举 | `FileSystem.ReadFileAsArrayBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | readFileString | function | 仅发现/枚举 | `FileSystem.readFileString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | Remove | function | 仅发现/枚举 | `FileSystem.Remove(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | rmdirSync | function | 仅发现/枚举 | `FileSystem.rmdirSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | stat | function | 仅发现/枚举 | `FileSystem.stat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | tmpdir | function | 仅发现/枚举 | `FileSystem.tmpdir(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | toNativeSeparators | function | 仅发现/枚举 | `FileSystem.toNativeSeparators(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | unlinkSync | function | 仅发现/枚举 | `FileSystem.unlinkSync(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | writeAsBinaryString | function | 仅发现/枚举 | `FileSystem.writeAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | WriteFile | function | 仅发现/枚举 | `FileSystem.WriteFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | writeFileString | function | 仅发现/枚举 | `FileSystem.writeFileString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | FileSystem | writeSliceAsBinaryString | function | 仅发现/枚举 | `FileSystem.writeSliceAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Find | Application | object | 仅发现/枚举 | 读取 `Find.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | ClearAllFuzzyOptions | function | 仅发现/枚举 | `Find.ClearAllFuzzyOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Find | ClearFormatting | function | 仅发现/枚举 | `Find.ClearFormatting(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Find | ClearHitHighlight | function | 仅发现/枚举 | `Find.ClearHitHighlight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Find | CorrectHangulEndings | boolean | 仅发现/枚举 | 读取 `Find.CorrectHangulEndings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | Creator | number | 仅发现/枚举 | 读取 `Find.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | Execute | function | 有同名显式探测；详情看宿主章节 | `Find.Execute(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Find | Execute2007 | function | 仅发现/枚举 | `Find.Execute2007(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Find | ExecuteOld | function | 仅发现/枚举 | `Find.ExecuteOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Find | Font | object | 仅发现/枚举 | 读取 `Find.Font`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | Format | boolean | 仅发现/枚举 | 读取 `Find.Format`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | Forward | boolean | 仅发现/枚举 | 读取 `Find.Forward`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | Found | boolean | 仅发现/枚举 | 读取 `Find.Found`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | Frame | null | 仅发现/枚举 | 读取 `Find.Frame`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | HanjaPhoneticHangul | boolean | 仅发现/枚举 | 读取 `Find.HanjaPhoneticHangul`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | Highlight | number | 仅发现/枚举 | 读取 `Find.Highlight`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | HitHighlight | function | 仅发现/枚举 | `Find.HitHighlight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Find | IgnorePunct | boolean | 仅发现/枚举 | 读取 `Find.IgnorePunct`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | IgnoreSpace | boolean | 仅发现/枚举 | 读取 `Find.IgnoreSpace`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | LanguageID | number | 仅发现/枚举 | 读取 `Find.LanguageID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | LanguageIDFarEast | null | 仅发现/枚举 | 读取 `Find.LanguageIDFarEast`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | LanguageIDOther | null | 仅发现/枚举 | 读取 `Find.LanguageIDOther`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchAlefHamza | boolean | 仅发现/枚举 | 读取 `Find.MatchAlefHamza`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchAllWordForms | boolean | 仅发现/枚举 | 读取 `Find.MatchAllWordForms`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchByte | boolean | 仅发现/枚举 | 读取 `Find.MatchByte`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchCase | boolean | 仅发现/枚举 | 读取 `Find.MatchCase`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchControl | boolean | 仅发现/枚举 | 读取 `Find.MatchControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchDiacritics | boolean | 仅发现/枚举 | 读取 `Find.MatchDiacritics`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchFuzzy | boolean | 仅发现/枚举 | 读取 `Find.MatchFuzzy`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchKashida | boolean | 仅发现/枚举 | 读取 `Find.MatchKashida`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchPhrase | boolean | 仅发现/枚举 | 读取 `Find.MatchPhrase`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchPrefix | boolean | 仅发现/枚举 | 读取 `Find.MatchPrefix`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchSoundsLike | boolean | 仅发现/枚举 | 读取 `Find.MatchSoundsLike`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchSuffix | boolean | 仅发现/枚举 | 读取 `Find.MatchSuffix`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchWholeWord | boolean | 仅发现/枚举 | 读取 `Find.MatchWholeWord`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | MatchWildcards | boolean | 仅发现/枚举 | 读取 `Find.MatchWildcards`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | NoProofing | number | 仅发现/枚举 | 读取 `Find.NoProofing`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | ParagraphFormat | object | 仅发现/枚举 | 读取 `Find.ParagraphFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | Parent | object | 仅发现/枚举 | 读取 `Find.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | Replacement | object | 仅发现/枚举 | 读取 `Find.Replacement`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | SetAllFuzzyOptions | function | 仅发现/枚举 | `Find.SetAllFuzzyOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Find | Style | string | 仅发现/枚举 | 读取 `Find.Style`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | Text | string | 仅发现/枚举 | 读取 `Find.Text`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Find | Wrap | number | 仅发现/枚举 | 读取 `Find.Wrap`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Application | object | 仅发现/枚举 | 读取 `Range.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | AutoFormat | function | 仅发现/枚举 | `Range.AutoFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Bold | number | 仅发现/枚举 | 读取 `Range.Bold`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | BoldBi | number | 仅发现/枚举 | 读取 `Range.BoldBi`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | BookmarkID | number | 仅发现/枚举 | 读取 `Range.BookmarkID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Bookmarks | object | 仅发现/枚举 | 读取 `Range.Bookmarks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Borders | object | 仅发现/枚举 | 读取 `Range.Borders`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Calculate | function | 仅发现/枚举 | `Range.Calculate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | CanEdit | number | 仅发现/枚举 | 读取 `Range.CanEdit`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | CanPaste | number | 仅发现/枚举 | 读取 `Range.CanPaste`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Case | number | 仅发现/枚举 | 读取 `Range.Case`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Cells | null | 仅发现/枚举 | 读取 `Range.Cells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Characters | object | 仅发现/枚举 | 读取 `Range.Characters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | CharacterStyle | object | 仅发现/枚举 | 读取 `Range.CharacterStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | CharacterWidth | number | 仅发现/枚举 | 读取 `Range.CharacterWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | CheckGrammar | function | 仅发现/枚举 | `Range.CheckGrammar(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | CheckSpelling | function | 仅发现/枚举 | `Range.CheckSpelling(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | CheckSynonyms | function | 仅发现/枚举 | `Range.CheckSynonyms(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Collapse | function | 仅发现/枚举 | `Range.Collapse(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Columns | null | 仅发现/枚举 | 读取 `Range.Columns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | CombineCharacters | boolean | 仅发现/枚举 | 读取 `Range.CombineCharacters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Comments | object | 仅发现/枚举 | 读取 `Range.Comments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ComputeStatistics | function | 仅发现/枚举 | `Range.ComputeStatistics(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Conflicts | object | 仅发现/枚举 | 读取 `Range.Conflicts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ContentControls | object | 仅发现/枚举 | 读取 `Range.ContentControls`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ConvertHangulAndHanja | function | 仅发现/枚举 | `Range.ConvertHangulAndHanja(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | ConvertToTable | function | 仅发现/枚举 | `Range.ConvertToTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | ConvertToTableOld | function | 仅发现/枚举 | `Range.ConvertToTableOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Copy | function | 仅发现/枚举 | `Range.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | CopyAsPicture | function | 仅发现/枚举 | `Range.CopyAsPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | CreatePublisher | function | 仅发现/枚举 | `Range.CreatePublisher(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Creator | number | 仅发现/枚举 | 读取 `Range.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Cut | function | 仅发现/枚举 | `Range.Cut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Delete | function | 仅发现/枚举 | `Range.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | DetectLanguage | function | 仅发现/枚举 | `Range.DetectLanguage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | DisableCharacterSpaceGrid | boolean | 仅发现/枚举 | 读取 `Range.DisableCharacterSpaceGrid`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Document | object | 仅发现/枚举 | 读取 `Range.Document`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | DocumentFields | object | 仅发现/枚举 | 读取 `Range.DocumentFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Duplicate | object | 仅发现/枚举 | 读取 `Range.Duplicate`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Editors | object | 仅发现/枚举 | 读取 `Range.Editors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | EmphasisMark | number | 仅发现/枚举 | 读取 `Range.EmphasisMark`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | End | number | 仅发现/枚举 | 读取 `Range.End`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | EndnoteOptions | object | 仅发现/枚举 | 读取 `Range.EndnoteOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Endnotes | object | 仅发现/枚举 | 读取 `Range.Endnotes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | EndOf | function | 仅发现/枚举 | `Range.EndOf(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | EnhMetaFileBits | null | 仅发现/枚举 | 读取 `Range.EnhMetaFileBits`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Expand | function | 仅发现/枚举 | `Range.Expand(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | ExportAsFixedFormat | function | 仅发现/枚举 | `Range.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | ExportFragment | function | 仅发现/枚举 | `Range.ExportFragment(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Fields | object | 仅发现/枚举 | 读取 `Range.Fields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Find | object | 仅发现/枚举 | 读取 `Range.Find`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | FitTextWidth | number | 仅发现/枚举 | 读取 `Range.FitTextWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Font | object | 仅发现/枚举 | 读取 `Range.Font`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | FootnoteOptions | object | 仅发现/枚举 | 读取 `Range.FootnoteOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Footnotes | object | 仅发现/枚举 | 读取 `Range.Footnotes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | FormattedText | object | 仅发现/枚举 | 读取 `Range.FormattedText`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | FormFields | object | 仅发现/枚举 | 读取 `Range.FormFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Frames | object | 仅发现/枚举 | 读取 `Range.Frames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | GetRangeEx | function | 仅发现/枚举 | `Range.GetRangeEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | GetSpellingSuggestions | function | 仅发现/枚举 | `Range.GetSpellingSuggestions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | GoTo | function | 仅发现/枚举 | `Range.GoTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | GoToEditableRange | function | 仅发现/枚举 | `Range.GoToEditableRange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | GoToNext | function | 仅发现/枚举 | `Range.GoToNext(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | GoToPrevious | function | 仅发现/枚举 | `Range.GoToPrevious(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | GrammarChecked | boolean | 仅发现/枚举 | 读取 `Range.GrammarChecked`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | GrammaticalErrors | object | 仅发现/枚举 | 读取 `Range.GrammaticalErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | HighlightColorIndex | number | 仅发现/枚举 | 读取 `Range.HighlightColorIndex`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | HorizontalInVertical | number | 仅发现/枚举 | 读取 `Range.HorizontalInVertical`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | HTMLDivisions | object | 仅发现/枚举 | 读取 `Range.HTMLDivisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Hyperlinks | object | 仅发现/枚举 | 读取 `Range.Hyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ID | string | 仅发现/枚举 | 读取 `Range.ID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ImportFragment | function | 仅发现/枚举 | `Range.ImportFragment(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Information | function | 仅发现/枚举 | `Range.Information(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InlineShapes | object | 仅发现/枚举 | 读取 `Range.InlineShapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | InRange | function | 仅发现/枚举 | `Range.InRange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertAfter | function | 有同名显式探测；详情看宿主章节 | `Range.InsertAfter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertAlignmentTab | function | 仅发现/枚举 | `Range.InsertAlignmentTab(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertAutoText | function | 仅发现/枚举 | `Range.InsertAutoText(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertBefore | function | 仅发现/枚举 | `Range.InsertBefore(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertBreak | function | 仅发现/枚举 | `Range.InsertBreak(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertCaption | function | 仅发现/枚举 | `Range.InsertCaption(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertCaptionXP | function | 仅发现/枚举 | `Range.InsertCaptionXP(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertCrossReference | function | 仅发现/枚举 | `Range.InsertCrossReference(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertCrossReference_2002 | function | 仅发现/枚举 | `Range.InsertCrossReference_2002(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertDatabase | function | 仅发现/枚举 | `Range.InsertDatabase(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertDateTime | function | 仅发现/枚举 | `Range.InsertDateTime(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertDateTimeOld | function | 仅发现/枚举 | `Range.InsertDateTimeOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertFile | function | 仅发现/枚举 | `Range.InsertFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertParagraph | function | 仅发现/枚举 | `Range.InsertParagraph(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertParagraphAfter | function | 仅发现/枚举 | `Range.InsertParagraphAfter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertParagraphBefore | function | 仅发现/枚举 | `Range.InsertParagraphBefore(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertSymbol | function | 仅发现/枚举 | `Range.InsertSymbol(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InsertXML | function | 仅发现/枚举 | `Range.InsertXML(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | InStory | function | 仅发现/枚举 | `Range.InStory(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | IsEndOfRowMark | boolean | 仅发现/枚举 | 读取 `Range.IsEndOfRowMark`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | IsEqual | function | 仅发现/枚举 | `Range.IsEqual(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Italic | number | 仅发现/枚举 | 读取 `Range.Italic`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ItalicBi | number | 仅发现/枚举 | 读取 `Range.ItalicBi`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Kana | number | 仅发现/枚举 | 读取 `Range.Kana`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | LanguageDetected | boolean | 仅发现/枚举 | 读取 `Range.LanguageDetected`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | LanguageID | number | 仅发现/枚举 | 读取 `Range.LanguageID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | LanguageIDFarEast | number | 仅发现/枚举 | 读取 `Range.LanguageIDFarEast`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | LanguageIDOther | number | 仅发现/枚举 | 读取 `Range.LanguageIDOther`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ListFormat | object | 仅发现/枚举 | 读取 `Range.ListFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ListParagraphs | object | 仅发现/枚举 | 读取 `Range.ListParagraphs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ListStyle | null | 仅发现/枚举 | 读取 `Range.ListStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Locks | object | 仅发现/枚举 | 读取 `Range.Locks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | LookupNameProperties | function | 仅发现/枚举 | `Range.LookupNameProperties(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | ModifyEnclosure | function | 仅发现/枚举 | `Range.ModifyEnclosure(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Move | function | 仅发现/枚举 | `Range.Move(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | MoveEnd | function | 仅发现/枚举 | `Range.MoveEnd(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | MoveEndUntil | function | 仅发现/枚举 | `Range.MoveEndUntil(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | MoveEndWhile | function | 仅发现/枚举 | `Range.MoveEndWhile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | MoveStart | function | 仅发现/枚举 | `Range.MoveStart(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | MoveStartUntil | function | 仅发现/枚举 | `Range.MoveStartUntil(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | MoveStartWhile | function | 仅发现/枚举 | `Range.MoveStartWhile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | MoveUntil | function | 仅发现/枚举 | `Range.MoveUntil(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | MoveWhile | function | 仅发现/枚举 | `Range.MoveWhile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Next | function | 仅发现/枚举 | `Range.Next(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | NextStoryRange | null | 仅发现/枚举 | 读取 `Range.NextStoryRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | NextSubdocument | function | 仅发现/枚举 | `Range.NextSubdocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | NoProofing | number | 仅发现/枚举 | 读取 `Range.NoProofing`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | OMaths | object | 仅发现/枚举 | 读取 `Range.OMaths`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Orientation | number | 仅发现/枚举 | 读取 `Range.Orientation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | PageSetup | object | 仅发现/枚举 | 读取 `Range.PageSetup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ParagraphFormat | object | 仅发现/枚举 | 读取 `Range.ParagraphFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Paragraphs | object | 仅发现/枚举 | 读取 `Range.Paragraphs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ParagraphStyle | object | 仅发现/枚举 | 读取 `Range.ParagraphStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Parent | object | 仅发现/枚举 | 读取 `Range.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ParentContentControl | null | 仅发现/枚举 | 读取 `Range.ParentContentControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Paste | function | 仅发现/枚举 | `Range.Paste(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | PasteAndFormat | function | 仅发现/枚举 | `Range.PasteAndFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | PasteAppendTable | function | 仅发现/枚举 | `Range.PasteAppendTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | PasteAsNestedTable | function | 仅发现/枚举 | `Range.PasteAsNestedTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | PasteExcelTable | function | 仅发现/枚举 | `Range.PasteExcelTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | PasteSpecial | function | 仅发现/枚举 | `Range.PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | PhoneticGuide | function | 仅发现/枚举 | `Range.PhoneticGuide(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Previous | function | 仅发现/枚举 | `Range.Previous(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | PreviousBookmarkID | number | 仅发现/枚举 | 读取 `Range.PreviousBookmarkID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | PreviousSubdocument | function | 仅发现/枚举 | `Range.PreviousSubdocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | ReadabilityStatistics | object | 仅发现/枚举 | 读取 `Range.ReadabilityStatistics`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Relocate | function | 仅发现/枚举 | `Range.Relocate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Revisions | object | 仅发现/枚举 | 读取 `Range.Revisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Rows | null | 仅发现/枚举 | 读取 `Range.Rows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Scripts | object | 仅发现/枚举 | 读取 `Range.Scripts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Sections | object | 仅发现/枚举 | 读取 `Range.Sections`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Select | function | 有同名显式探测；详情看宿主章节 | `Range.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Sentences | object | 仅发现/枚举 | 读取 `Range.Sentences`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | SetListLevel | function | 仅发现/枚举 | `Range.SetListLevel(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | SetRange | function | 仅发现/枚举 | `Range.SetRange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Shading | object | 仅发现/枚举 | 读取 `Range.Shading`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ShapeRange | object | 仅发现/枚举 | 读取 `Range.ShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | ShowAll | boolean | 仅发现/枚举 | 读取 `Range.ShowAll`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | SmartTags | object | 仅发现/枚举 | 读取 `Range.SmartTags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Sort | function | 仅发现/枚举 | `Range.Sort(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | SortAscending | function | 仅发现/枚举 | `Range.SortAscending(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | SortByHeadings | function | 仅发现/枚举 | `Range.SortByHeadings(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | SortDescending | function | 仅发现/枚举 | `Range.SortDescending(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | SortOld | function | 仅发现/枚举 | `Range.SortOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | SpellingChecked | boolean | 仅发现/枚举 | 读取 `Range.SpellingChecked`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | SpellingErrors | object | 仅发现/枚举 | 读取 `Range.SpellingErrors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Start | number | 仅发现/枚举 | 读取 `Range.Start`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | StartOf | function | 仅发现/枚举 | `Range.StartOf(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | StoryLength | number | 仅发现/枚举 | 读取 `Range.StoryLength`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | StoryType | number | 仅发现/枚举 | 读取 `Range.StoryType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Style | object | 仅发现/枚举 | 读取 `Range.Style`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Subdocuments | object | 仅发现/枚举 | 读取 `Range.Subdocuments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | SubscribeTo | function | 仅发现/枚举 | `Range.SubscribeTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | SynonymInfo | object | 仅发现/枚举 | 读取 `Range.SynonymInfo`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Tables | object | 仅发现/枚举 | 读取 `Range.Tables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | TableStyle | null | 仅发现/枚举 | 读取 `Range.TableStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | TCSCConverter | function | 仅发现/枚举 | `Range.TCSCConverter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | Text | string | 仅发现/枚举 | 读取 `Range.Text`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | TextRetrievalMode | object | 仅发现/枚举 | 读取 `Range.TextRetrievalMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | TextVisibleOnScreen | number | 仅发现/枚举 | 读取 `Range.TextVisibleOnScreen`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | TopLevelTables | object | 仅发现/枚举 | 读取 `Range.TopLevelTables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | TwoLinesInOne | number | 仅发现/枚举 | 读取 `Range.TwoLinesInOne`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Underline | number | 仅发现/枚举 | 读取 `Range.Underline`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Updates | object | 仅发现/枚举 | 读取 `Range.Updates`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | WholeStory | function | 仅发现/枚举 | `Range.WholeStory(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | WordOpenXML | string | 仅发现/枚举 | 读取 `Range.WordOpenXML`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | Words | object | 仅发现/枚举 | 读取 `Range.Words`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | XML | function | 仅发现/枚举 | `Range.XML(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Range | XMLNodes | object | 仅发现/枚举 | 读取 `Range.XMLNodes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Range | XMLParentNode | null | 仅发现/枚举 | 读取 `Range.XMLParentNode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Active | boolean | 仅发现/枚举 | 读取 `Selection.Active`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Application | object | 仅发现/枚举 | 读取 `Selection.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | BoldRun | function | 仅发现/枚举 | `Selection.BoldRun(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | BookmarkID | number | 仅发现/枚举 | 读取 `Selection.BookmarkID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Bookmarks | object | 仅发现/枚举 | 读取 `Selection.Bookmarks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Borders | object | 仅发现/枚举 | 读取 `Selection.Borders`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Calculate | function | 仅发现/枚举 | `Selection.Calculate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Cells | null | 仅发现/枚举 | 读取 `Selection.Cells`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Characters | object | 仅发现/枚举 | 读取 `Selection.Characters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | ChildShapeRange | null | 仅发现/枚举 | 读取 `Selection.ChildShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | ClearCharacterAllFormatting | function | 仅发现/枚举 | `Selection.ClearCharacterAllFormatting(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | ClearCharacterDirectFormatting | function | 仅发现/枚举 | `Selection.ClearCharacterDirectFormatting(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | ClearCharacterStyle | function | 仅发现/枚举 | `Selection.ClearCharacterStyle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | ClearFormatting | function | 仅发现/枚举 | `Selection.ClearFormatting(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | ClearParagraphAllFormatting | function | 仅发现/枚举 | `Selection.ClearParagraphAllFormatting(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | ClearParagraphDirectFormatting | function | 仅发现/枚举 | `Selection.ClearParagraphDirectFormatting(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | ClearParagraphStyle | function | 仅发现/枚举 | `Selection.ClearParagraphStyle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Collapse | function | 仅发现/枚举 | `Selection.Collapse(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Columns | null | 仅发现/枚举 | 读取 `Selection.Columns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | ColumnSelectMode | boolean | 仅发现/枚举 | 读取 `Selection.ColumnSelectMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Comments | object | 仅发现/枚举 | 读取 `Selection.Comments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | ContentControls | object | 仅发现/枚举 | 读取 `Selection.ContentControls`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | ConvertToTable | function | 仅发现/枚举 | `Selection.ConvertToTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | ConvertToTableOld | function | 仅发现/枚举 | `Selection.ConvertToTableOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Copy | function | 仅发现/枚举 | `Selection.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | CopyAsPicture | function | 仅发现/枚举 | `Selection.CopyAsPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | CopyFormat | function | 仅发现/枚举 | `Selection.CopyFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | CreateAutoTextEntry | function | 仅发现/枚举 | `Selection.CreateAutoTextEntry(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | CreateTextbox | function | 仅发现/枚举 | `Selection.CreateTextbox(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Creator | number | 仅发现/枚举 | 读取 `Selection.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Cut | function | 仅发现/枚举 | `Selection.Cut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Delete | function | 仅发现/枚举 | `Selection.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | DetectLanguage | function | 仅发现/枚举 | `Selection.DetectLanguage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Document | object | 仅发现/枚举 | 读取 `Selection.Document`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | DocumentFields | object | 仅发现/枚举 | 读取 `Selection.DocumentFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Editors | object | 仅发现/枚举 | 读取 `Selection.Editors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | End | number | 仅发现/枚举 | 读取 `Selection.End`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | EndKey | function | 仅发现/枚举 | `Selection.EndKey(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | EndnoteOptions | object | 仅发现/枚举 | 读取 `Selection.EndnoteOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Endnotes | object | 仅发现/枚举 | 读取 `Selection.Endnotes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | EndOf | function | 仅发现/枚举 | `Selection.EndOf(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | EnhMetaFileBits | null | 仅发现/枚举 | 读取 `Selection.EnhMetaFileBits`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | EscapeKey | function | 仅发现/枚举 | `Selection.EscapeKey(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Expand | function | 仅发现/枚举 | `Selection.Expand(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | ExportAsFixedFormat | function | 仅发现/枚举 | `Selection.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Extend | function | 仅发现/枚举 | `Selection.Extend(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | ExtendMode | null | 仅发现/枚举 | 读取 `Selection.ExtendMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Fields | object | 仅发现/枚举 | 读取 `Selection.Fields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Find | object | 仅发现/枚举 | 读取 `Selection.Find`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | FitTextWidth | number | 仅发现/枚举 | 读取 `Selection.FitTextWidth`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Flags | number | 仅发现/枚举 | 读取 `Selection.Flags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Font | object | 仅发现/枚举 | 读取 `Selection.Font`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | FootnoteOptions | object | 仅发现/枚举 | 读取 `Selection.FootnoteOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Footnotes | object | 仅发现/枚举 | 读取 `Selection.Footnotes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | FormattedText | object | 仅发现/枚举 | 读取 `Selection.FormattedText`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | FormFields | object | 仅发现/枚举 | 读取 `Selection.FormFields`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Frames | object | 仅发现/枚举 | 读取 `Selection.Frames`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | GoTo | function | 仅发现/枚举 | `Selection.GoTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | GoToEditableRange | function | 仅发现/枚举 | `Selection.GoToEditableRange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | GoToNext | function | 仅发现/枚举 | `Selection.GoToNext(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | GoToPrevious | function | 仅发现/枚举 | `Selection.GoToPrevious(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | HasChildShapeRange | boolean | 仅发现/枚举 | 读取 `Selection.HasChildShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | HeaderFooter | null | 仅发现/枚举 | 读取 `Selection.HeaderFooter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | HomeKey | function | 仅发现/枚举 | `Selection.HomeKey(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | HTMLDivisions | object | 仅发现/枚举 | 读取 `Selection.HTMLDivisions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Hyperlinks | object | 仅发现/枚举 | 读取 `Selection.Hyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Information | function | 仅发现/枚举 | `Selection.Information(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InlineShapes | object | 仅发现/枚举 | 读取 `Selection.InlineShapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | InRange | function | 仅发现/枚举 | `Selection.InRange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertAfter | function | 仅发现/枚举 | `Selection.InsertAfter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertBefore | function | 仅发现/枚举 | `Selection.InsertBefore(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertBreak | function | 仅发现/枚举 | `Selection.InsertBreak(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertCaption | function | 仅发现/枚举 | `Selection.InsertCaption(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertCaptionXP | function | 仅发现/枚举 | `Selection.InsertCaptionXP(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertCells | function | 仅发现/枚举 | `Selection.InsertCells(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertColumns | function | 仅发现/枚举 | `Selection.InsertColumns(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertColumnsRight | function | 仅发现/枚举 | `Selection.InsertColumnsRight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertCrossReference | function | 仅发现/枚举 | `Selection.InsertCrossReference(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertCrossReference_2002 | function | 仅发现/枚举 | `Selection.InsertCrossReference_2002(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertDateTime | function | 仅发现/枚举 | `Selection.InsertDateTime(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertDateTimeOld | function | 仅发现/枚举 | `Selection.InsertDateTimeOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertFile | function | 仅发现/枚举 | `Selection.InsertFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertFormula | function | 仅发现/枚举 | `Selection.InsertFormula(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertManualContent | function | 仅发现/枚举 | `Selection.InsertManualContent(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertNewPage | function | 仅发现/枚举 | `Selection.InsertNewPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertParagraph | function | 仅发现/枚举 | `Selection.InsertParagraph(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertParagraphAfter | function | 仅发现/枚举 | `Selection.InsertParagraphAfter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertParagraphBefore | function | 仅发现/枚举 | `Selection.InsertParagraphBefore(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertRows | function | 仅发现/枚举 | `Selection.InsertRows(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertRowsAbove | function | 仅发现/枚举 | `Selection.InsertRowsAbove(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertRowsBelow | function | 仅发现/枚举 | `Selection.InsertRowsBelow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertStyleSeparator | function | 仅发现/枚举 | `Selection.InsertStyleSeparator(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertSymbol | function | 仅发现/枚举 | `Selection.InsertSymbol(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InsertXML | function | 仅发现/枚举 | `Selection.InsertXML(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | InStory | function | 仅发现/枚举 | `Selection.InStory(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | IPAtEndOfLine | null | 仅发现/枚举 | 读取 `Selection.IPAtEndOfLine`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | IsEndOfRowMark | boolean | 仅发现/枚举 | 读取 `Selection.IsEndOfRowMark`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | IsEqual | function | 仅发现/枚举 | `Selection.IsEqual(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | ItalicRun | function | 仅发现/枚举 | `Selection.ItalicRun(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | LanguageDetected | boolean | 仅发现/枚举 | 读取 `Selection.LanguageDetected`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | LanguageID | number | 仅发现/枚举 | 读取 `Selection.LanguageID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | LanguageIDFarEast | number | 仅发现/枚举 | 读取 `Selection.LanguageIDFarEast`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | LanguageIDOther | number | 仅发现/枚举 | 读取 `Selection.LanguageIDOther`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | LtrPara | function | 仅发现/枚举 | `Selection.LtrPara(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | LtrRun | function | 仅发现/枚举 | `Selection.LtrRun(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Move | function | 仅发现/枚举 | `Selection.Move(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | MoveDown | function | 仅发现/枚举 | `Selection.MoveDown(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | MoveEnd | function | 仅发现/枚举 | `Selection.MoveEnd(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | MoveEndUntil | function | 仅发现/枚举 | `Selection.MoveEndUntil(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | MoveEndWhile | function | 仅发现/枚举 | `Selection.MoveEndWhile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | MoveLeft | function | 仅发现/枚举 | `Selection.MoveLeft(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | MoveRight | function | 仅发现/枚举 | `Selection.MoveRight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | MoveStart | function | 仅发现/枚举 | `Selection.MoveStart(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | MoveStartUntil | function | 仅发现/枚举 | `Selection.MoveStartUntil(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | MoveStartWhile | function | 仅发现/枚举 | `Selection.MoveStartWhile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | MoveUntil | function | 仅发现/枚举 | `Selection.MoveUntil(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | MoveUp | function | 仅发现/枚举 | `Selection.MoveUp(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | MoveWhile | function | 仅发现/枚举 | `Selection.MoveWhile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Next | function | 仅发现/枚举 | `Selection.Next(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | NextField | function | 仅发现/枚举 | `Selection.NextField(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | NextRevision | function | 仅发现/枚举 | `Selection.NextRevision(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | NextSubdocument | function | 仅发现/枚举 | `Selection.NextSubdocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | NoProofing | number | 仅发现/枚举 | 读取 `Selection.NoProofing`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | OMaths | object | 仅发现/枚举 | 读取 `Selection.OMaths`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Orientation | number | 仅发现/枚举 | 读取 `Selection.Orientation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | PageSetup | object | 仅发现/枚举 | 读取 `Selection.PageSetup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | ParagraphFormat | object | 仅发现/枚举 | 读取 `Selection.ParagraphFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Paragraphs | object | 仅发现/枚举 | 读取 `Selection.Paragraphs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Parent | object | 仅发现/枚举 | 读取 `Selection.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | ParentContentControl | null | 仅发现/枚举 | 读取 `Selection.ParentContentControl`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Paste | function | 仅发现/枚举 | `Selection.Paste(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | PasteAndFormat | function | 仅发现/枚举 | `Selection.PasteAndFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | PasteAppendTable | function | 仅发现/枚举 | `Selection.PasteAppendTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | PasteAsNestedTable | function | 仅发现/枚举 | `Selection.PasteAsNestedTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | PasteExcelTable | function | 仅发现/枚举 | `Selection.PasteExcelTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | PasteFormat | function | 仅发现/枚举 | `Selection.PasteFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | PasteSpecial | function | 仅发现/枚举 | `Selection.PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Previous | function | 仅发现/枚举 | `Selection.Previous(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | PreviousBookmarkID | number | 仅发现/枚举 | 读取 `Selection.PreviousBookmarkID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | PreviousField | function | 仅发现/枚举 | `Selection.PreviousField(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | PreviousRevision | function | 仅发现/枚举 | `Selection.PreviousRevision(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | PreviousSubdocument | function | 仅发现/枚举 | `Selection.PreviousSubdocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Range | object | 仅发现/枚举 | 读取 `Selection.Range`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | ReadingModeGrowFont | function | 仅发现/枚举 | `Selection.ReadingModeGrowFont(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | ReadingModeShrinkFont | function | 仅发现/枚举 | `Selection.ReadingModeShrinkFont(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Rows | null | 仅发现/枚举 | 读取 `Selection.Rows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | RtlPara | function | 仅发现/枚举 | `Selection.RtlPara(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | RtlRun | function | 仅发现/枚举 | `Selection.RtlRun(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Sections | object | 仅发现/枚举 | 读取 `Selection.Sections`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Select | function | 仅发现/枚举 | `Selection.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SelectCell | function | 仅发现/枚举 | `Selection.SelectCell(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SelectColumn | function | 仅发现/枚举 | `Selection.SelectColumn(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SelectCurrentAlignment | function | 仅发现/枚举 | `Selection.SelectCurrentAlignment(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SelectCurrentColor | function | 仅发现/枚举 | `Selection.SelectCurrentColor(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SelectCurrentFont | function | 仅发现/枚举 | `Selection.SelectCurrentFont(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SelectCurrentIndent | function | 仅发现/枚举 | `Selection.SelectCurrentIndent(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SelectCurrentSpacing | function | 仅发现/枚举 | `Selection.SelectCurrentSpacing(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SelectCurrentTabs | function | 仅发现/枚举 | `Selection.SelectCurrentTabs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SelectRow | function | 仅发现/枚举 | `Selection.SelectRow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Sentences | object | 仅发现/枚举 | 读取 `Selection.Sentences`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | SetRange | function | 仅发现/枚举 | `Selection.SetRange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Shading | object | 仅发现/枚举 | 读取 `Selection.Shading`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | ShapeRange | object | 仅发现/枚举 | 读取 `Selection.ShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Shrink | function | 仅发现/枚举 | `Selection.Shrink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | ShrinkDiscontiguousSelection | function | 仅发现/枚举 | `Selection.ShrinkDiscontiguousSelection(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SmartTags | object | 仅发现/枚举 | 读取 `Selection.SmartTags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Sort | function | 仅发现/枚举 | `Selection.Sort(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Sort2000 | function | 仅发现/枚举 | `Selection.Sort2000(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SortAscending | function | 仅发现/枚举 | `Selection.SortAscending(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SortByHeadings | function | 仅发现/枚举 | `Selection.SortByHeadings(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SortDescending | function | 仅发现/枚举 | `Selection.SortDescending(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SortOld | function | 仅发现/枚举 | `Selection.SortOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | SplitTable | function | 仅发现/枚举 | `Selection.SplitTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | Start | number | 仅发现/枚举 | 读取 `Selection.Start`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | StartIsActive | boolean | 仅发现/枚举 | 读取 `Selection.StartIsActive`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | StartOf | function | 仅发现/枚举 | `Selection.StartOf(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | StoryLength | number | 仅发现/枚举 | 读取 `Selection.StoryLength`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | StoryType | number | 仅发现/枚举 | 读取 `Selection.StoryType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Style | object | 仅发现/枚举 | 读取 `Selection.Style`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | StyleEx | object | 仅发现/枚举 | 读取 `Selection.StyleEx`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Tables | object | 仅发现/枚举 | 读取 `Selection.Tables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Text | string | 仅发现/枚举 | 读取 `Selection.Text`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | ToggleCharacterCode | function | 仅发现/枚举 | `Selection.ToggleCharacterCode(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | TopLevelTables | object | 仅发现/枚举 | 读取 `Selection.TopLevelTables`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Type | number | 仅发现/枚举 | 读取 `Selection.Type`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | TypeBackspace | function | 仅发现/枚举 | `Selection.TypeBackspace(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | TypeParagraph | function | 仅发现/枚举 | `Selection.TypeParagraph(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | TypeText | function | 仅发现/枚举 | `Selection.TypeText(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | WholeStory | function | 仅发现/枚举 | `Selection.WholeStory(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | WordOpenXML | string | 仅发现/枚举 | 读取 `Selection.WordOpenXML`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | Words | object | 仅发现/枚举 | 读取 `Selection.Words`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | XML | function | 仅发现/枚举 | `Selection.XML(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Selection | XMLNodes | object | 仅发现/枚举 | 读取 `Selection.XMLNodes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Selection | XMLParentNode | null | 仅发现/枚举 | 读取 `Selection.XMLParentNode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Tables | Add | function | 有同名显式探测；详情看宿主章节 | `Tables.Add(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Tables | AddOld | function | 仅发现/枚举 | `Tables.AddOld(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Tables | Application | object | 仅发现/枚举 | 读取 `Tables.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Tables | Count | number | 仅发现/枚举 | 读取 `Tables.Count`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Tables | Creator | number | 仅发现/枚举 | 读取 `Tables.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Tables | Item | function | 仅发现/枚举 | `Tables.Item(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Writer / WPS | Tables | NestingLevel | number | 仅发现/枚举 | 读取 `Tables.NestingLevel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Writer / WPS | Tables | Parent | object | 仅发现/枚举 | 读取 `Tables.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
