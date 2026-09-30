# 安全报告

请使用仓库的 [私密漏洞报告](https://github.com/humoumou1215/wps-mcp/security/advisories/new)，不要在公开 Issue 中附上真实密钥、Headers、文档内容或可利用细节。报告应包含受影响版本、最小复现和影响范围。

当前维护 `main` 和最新发布版本。修复发布后建议更新到最新版本。

本服务只能绑定本机 loopback；WPS API 代码只读检查是 best-effort 静态检查，不能替代沙箱。Render 可以修改文档，执行前应使用可信代码并核实目标文档。本地 `config.json`、`state.json`、会话和日志不应提交到仓库。
