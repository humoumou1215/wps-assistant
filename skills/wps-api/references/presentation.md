# 演示操作指引

## 定位与读取

`wpsDocument.Slides.Item(i)`、`slide.Shapes.Item(j)` 通常为 1-based 集合；Shape.Id、Slide.SlideID 是稳定定位依据，页码用于人类描述。先读取相关文本、HasTable/HasChart、表头、几何和关键样式，避免转储全部空白装饰。

```js
const slides = [];
for (let i = 1; i <= wpsDocument.Slides.Count; i = i + 1) {
  const slide = wpsDocument.Slides.Item(i);
  const shapes = [];
  for (let j = 1; j <= slide.Shapes.Count; j = j + 1) {
    const shape = slide.Shapes.Item(j);
    const text = shape.HasTextFrame ? shape.TextFrame.TextRange.Text : '';
    if (text || shape.HasTable || shape.HasChart) {
      shapes.push({对象ID: shape.Id, 名称: shape.Name, 表格: shape.HasTable,
        图表: shape.HasChart, 文本: text});
    }
  }
  slides.push({页码: i, 页面ID: slide.SlideID, 对象: shapes});
}
return slides;
```

## 更新

只在 Render 改 `shape.TextFrame.TextRange.Text`、`shape.Table.Cell(r,c).Shape.TextFrame.TextRange.Text` 或图表数据。保留原对象、位置尺寸和样式，按实际稳定 ID 查找并核实存在。图表读取 `shape.Chart` 的可用系列/数据路径，再写后读回；写方法的存在性检查也仅放在 Render。

表格动态增减行列、原生图表、模板样式和防溢出按 [报告绑定](report-sync.md) 操作。创建对象或探测未知写 API 前保留恢复依据，失败后先检查当前状态，不重复追加。

## 历史诊断的查阅边界

以下为历史 UOS 诊断，API 枚举不是调用验证；仅查具体成员。平台结论先看 [验证范围](validation.md)。

# Presentation / WPP API guide

诊断环境：UnionTech UOS 20 (1060) / WPS Office 2026 Summer Update 12.8.2.26885；WPS 演示 12.0 Build 12.1.2.26885。

## API 根对象与常用入口

演示宿主：从本次调用绑定的原生演示文稿 `wpsDocument` → `Slides.Item(n)` → `Shapes` → `Shape`/`Chart`。先枚举实际页及对象 ID、名字和文本，再创建 Render。`Application.ActivePresentation` 仅代表活动演示文稿，不能代替绑定对象；页和对象位置使用已核实的 ID 或坐标。

```js
const pres = wpsDocument;
const slide = pres.Slides.Item(1);
const shapes = [];
// 自增必须写成 i = i + 1：静态守卫把 `++` / `--` 判为 mutation，`i++` 会直接报 READ_ONLY_VIOLATION
for (let i = 1; i <= slide.Shapes.Count; i = i + 1) { const s = slide.Shapes.Item(i); shapes.push({ name: s.Name, type: s.Type }); }
return { name: pres.Name, count: pres.Slides.Count, shapes };
```

## 显式探测结果（逐项）

状态说明：`支持`=报告中的探测成功；`缺失`=成员未提供；`存在但调用失败`=存在但报告所用调用失败。以下为历史报告，不能保证当前宿主可调用；只读成员可用查询检查，写操作成员的检查及调用只放进 Render，不能按表中通用建议在只读通道探测。

| 组 | 探测项目 / API | 结果 | 诊断细节 | 用法/建议 |
| --- | --- | --- | --- | --- |
| common | Application.Name | 支持 | string | `return Application.Name;` |
| common | Application.Version | 支持 | string | `return Application.Version;` |
| common | Application.Build | 支持 | string | `return Application.Build;` |
| common | Application.Path | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.StartupPath | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.OperatingSystem | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.UserName | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.ActiveWindow | 支持 | object | 活动窗口/选区的历史观测；绑定位置按 `wps_get_document` 或引用快照中的坐标从 `wpsDocument` 读取。 |
| common | Application.Windows | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Selection | 缺失 | undefined | 活动窗口/选区的历史观测；绑定位置按 `wps_get_document` 或引用快照中的坐标从 `wpsDocument` 读取。 |
| common | Application.ApiEvent | 支持 | object | API 事件注册/注销；报告中“listener registration succeeded”表示注册成功，不代表具体事件参数结构已验证。 |
| common | Application.CommandBars | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.COMAddIns | 支持 | null | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Visible | 支持 | number | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.DisplayAlerts | 支持 | number | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.ScreenUpdating | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.StatusBar | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Caption | 支持 | string | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.LanguageSettings | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Options | 支持 | object | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.RecentFiles | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.FileDialog | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Undo | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Redo | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Run | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.OnTime | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.SendKeys | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Quit | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Activate | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Calculate | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.CalculateFull | 缺失 | undefined | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| common | Application.Documents | 缺失 | undefined | 本宿主诊断中未提供；不要直接使用。若目标版本不同，可在只读守卫允许时检查成员类型。 |
| common | Application.ActiveDocument | 缺失 | undefined | 活动对象的历史观测；当前绑定文档使用 `wpsDocument`，不是此成员。 |
| common | Application.Workbooks | 缺失 | undefined | 本宿主诊断中未提供；不要直接使用。若目标版本不同，可在只读守卫允许时检查成员类型。 |
| common | Application.ActiveWorkbook | 缺失 | undefined | 活动对象的历史观测；当前绑定文档使用 `wpsDocument`，不是此成员。 |
| common | Application.Presentations | 支持 | object | 演示：`return Application.Presentations.Count;` |
| common | Application.ActivePresentation | 支持 | object | 活动对象的历史观测；当前绑定文档使用 `wpsDocument`，不是此成员。 |
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
| common | Application.WppApplication | 支持 | function | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
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
| events | PresentationOpen | 支持 | listener registration succeeded | 事件名 `PresentationOpen`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | PresentationClose | 支持 | listener registration succeeded | 事件名 `PresentationClose`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | PresentationSave | 支持 | listener registration succeeded | 事件名 `PresentationSave`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | PresentationBeforeSave | 支持 | listener registration succeeded | 事件名 `PresentationBeforeSave`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | WindowActivate | 支持 | listener registration succeeded | 事件名 `WindowActivate`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | WindowDeactivate | 存在但调用失败 | Error: WindowDeactivate is not a valid event name. | 事件名 `WindowDeactivate`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | WindowSelectionChange | 支持 | listener registration succeeded | 事件名 `WindowSelectionChange`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | SlideSelectionChanged | 支持 | listener registration succeeded | 事件名 `SlideSelectionChanged`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | SlideShowBegin | 支持 | listener registration succeeded | 事件名 `SlideShowBegin`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | SlideShowEnd | 支持 | listener registration succeeded | 事件名 `SlideShowEnd`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | SlideShowNextSlide | 支持 | listener registration succeeded | 事件名 `SlideShowNextSlide`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | SlideShowOnNext | 支持 | listener registration succeeded | 事件名 `SlideShowOnNext`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| events | SlideShowOnPrevious | 支持 | listener registration succeeded | 事件名 `SlideShowOnPrevious`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。 |
| wpp | Application.Presentations | 支持 | object | 演示：`return Application.Presentations.Count;` |
| wpp | Application.ActivePresentation | 支持 | object | 活动对象的历史观测；当前绑定文档使用 `wpsDocument`，不是此成员。 |
| wpp | Application.ActiveWindow | 支持 | object | 活动窗口/选区的历史观测；绑定位置按 `wps_get_document` 或引用快照中的坐标从 `wpsDocument` 读取。 |
| wpp | Presentations.Add | 支持 | function | 演示：仅在临时/测试演示文稿或获授权的 Render 中调用 `Application.Presentations.Add()`。 |
| wpp | Create temporary presentation | 支持 | created | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| wpp | Shapes.AddTextbox | 支持 | — | 演示：从 `wpsDocument.Slides.Item(n).Shapes` 取得集合；创建/修改仅允许在 `wps_run_render` 中。 |
| wpp | TextFrame.TextRange.Text write | 支持 | — | 演示：`shape.TextFrame.TextRange.Text` 读取文本；赋值只放在 `wps_run_render` 中。 |
| wpp | Shape geometry write | 支持 | — | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| wpp | Shape.Fill access/write | 支持 | — | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| wpp | Shape.Duplicate | 支持 | — | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
| wpp | Shapes.AddTable | 支持 | — | 演示：从 `wpsDocument.Slides.Item(n).Shapes` 取得集合；创建/修改仅允许在 `wps_run_render` 中。 |
| wpp | Table.Cell text write | 支持 | — | 演示：从绑定页的表格 shape.Table 访问单元格；单元格文本写入只放在 Render 中，签名需在目标版本确认。 |
| wpp | Temporary presentation close without save | 支持 | — | 见本节宿主状态与 `显式探测`；不确定签名时先用 `wps_run_readonly_code` 读取成员/返回类型，再在测试副本验证。 |
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

### `Application` (130 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| Activate | function | for-in | — | `Application.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ActivatePromeBrowserPage | function | for-in | — | `Application.ActivatePromeBrowserPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Active | number | for-in | — | 读取 `Application.Active`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveEncryptionSession | number | for-in | — | 读取 `Application.ActiveEncryptionSession`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveMainWindow | object | for-in | — | 读取 `Application.ActiveMainWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActivePresentation | object | for-in | — | 读取 `Application.ActivePresentation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActivePrinter | string | for-in | — | 读取 `Application.ActivePrinter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveProtectedViewWindow | object | for-in | — | 读取 `Application.ActiveProtectedViewWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActiveWindow | object | for-in | — | 读取 `Application.ActiveWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AddIns | object | for-in | — | 读取 `Application.AddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AnswerWizard | object | for-in | — | 读取 `Application.AnswerWizard`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ApiEvent | object | for-in | — | 读取 `Application.ApiEvent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application | object | for-in | — | 读取 `Application.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Arg2Json | function | for-in | — | `Application.Arg2Json(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Assistance | object | for-in | — | 读取 `Application.Assistance`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Assistant | object | for-in | — | 读取 `Application.Assistant`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutoCorrect | object | for-in | — | 读取 `Application.AutoCorrect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AutomationSecurity | number | for-in | — | 读取 `Application.AutomationSecurity`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BrowserGroups | object | for-in | — | 读取 `Application.BrowserGroups`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Build | string | for-in | — | 读取 `Application.Build`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| COMAddIns | null | for-in | — | 读取 `Application.COMAddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Caption | string | for-in | — | 读取 `Application.Caption`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ChartDataPointTrack | boolean | for-in | — | 读取 `Application.ChartDataPointTrack`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CommandBars | object | for-in | — | 读取 `Application.CommandBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Compress | object | for-in | — | 读取 `Application.Compress`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CreateDataBuffer | function | for-in | — | `Application.CreateDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateObject | function | for-in | — | `Application.CreateObject(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreatePromeBrowserPage | function | for-in | — | `Application.CreatePromeBrowserPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreatePromeFakeTab | function | for-in | — | `Application.CreatePromeFakeTab(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateTaskPane | function | for-in | — | `Application.CreateTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateWebDialog | function | for-in | — | `Application.CreateWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Creator | number | for-in | — | 读取 `Application.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CurrentWPSAddIn | object | for-in | — | 读取 `Application.CurrentWPSAddIn`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomDomain | string | for-in | — | 读取 `Application.CustomDomain`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultWebOptions | object | for-in | — | 读取 `Application.DefaultWebOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DeleteDataBuffer | function | for-in | — | `Application.DeleteDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Dialogs | null | for-in | — | 读取 `Application.Dialogs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayAlerts | number | for-in | — | 读取 `Application.DisplayAlerts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayDocumentInformationPanel | boolean | for-in | — | 读取 `Application.DisplayDocumentInformationPanel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayGridLines | number | for-in | — | 读取 `Application.DisplayGridLines`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayGuides | number | for-in | — | 读取 `Application.DisplayGuides`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Enum | object | for-in | — | 读取 `Application.Enum`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Env | object | for-in | — | 读取 `Application.Env`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ExecFunc | function | for-in | — | `Application.ExecFunc(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FeatureInstall | number | for-in | — | 读取 `Application.FeatureInstall`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileConverters | object | for-in | — | 读取 `Application.FileConverters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileDialog | function | for-in | — | `Application.FileDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FileFind | object | for-in | — | 读取 `Application.FileFind`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileSearch | object | for-in | — | 读取 `Application.FileSearch`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileSystem | object | for-in | — | 读取 `Application.FileSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FileValidation | number | for-in | — | 读取 `Application.FileValidation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GetApplicationEx | function | for-in | — | `Application.GetApplicationEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetDataBuffer | function | for-in | — | `Application.GetDataBuffer(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetJSReturnValue | function | for-in | — | `Application.GetJSReturnValue(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetOptionFlag | function | for-in | — | `Application.GetOptionFlag(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetTaskPane | function | for-in | — | `Application.GetTaskPane(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetWebDialog | function | for-in | — | `Application.GetWebDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Height | number | for-in | — | 读取 `Application.Height`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Help | function | for-in | — | `Application.Help(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InfoCollect | object | for-in | — | 读取 `Application.InfoCollect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IsLastIOBroken | number | for-in | — | 读取 `Application.IsLastIOBroken`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IsSandboxed | boolean | for-in | — | 读取 `Application.IsSandboxed`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| JS2Variant | function | for-in | — | `Application.JS2Variant(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| JSIDE | null | for-in | — | 读取 `Application.JSIDE`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LanguageSettings | object | for-in | — | 读取 `Application.LanguageSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LaunchPublishSlidesDialog | function | for-in | — | `Application.LaunchPublishSlidesDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| LaunchSendToPPTDialog | function | for-in | — | `Application.LaunchSendToPPTDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Left | number | for-in | — | 读取 `Application.Left`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MainWindows | object | for-in | — | 读取 `Application.MainWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Marker | null | for-in | — | 读取 `Application.Marker`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MsoDebugOptions | object | for-in | — | 读取 `Application.MsoDebugOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Name | string | for-in | — | 读取 `Application.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NewEnum | object | for-in | — | 读取 `Application.NewEnum`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NewPresentation | object | for-in | — | 读取 `Application.NewPresentation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OAAssist | object | for-in | — | 读取 `Application.OAAssist`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OpenFileLocationInStartPage | function | for-in | — | `Application.OpenFileLocationInStartPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OpenThemeFile | function | for-in | — | `Application.OpenThemeFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OpenWebUrl | function | for-in | — | `Application.OpenWebUrl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| OperatingSystem | string | for-in | — | 读取 `Application.OperatingSystem`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Options | object | for-in | — | 读取 `Application.Options`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PPFileDialog | function | for-in | — | `Application.PPFileDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Path | string | for-in | — | 读取 `Application.Path`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PluginStorage | object | for-in | — | 读取 `Application.PluginStorage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Presentations | object | for-in | — | 读取 `Application.Presentations`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ProductCode | string | for-in | — | 读取 `Application.ProductCode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PromeAddPage | function | for-in | — | `Application.PromeAddPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PromeName | string | for-in | — | 读取 `Application.PromeName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PromeNewDocument | function | for-in | — | `Application.PromeNewDocument(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PromeTidyModeChange | function | for-in | — | `Application.PromeTidyModeChange(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ProtectedViewWindows | object | for-in | — | 读取 `Application.ProtectedViewWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Quit | function | for-in | — | `Application.Quit(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ResampleMediaTasks | object | for-in | — | 读取 `Application.ResampleMediaTasks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Run | function | for-in | — | `Application.Run(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SetOptionFlag | function | for-in | — | `Application.SetOptionFlag(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SetPerfMarker | function | for-in | — | `Application.SetPerfMarker(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowDialog | function | for-in | — | `Application.ShowDialog(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowDialogEx | function | for-in | — | `Application.ShowDialogEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowExceptionError | function | for-in | — | `Application.ShowExceptionError(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ShowStartupDialog | number | for-in | — | 读取 `Application.ShowStartupDialog`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShowWindowsInTaskbar | number | for-in | — | 读取 `Application.ShowWindowsInTaskbar`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SlideShowWindows | object | for-in | — | 读取 `Application.SlideShowWindows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartArtColors | object | for-in | — | 读取 `Application.SmartArtColors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartArtLayouts | object | for-in | — | 读取 `Application.SmartArtLayouts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartArtQuickStyles | object | for-in | — | 读取 `Application.SmartArtQuickStyles`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| StartAccess | function | for-in | — | `Application.StartAccess(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| StartNewUndoEntry | function | for-in | — | `Application.StartNewUndoEntry(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| TabPages | object | for-in | — | 读取 `Application.TabPages`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TaskPanesEx | object | for-in | — | 读取 `Application.TaskPanesEx`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ThisBrowser | object | for-in | — | 读取 `Application.ThisBrowser`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Top | number | for-in | — | 读取 `Application.Top`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UpdateRibbon | function | for-in | — | `Application.UpdateRibbon(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UserName | string | for-in | — | 读取 `Application.UserName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Version | string | for-in | — | 读取 `Application.Version`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Visible | number | for-in | — | 读取 `Application.Visible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WPSAddIns | object | for-in | — | 读取 `Application.WPSAddIns`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WPSCloudService | object | for-in | — | 读取 `Application.WPSCloudService`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WebJS2Variant | function | for-in | — | `Application.WebJS2Variant(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| WebShape | null | for-in | — | 读取 `Application.WebShape`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Width | number | for-in | — | 读取 `Application.Width`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WindowState | number | for-in | — | 读取 `Application.WindowState`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Windows | object | for-in | — | 读取 `Application.Windows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WppApplication | function | for-in | — | `Application.WppApplication(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| WpsAccount | object | for-in | — | 读取 `Application.WpsAccount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WpsConfig | object | for-in | — | 读取 `Application.WpsConfig`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WpsHttpRequests | object | for-in | — | 读取 `Application.WpsHttpRequests`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WrapCallbackArg | function | for-in | — | `Application.WrapCallbackArg(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
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

### `Presentation` (129 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| AcceptAll | function | for-in | — | `Presentation.AcceptAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ActiveWindow | object | for-in | — | 读取 `Presentation.ActiveWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AddBaseline | function | for-in | — | `Presentation.AddBaseline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddTitleMaster | function | for-in | — | `Presentation.AddTitleMaster(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddToFavorites | function | for-in | — | `Presentation.AddToFavorites(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application | object | for-in | — | 读取 `Presentation.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ApplyTemplate | function | for-in | — | `Presentation.ApplyTemplate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ApplyTemplate2 | function | for-in | — | `Presentation.ApplyTemplate2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ApplyTheme | function | for-in | — | `Presentation.ApplyTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Broadcast | object | for-in | — | 读取 `Presentation.Broadcast`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BuiltInDocumentProperties | object | for-in | — | 读取 `Presentation.BuiltInDocumentProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CanCheckIn | function | for-in | — | `Presentation.CanCheckIn(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ChartDataPointTrack | boolean | for-in | — | 读取 `Presentation.ChartDataPointTrack`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CheckIn | function | for-in | — | `Presentation.CheckIn(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CheckInWithVersion | function | for-in | — | `Presentation.CheckInWithVersion(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Close | function | for-in | — | `Presentation.Close(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Coauthoring | object | for-in | — | 读取 `Presentation.Coauthoring`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ColorSchemes | object | for-in | — | 读取 `Presentation.ColorSchemes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CommandBars | object | for-in | — | 读取 `Presentation.CommandBars`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Container | null | for-in | — | 读取 `Presentation.Container`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ContentTypeProperties | object | for-in | — | 读取 `Presentation.ContentTypeProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Convert | function | for-in | — | `Presentation.Convert(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Convert2 | function | for-in | — | `Presentation.Convert2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateVideo | function | for-in | — | `Presentation.CreateVideo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CreateVideoStatus | number | for-in | — | 读取 `Presentation.CreateVideoStatus`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomDocumentProperties | object | for-in | — | 读取 `Presentation.CustomDocumentProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomXMLParts | object | for-in | — | 读取 `Presentation.CustomXMLParts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomerData | object | for-in | — | 读取 `Presentation.CustomerData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultLanguageID | number | for-in | — | 读取 `Presentation.DefaultLanguageID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DefaultShape | object | for-in | — | 读取 `Presentation.DefaultShape`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DeleteSection | function | for-in | — | `Presentation.DeleteSection(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Designs | object | for-in | — | 读取 `Presentation.Designs`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisableSections | function | for-in | — | `Presentation.DisableSections(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| DisplayComments | number | for-in | — | 读取 `Presentation.DisplayComments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DocumentInspectors | object | for-in | — | 读取 `Presentation.DocumentInspectors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DocumentLibraryVersions | object | for-in | — | 读取 `Presentation.DocumentLibraryVersions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EncryptionProvider | string | for-in | — | 读取 `Presentation.EncryptionProvider`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| EndReview | function | for-in | — | `Presentation.EndReview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| EnsureAllMediaUpgraded | function | for-in | — | `Presentation.EnsureAllMediaUpgraded(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| EnvelopeVisible | number | for-in | — | 读取 `Presentation.EnvelopeVisible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Export | function | for-in | — | `Presentation.Export(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExportAsFixedFormat | function | for-in | — | `Presentation.ExportAsFixedFormat(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExportAsFixedFormat2 | function | for-in | — | `Presentation.ExportAsFixedFormat2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExtraColors | object | for-in | — | 读取 `Presentation.ExtraColors`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FarEastLineBreakLanguage | number | for-in | — | 读取 `Presentation.FarEastLineBreakLanguage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FarEastLineBreakLevel | number | for-in | — | 读取 `Presentation.FarEastLineBreakLevel`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Final | boolean | for-in | — | 读取 `Presentation.Final`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FollowHyperlink | function | for-in | — | `Presentation.FollowHyperlink(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Fonts | object | for-in | — | 读取 `Presentation.Fonts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FullName | string | for-in | — | 读取 `Presentation.FullName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GetPresentationEx | function | for-in | — | `Presentation.GetPresentationEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetWorkflowTasks | function | for-in | — | `Presentation.GetWorkflowTasks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetWorkflowTemplates | function | for-in | — | `Presentation.GetWorkflowTemplates(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GridDistance | number | for-in | — | 读取 `Presentation.GridDistance`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Guides | object | for-in | — | 读取 `Presentation.Guides`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HTMLProject | object | for-in | — | 读取 `Presentation.HTMLProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HandoutMaster | object | for-in | — | 读取 `Presentation.HandoutMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasHandoutMaster | boolean | for-in | — | 读取 `Presentation.HasHandoutMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasNotesMaster | boolean | for-in | — | 读取 `Presentation.HasNotesMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasRevisionInfo | number | for-in | — | 读取 `Presentation.HasRevisionInfo`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasSections | boolean | for-in | — | 读取 `Presentation.HasSections`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasTitleMaster | number | for-in | — | 读取 `Presentation.HasTitleMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasVBProject | boolean | for-in | — | 读取 `Presentation.HasVBProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| InMergeMode | boolean | for-in | — | 读取 `Presentation.InMergeMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| InvalidateRightsInfo | function | for-in | — | `Presentation.InvalidateRightsInfo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| JSProject | null | for-in | — | 读取 `Presentation.JSProject`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LayoutDirection | number | for-in | — | 读取 `Presentation.LayoutDirection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LockServerFile | function | for-in | — | `Presentation.LockServerFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MakeIntoTemplate | function | for-in | — | `Presentation.MakeIntoTemplate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Merge | function | for-in | — | `Presentation.Merge(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MergeWithBaseline | function | for-in | — | `Presentation.MergeWithBaseline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Name | string | for-in | — | 读取 `Presentation.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NewWindow | function | for-in | — | `Presentation.NewWindow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| NoLineBreakAfter | string | for-in | — | 读取 `Presentation.NoLineBreakAfter`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NoLineBreakBefore | string | for-in | — | 读取 `Presentation.NoLineBreakBefore`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NotesMaster | object | for-in | — | 读取 `Presentation.NotesMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PageSetup | object | for-in | — | 读取 `Presentation.PageSetup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parent | object | for-in | — | 读取 `Presentation.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Password | string | for-in | — | 读取 `Presentation.Password`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PasswordEncryptionAlgorithm | string | for-in | — | 读取 `Presentation.PasswordEncryptionAlgorithm`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PasswordEncryptionFileProperties | boolean | for-in | — | 读取 `Presentation.PasswordEncryptionFileProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PasswordEncryptionKeyLength | number | for-in | — | 读取 `Presentation.PasswordEncryptionKeyLength`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PasswordEncryptionProvider | string | for-in | — | 读取 `Presentation.PasswordEncryptionProvider`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Path | string | for-in | — | 读取 `Presentation.Path`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Permission | object | for-in | — | 读取 `Presentation.Permission`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PrintOptions | object | for-in | — | 读取 `Presentation.PrintOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PrintOut | function | for-in | — | `Presentation.PrintOut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PublishObjects | object | for-in | — | 读取 `Presentation.PublishObjects`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PublishSlides | function | for-in | — | `Presentation.PublishSlides(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReadOnly | number | for-in | — | 读取 `Presentation.ReadOnly`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RejectAll | function | for-in | — | `Presentation.RejectAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ReloadAs | function | for-in | — | `Presentation.ReloadAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RemoveBaseline | function | for-in | — | `Presentation.RemoveBaseline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RemoveDocumentInformation | function | for-in | — | `Presentation.RemoveDocumentInformation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| RemovePersonalInformation | number | for-in | — | 读取 `Presentation.RemovePersonalInformation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ReplyWithChanges | function | for-in | — | `Presentation.ReplyWithChanges(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Research | object | for-in | — | 读取 `Presentation.Research`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Save | function | for-in | — | `Presentation.Save(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveAs | function | for-in | — | `Presentation.SaveAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveAsBinaryString | function | for-in | — | `Presentation.SaveAsBinaryString(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveAsUrl | function | for-in | — | `Presentation.SaveAsUrl(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SaveCopyAs | function | for-in | — | `Presentation.SaveCopyAs(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Saved | number | for-in | — | 读取 `Presentation.Saved`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SectionCount | number | for-in | — | 读取 `Presentation.SectionCount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SectionProperties | object | for-in | — | 读取 `Presentation.SectionProperties`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SendFaxOverInternet | function | for-in | — | `Presentation.SendFaxOverInternet(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SendForReview | function | for-in | — | `Presentation.SendForReview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ServerPolicy | object | for-in | — | 读取 `Presentation.ServerPolicy`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SetPasswordEncryptionOptions | function | for-in | — | `Presentation.SetPasswordEncryptionOptions(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SetUndoText | function | for-in | — | `Presentation.SetUndoText(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SharedWorkspace | object | for-in | — | 读取 `Presentation.SharedWorkspace`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Signatures | object | for-in | — | 读取 `Presentation.Signatures`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SlideMaster | object | for-in | — | 读取 `Presentation.SlideMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SlideShowSettings | object | for-in | — | 读取 `Presentation.SlideShowSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SlideShowWindow | null | for-in | — | 读取 `Presentation.SlideShowWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Slides | object | for-in | — | 读取 `Presentation.Slides`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SnapToGrid | number | for-in | — | 读取 `Presentation.SnapToGrid`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Sync | object | for-in | — | 读取 `Presentation.Sync`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Tags | object | for-in | — | 读取 `Presentation.Tags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TemplateName | string | for-in | — | 读取 `Presentation.TemplateName`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TitleMaster | object | for-in | — | 读取 `Presentation.TitleMaster`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| UpdateLinks | function | for-in | — | `Presentation.UpdateLinks(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| VBASigned | number | for-in | — | 读取 `Presentation.VBASigned`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WebOptions | object | for-in | — | 读取 `Presentation.WebOptions`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WebPagePreview | function | for-in | — | `Presentation.WebPagePreview(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Windows | object | for-in | — | 读取 `Presentation.Windows`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WritePassword | string | for-in | — | 读取 `Presentation.WritePassword`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| sblt | function | for-in | — | `Presentation.sblt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| sectionTitle | function | for-in | — | `Presentation.sectionTitle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |

### `Slides` (10 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| Add | function | for-in | — | `Slides.Add(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddSlide | function | for-in | — | `Slides.AddSlide(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application | object | for-in | — | 读取 `Slides.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Count | number | for-in | — | 读取 `Slides.Count`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| FindBySlideID | function | for-in | — | `Slides.FindBySlideID(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| InsertFromFile | function | for-in | — | `Slides.InsertFromFile(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Item | function | for-in | — | `Slides.Item(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Parent | object | for-in | — | 读取 `Slides.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Paste | function | for-in | — | `Slides.Paste(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Range | function | for-in | — | `Slides.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |

### `Slide` (45 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| Application | object | for-in | — | 读取 `Slide.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ApplyTemplate | function | for-in | — | `Slide.ApplyTemplate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ApplyTemplate2 | function | for-in | — | `Slide.ApplyTemplate2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ApplyTheme | function | for-in | — | `Slide.ApplyTheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ApplyThemeColorScheme | function | for-in | — | `Slide.ApplyThemeColorScheme(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Background | object | for-in | — | 读取 `Slide.Background`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BackgroundStyle | number | for-in | — | 读取 `Slide.BackgroundStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ColorScheme | object | for-in | — | 读取 `Slide.ColorScheme`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Comments | null | for-in | — | 读取 `Slide.Comments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Copy | function | for-in | — | `Slide.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CopyFormatPainter | function | for-in | — | `Slide.CopyFormatPainter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CustomLayout | object | for-in | — | 读取 `Slide.CustomLayout`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomerData | object | for-in | — | 读取 `Slide.CustomerData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Cut | function | for-in | — | `Slide.Cut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Delete | function | for-in | — | `Slide.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Design | object | for-in | — | 读取 `Slide.Design`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DisplayMasterShapes | number | for-in | — | 读取 `Slide.DisplayMasterShapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Duplicate | function | for-in | — | `Slide.Duplicate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Export | function | for-in | — | `Slide.Export(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FollowMasterBackground | number | for-in | — | 读取 `Slide.FollowMasterBackground`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasNotesPage | number | for-in | — | 读取 `Slide.HasNotesPage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HeadersFooters | object | for-in | — | 读取 `Slide.HeadersFooters`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Hyperlinks | object | for-in | — | 读取 `Slide.Hyperlinks`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Layout | number | for-in | — | 读取 `Slide.Layout`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Master | object | for-in | — | 读取 `Slide.Master`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MoveTo | function | for-in | — | `Slide.MoveTo(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| MoveToSectionStart | function | for-in | — | `Slide.MoveToSectionStart(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Name | string | for-in | — | 读取 `Slide.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NotesPage | object | for-in | — | 读取 `Slide.NotesPage`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parent | object | for-in | — | 读取 `Slide.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PasteFormatPainter | function | for-in | — | `Slide.PasteFormatPainter(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PrintSteps | number | for-in | — | 读取 `Slide.PrintSteps`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PublishSlides | function | for-in | — | `Slide.PublishSlides(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Scripts | object | for-in | — | 读取 `Slide.Scripts`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SectionNumber | number | for-in | — | 读取 `Slide.SectionNumber`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Select | function | for-in | — | `Slide.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Shapes | object | for-in | — | 读取 `Slide.Shapes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SlideID | number | for-in | — | 读取 `Slide.SlideID`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SlideIndex | number | for-in | — | 读取 `Slide.SlideIndex`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SlideNumber | number | for-in | — | 读取 `Slide.SlideNumber`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SlideShowTransition | object | for-in | — | 读取 `Slide.SlideShowTransition`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Tags | object | for-in | — | 读取 `Slide.Tags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ThemeColorScheme | object | for-in | — | 读取 `Slide.ThemeColorScheme`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TimeLine | object | for-in | — | 读取 `Slide.TimeLine`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| sectionIndex | number | for-in | — | 读取 `Slide.sectionIndex`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |

### `Shapes` (40 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| AddCallout | function | for-in | — | `Shapes.AddCallout(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddCanvas | function | for-in | — | `Shapes.AddCanvas(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddChart | function | for-in | — | `Shapes.AddChart(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddChart2 | function | for-in | — | `Shapes.AddChart2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddComment | function | for-in | — | `Shapes.AddComment(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddConnector | function | for-in | — | `Shapes.AddConnector(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddCurve | function | for-in | — | `Shapes.AddCurve(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddDiagram | function | for-in | — | `Shapes.AddDiagram(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddLabel | function | for-in | — | `Shapes.AddLabel(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddLine | function | for-in | — | `Shapes.AddLine(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddMath | function | for-in | — | `Shapes.AddMath(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddMediaObject | function | for-in | — | `Shapes.AddMediaObject(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddMediaObject2 | function | for-in | — | `Shapes.AddMediaObject2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddMediaObjectFromEmbedTag | function | for-in | — | `Shapes.AddMediaObjectFromEmbedTag(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddOLEObject | function | for-in | — | `Shapes.AddOLEObject(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddPicture | function | for-in | — | `Shapes.AddPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddPicture2 | function | for-in | — | `Shapes.AddPicture2(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddPlaceholder | function | for-in | — | `Shapes.AddPlaceholder(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddPolyline | function | for-in | — | `Shapes.AddPolyline(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddShape | function | for-in | — | `Shapes.AddShape(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddSmartArt | function | for-in | — | `Shapes.AddSmartArt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddTable | function | for-in | — | `Shapes.AddTable(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddTextEffect | function | for-in | — | `Shapes.AddTextEffect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddTextbox | function | for-in | — | `Shapes.AddTextbox(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddTitle | function | for-in | — | `Shapes.AddTitle(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddWebShape | function | for-in | — | `Shapes.AddWebShape(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AddWebShapeEx | function | for-in | — | `Shapes.AddWebShapeEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Application | object | for-in | — | 读取 `Shapes.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BuildFreeform | function | for-in | — | `Shapes.BuildFreeform(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Count | number | for-in | — | 读取 `Shapes.Count`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Creator | number | for-in | — | 读取 `Shapes.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasTitle | number | for-in | — | 读取 `Shapes.HasTitle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Item | function | for-in | — | `Shapes.Item(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Parent | object | for-in | — | 读取 `Shapes.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Paste | function | for-in | — | `Shapes.Paste(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PasteSpecial | function | for-in | — | `Shapes.PasteSpecial(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Placeholders | object | for-in | — | 读取 `Shapes.Placeholders`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Range | function | for-in | — | `Shapes.Range(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SelectAll | function | for-in | — | `Shapes.SelectAll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Title | null | for-in | — | 读取 `Shapes.Title`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |

### `Shape` (97 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| ActionSettings | object | for-in | — | 读取 `Shape.ActionSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Adjustments | object | for-in | — | 读取 `Shape.Adjustments`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AlternativeText | string | for-in | — | 读取 `Shape.AlternativeText`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| AnimationSettings | object | for-in | — | 读取 `Shape.AnimationSettings`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application | object | for-in | — | 读取 `Shape.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Apply | function | for-in | — | `Shape.Apply(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ApplyAnimation | function | for-in | — | `Shape.ApplyAnimation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| AutoShapeType | number | for-in | — | 读取 `Shape.AutoShapeType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BackgroundStyle | number | for-in | — | 读取 `Shape.BackgroundStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BlackWhiteMode | number | for-in | — | 读取 `Shape.BlackWhiteMode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Callout | object | for-in | — | 读取 `Shape.Callout`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CanvasCropBottom | function | for-in | — | `Shape.CanvasCropBottom(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CanvasCropLeft | function | for-in | — | `Shape.CanvasCropLeft(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CanvasCropRight | function | for-in | — | `Shape.CanvasCropRight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CanvasCropTop | function | for-in | — | `Shape.CanvasCropTop(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| CanvasItems | object | for-in | — | 读取 `Shape.CanvasItems`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Chart | null | for-in | — | 读取 `Shape.Chart`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Child | number | for-in | — | 读取 `Shape.Child`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ConnectionSiteCount | number | for-in | — | 读取 `Shape.ConnectionSiteCount`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Connector | number | for-in | — | 读取 `Shape.Connector`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ConnectorFormat | null | for-in | — | 读取 `Shape.ConnectorFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ConvertTextToSmartArt | function | for-in | — | `Shape.ConvertTextToSmartArt(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Copy | function | for-in | — | `Shape.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Creator | number | for-in | — | 读取 `Shape.Creator`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| CustomerData | object | for-in | — | 读取 `Shape.CustomerData`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Cut | function | for-in | — | `Shape.Cut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Delete | function | for-in | — | `Shape.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Diagram | object | for-in | — | 读取 `Shape.Diagram`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| DiagramNode | object | for-in | — | 读取 `Shape.DiagramNode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Duplicate | function | for-in | — | `Shape.Duplicate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Export | function | for-in | — | `Shape.Export(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Fill | object | for-in | — | 读取 `Shape.Fill`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Flip | function | for-in | — | `Shape.Flip(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Glow | object | for-in | — | 读取 `Shape.Glow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| GroupItems | null | for-in | — | 读取 `Shape.GroupItems`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasChart | number | for-in | — | 读取 `Shape.HasChart`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasDiagram | number | for-in | — | 读取 `Shape.HasDiagram`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasDiagramNode | number | for-in | — | 读取 `Shape.HasDiagramNode`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasSmartArt | number | for-in | — | 读取 `Shape.HasSmartArt`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasTable | number | for-in | — | 读取 `Shape.HasTable`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasTextFrame | number | for-in | — | 读取 `Shape.HasTextFrame`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HasWebShape | number | for-in | — | 读取 `Shape.HasWebShape`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Height | number | for-in | — | 读取 `Shape.Height`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| HorizontalFlip | number | for-in | — | 读取 `Shape.HorizontalFlip`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Id | number | for-in | — | 读取 `Shape.Id`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IdentificationText | null | for-in | — | 读取 `Shape.IdentificationText`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IncrementLeft | function | for-in | — | `Shape.IncrementLeft(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| IncrementRotation | function | for-in | — | `Shape.IncrementRotation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| IncrementTop | function | for-in | — | `Shape.IncrementTop(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Left | number | for-in | — | 读取 `Shape.Left`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Line | object | for-in | — | 读取 `Shape.Line`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LinkFormat | object | for-in | — | 读取 `Shape.LinkFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| LockAspectRatio | number | for-in | — | 读取 `Shape.LockAspectRatio`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MediaFormat | object | for-in | — | 读取 `Shape.MediaFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MediaType | null | for-in | — | 读取 `Shape.MediaType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Name | string | for-in | — | 读取 `Shape.Name`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Nodes | object | for-in | — | 读取 `Shape.Nodes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| OLEFormat | object | for-in | — | 读取 `Shape.OLEFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parent | object | for-in | — | 读取 `Shape.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ParentGroup | object | for-in | — | 读取 `Shape.ParentGroup`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PickUp | function | for-in | — | `Shape.PickUp(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PickupAnimation | function | for-in | — | `Shape.PickupAnimation(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PictureFormat | null | for-in | — | 读取 `Shape.PictureFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PlaceholderFormat | object | for-in | — | 读取 `Shape.PlaceholderFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RTF | null | for-in | — | 读取 `Shape.RTF`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Reflection | object | for-in | — | 读取 `Shape.Reflection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RerouteConnections | function | for-in | — | `Shape.RerouteConnections(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Rotation | number | for-in | — | 读取 `Shape.Rotation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SaveAsPicture | function | for-in | — | `Shape.SaveAsPicture(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ScaleHeight | function | for-in | — | `Shape.ScaleHeight(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ScaleWidth | function | for-in | — | `Shape.ScaleWidth(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Script | object | for-in | — | 读取 `Shape.Script`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Select | function | for-in | — | `Shape.Select(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SetShapesDefaultProperties | function | for-in | — | `Shape.SetShapesDefaultProperties(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Shadow | object | for-in | — | 读取 `Shape.Shadow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShapeStyle | number | for-in | — | 读取 `Shape.ShapeStyle`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmartArt | null | for-in | — | 读取 `Shape.SmartArt`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SoftEdge | object | for-in | — | 读取 `Shape.SoftEdge`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SoundFormat | object | for-in | — | 读取 `Shape.SoundFormat`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Table | null | for-in | — | 读取 `Shape.Table`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Tags | object | for-in | — | 读取 `Shape.Tags`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TextEffect | object | for-in | — | 读取 `Shape.TextEffect`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TextFrame | object | for-in | — | 读取 `Shape.TextFrame`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TextFrame2 | object | for-in | — | 读取 `Shape.TextFrame2`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ThreeD | object | for-in | — | 读取 `Shape.ThreeD`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Title | string | for-in | — | 读取 `Shape.Title`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Top | number | for-in | — | 读取 `Shape.Top`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Type | number | for-in | — | 读取 `Shape.Type`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Ungroup | function | for-in | — | `Shape.Ungroup(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| UpgradeMedia | function | for-in | — | `Shape.UpgradeMedia(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| VerticalFlip | number | for-in | — | 读取 `Shape.VerticalFlip`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Vertices | null | for-in | — | 读取 `Shape.Vertices`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Visible | number | for-in | — | 读取 `Shape.Visible`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WebShape | object | for-in | — | 读取 `Shape.WebShape`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Width | number | for-in | — | 读取 `Shape.Width`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ZOrder | function | for-in | — | `Shape.ZOrder(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ZOrderPosition | number | for-in | — | 读取 `Shape.ZOrderPosition`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |

### `ActiveWindow` (33 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| Activate | function | for-in | — | `ActiveWindow.Activate(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Active | number | for-in | — | 读取 `ActiveWindow.Active`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ActivePane | object | for-in | — | 读取 `ActiveWindow.ActivePane`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Application | object | for-in | — | 读取 `ActiveWindow.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| BlackAndWhite | number | for-in | — | 读取 `ActiveWindow.BlackAndWhite`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Caption | string | for-in | — | 读取 `ActiveWindow.Caption`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Close | function | for-in | — | `ActiveWindow.Close(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ExpandSection | function | for-in | — | `ActiveWindow.ExpandSection(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| FitToPage | function | for-in | — | `ActiveWindow.FitToPage(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetID | function | for-in | — | `ActiveWindow.GetID(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| GetWindowEx | function | for-in | — | `ActiveWindow.GetWindowEx(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Height | number | for-in | — | 读取 `ActiveWindow.Height`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| IsSectionExpanded | function | for-in | — | `ActiveWindow.IsSectionExpanded(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| LargeScroll | function | for-in | — | `ActiveWindow.LargeScroll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Left | number | for-in | — | 读取 `ActiveWindow.Left`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| MainWindow | object | for-in | — | 读取 `ActiveWindow.MainWindow`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| NewWindow | function | for-in | — | `ActiveWindow.NewWindow(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Panes | object | for-in | — | 读取 `ActiveWindow.Panes`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parent | object | for-in | — | 读取 `ActiveWindow.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| PointsToScreenPixelsX | function | for-in | — | `ActiveWindow.PointsToScreenPixelsX(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| PointsToScreenPixelsY | function | for-in | — | `ActiveWindow.PointsToScreenPixelsY(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Presentation | object | for-in | — | 读取 `ActiveWindow.Presentation`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| RangeFromPoint | function | for-in | — | `ActiveWindow.RangeFromPoint(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| ScrollIntoView | function | for-in | — | `ActiveWindow.ScrollIntoView(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Selection | object | for-in | — | 读取 `ActiveWindow.Selection`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SmallScroll | function | for-in | — | `ActiveWindow.SmallScroll(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| SplitHorizontal | number | for-in | — | 读取 `ActiveWindow.SplitHorizontal`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SplitVertical | number | for-in | — | 读取 `ActiveWindow.SplitVertical`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Top | number | for-in | — | 读取 `ActiveWindow.Top`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| View | object | for-in | — | 读取 `ActiveWindow.View`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ViewType | number | for-in | — | 读取 `ActiveWindow.ViewType`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Width | number | for-in | — | 读取 `ActiveWindow.Width`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| WindowState | number | for-in | — | 读取 `ActiveWindow.WindowState`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |

### `Selection` (13 members)

| 成员 | 类型 | 发现方式 | 访问错误 | 使用说明 |
| --- | --- | --- | --- | --- |
| Application | object | for-in | — | 读取 `Selection.Application`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ChildShapeRange | null | for-in | — | 读取 `Selection.ChildShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Copy | function | for-in | — | `Selection.Copy(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Cut | function | for-in | — | `Selection.Cut(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| Delete | function | for-in | — | `Selection.Delete(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |
| HasChildShapeRange | null | for-in | — | 读取 `Selection.HasChildShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Parent | object | for-in | — | 读取 `Selection.Parent`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| ShapeRange | null | for-in | — | 读取 `Selection.ShapeRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| SlideRange | object | for-in | — | 读取 `Selection.SlideRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TextRange | null | for-in | — | 读取 `Selection.TextRange`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| TextRange2 | object | for-in | — | 读取 `Selection.TextRange2`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Type | number | for-in | — | 读取 `Selection.Type`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。 |
| Unselect | function | for-in | — | `Selection.Unselect(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。 |

## 候选成员检查

`candidateScan` 是针对候选路径的存在性/类型快照，不是完整方法调用测试。

| 对象 | 成员 | 存在状态 | 类型 |
| --- | --- | --- | --- |
| Application | Name | 支持 | string |
| Application | Version | 支持 | string |
| Application | Build | 支持 | string |
| Application | Path | 支持 | string |
| Application | StartupPath | 缺失 | undefined |
| Application | OperatingSystem | 支持 | string |
| Application | UserName | 支持 | string |
| Application | ActiveWindow | 支持 | object |
| Application | Windows | 支持 | object |
| Application | Selection | 缺失 | undefined |
| Application | ApiEvent | 支持 | object |
| Application | CommandBars | 支持 | object |
| Application | COMAddIns | 支持 | null |
| Application | Visible | 支持 | number |
| Application | DisplayAlerts | 支持 | number |
| Application | ScreenUpdating | 缺失 | undefined |
| Application | StatusBar | 缺失 | undefined |
| Application | Caption | 支持 | string |
| Application | LanguageSettings | 支持 | object |
| Application | Options | 支持 | object |
| Application | RecentFiles | 缺失 | undefined |
| Application | FileDialog | 支持 | function |
| Application | Undo | 缺失 | undefined |
| Application | Redo | 缺失 | undefined |
| Application | Run | 支持 | function |
| Application | OnTime | 缺失 | undefined |
| Application | SendKeys | 缺失 | undefined |
| Application | Quit | 支持 | function |
| Application | Activate | 支持 | function |
| Application | Calculate | 缺失 | undefined |
| Application | CalculateFull | 缺失 | undefined |
| Application | Documents | 缺失 | undefined |
| Application | ActiveDocument | 缺失 | undefined |
| Application | Workbooks | 缺失 | undefined |
| Application | ActiveWorkbook | 缺失 | undefined |
| Application | Presentations | 支持 | object |
| Application | ActivePresentation | 支持 | object |
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
| Application | WppApplication | 支持 | function |
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
| Presentation | Name | 支持 | string |
| Presentation | FullName | 支持 | string |
| Presentation | Path | 支持 | string |
| Presentation | Saved | 支持 | number |
| Presentation | Slides | 支持 | object |
| Presentation | PageSetup | 支持 | object |
| Presentation | SlideMaster | 支持 | object |
| Presentation | Designs | 支持 | object |
| Presentation | SectionProperties | 支持 | object |
| Presentation | Tags | 支持 | object |
| Presentation | Windows | 支持 | object |
| Presentation | SlideShowSettings | 支持 | object |
| Presentation | Save | 支持 | function |
| Presentation | SaveAs | 支持 | function |
| Presentation | Close | 支持 | function |
| Presentation | ApplyTemplate | 支持 | function |
| Presentation | Export | 支持 | function |
| Presentation | PrintOut | 支持 | function |
| Slide | Name | 支持 | string |
| Slide | SlideID | 支持 | number |
| Slide | SlideIndex | 支持 | number |
| Slide | Shapes | 支持 | object |
| Slide | HeadersFooters | 支持 | object |
| Slide | NotesPage | 支持 | object |
| Slide | Master | 支持 | object |
| Slide | Layout | 支持 | number |
| Slide | Design | 支持 | object |
| Slide | Background | 支持 | object |
| Slide | ColorScheme | 支持 | object |
| Slide | FollowMasterBackground | 支持 | number |
| Slide | Select | 支持 | function |
| Slide | Delete | 支持 | function |
| Slide | Duplicate | 支持 | function |
| Slide | Copy | 支持 | function |
| Slide | MoveTo | 支持 | function |
| Slide | MoveToSectionStart | 支持 | function |
| Slide | ApplyTemplate | 支持 | function |
| Slide | Export | 支持 | function |
| Slide | SlideShowTransition | 支持 | object |
| Slide | TimeLine | 支持 | object |
| Slide | Tags | 支持 | object |
| Shapes | Count | 支持 | number |
| Shapes | Item | 支持 | function |
| Shapes | AddTextbox | 支持 | function |
| Shapes | AddTextBox | 缺失 | undefined |
| Shapes | AddShape | 支持 | function |
| Shapes | AddTable | 支持 | function |
| Shapes | AddPicture | 支持 | function |
| Shapes | AddChart | 支持 | function |
| Shapes | AddOLEObject | 支持 | function |
| Shapes | Range | 支持 | function |
| Shapes | SelectAll | 支持 | function |
| Shapes | Group | 缺失 | undefined |
| Shape | Name | 支持 | string |
| Shape | Id | 支持 | number |
| Shape | Type | 支持 | number |
| Shape | Left | 支持 | number |
| Shape | Top | 支持 | number |
| Shape | Width | 支持 | number |
| Shape | Height | 支持 | number |
| Shape | Rotation | 支持 | number |
| Shape | Visible | 支持 | number |
| Shape | TextFrame | 支持 | object |
| Shape | TextFrame2 | 支持 | object |
| Shape | Table | 支持 | null |
| Shape | Chart | 支持 | null |
| Shape | PictureFormat | 支持 | null |
| Shape | OLEFormat | 支持 | object |
| Shape | Fill | 支持 | object |
| Shape | Line | 支持 | object |
| Shape | Shadow | 支持 | object |
| Shape | ThreeD | 支持 | object |
| Shape | Hyperlink | 缺失 | undefined |
| Shape | ActionSettings | 支持 | object |
| Shape | GroupItems | 支持 | null |
| Shape | ParentGroup | 支持 | object |
| Shape | AlternativeText | 支持 | string |
| Shape | Title | 支持 | string |
| Shape | Tags | 支持 | object |
| Shape | Select | 支持 | function |
| Shape | Delete | 支持 | function |
| Shape | Duplicate | 支持 | function |
| Shape | Copy | 支持 | function |
| Shape | Cut | 支持 | function |
| Shape | ZOrder | 支持 | function |
| Shape | ScaleHeight | 支持 | function |
| Shape | ScaleWidth | 支持 | function |
| ActiveWindow | Selection | 支持 | object |
| ActiveWindow | View | 支持 | object |
| ActiveWindow | ViewType | 支持 | number |
| ActiveWindow | ActivePane | 支持 | object |
| ActiveWindow | Presentation | 支持 | object |
| ActiveWindow | Caption | 支持 | string |
| ActiveWindow | Activate | 支持 | function |
| Selection | Type | 支持 | number |
| Selection | ShapeRange | 支持 | null |
| Selection | SlideRange | 支持 | object |
| Selection | TextRange | 支持 | null |
| Selection | Copy | 支持 | function |
| Selection | Cut | 支持 | function |
| Selection | Paste | 缺失 | undefined |
| Selection | Unselect | 支持 | function |

## 应用侧建议

- 使用 `documentId` 定位文档，不要以文件名路由。
- 先检查活动对象、集合 Count 与目标名称；集合通常用 1-based `Item(index)`。
- 读 Range/表格/图表时控制输出规模，只返回标量、数组、普通 JSON 对象。
- API 返回 COM/WPS 宿主代理对象时不要直接 `return object`；显式映射为 JSON 字段。
- 本目录中带 `write` 的探测仅说明诊断工具在临时文档上完成操作；对 MCP 调用仍需严格遵循 `wps_run_render` 边界。
