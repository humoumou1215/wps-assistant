# 验证范围与来源

来源：`reports.zip` 中的三个诊断结果 JSON（ET、WPS Writer、WPP Presentation），原始 `host-info.txt` 记录 UOS Desktop 20、WPS Office 2026 Summer Update 12.8.2.26885；JavaScript 宿主中显示 WPS API Version 12.0 / Build 26885。测试由该诊断 bundle 生成，发生在 Linux ARM64，不是当前 macOS。

## 状态定义

- **支持**：诊断运行时将该检查标为 `supported`。常见 `Application.*` 行只是读取属性类型；功能组项目才有临时对象/写入等行为探测。
- **缺失**：检查结果为 `missing`，通常是属性未定义。
- **存在但调用失败**：成员或事件名存在，但报告所用的特定调用未成功；不能据此推导 API 永远不可用。
- **仅发现/枚举**：从宿主对象上枚举到 member/type，没有执行调用。

## 诊断报告汇总

| Host | WPS app | Version | Build | Supported | Missing | Present but failed |
| --- | --- | --- | --- | --- | --- | --- |
| Spreadsheet / ET | WPS表格 | 12.0 | 26885 | 88 | 25 | 1 |
| Writer / WPS | WPS文字 | 12.0 | 12.1.2.26885 | 72 | 31 | 2 |
| Presentation / WPP | WPS 演示 | 12.0 | 12.1.2.26885 | 70 | 36 | 1 |

完整 API inventory 见 [catalog](api-catalog.md)；逐项 test fixture 见 spreadsheet/writer/presentation guide。Mac 当前版本的真实 Add-in / Codex 验证记录见 [macOS live validation](macos-validation.md)。