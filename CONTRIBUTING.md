# 参与开发

安装 Node.js 22.19.0 或更高版本，克隆仓库后运行：

```sh
npm ci
npm run check
npm test
```

开发环境部署使用 `npm run install:macos` 或 `npm run install:windows`，详细约定见 [SPEC](docs/spec.md#development-deployment)。

从 `main` 创建功能分支，通过 Pull Request 合并。CI 必须通过，讨论必须解决。常规测试使用模拟 Add-in；涉及 WPS JS API 的变更还需使用可丢弃文档做实机验收，并在 PR 中记录 WPS 版本、操作系统和测试结果。真实测试命令见 README。

变更部署脚本时，在对应平台验证 Add-in 注册、重复部署和服务健康检查；使用临时目录测试注册逻辑，不覆盖真实用户配置。发布打包流程暂时撤下，后续重新设计。

不要提交真实密钥、文档、会话、运行日志或本地依赖目录。项目采用 MIT；第三方 vendored 代码的许可证以其随附文件为准。

工作流、仓库设置和版本发布说明见 [自动化维护指南](docs/spec.md#automation)。
