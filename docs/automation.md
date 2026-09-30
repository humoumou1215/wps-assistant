# 仓库与自动化维护

公开仓库：[humoumou1215/wps-mcp](https://github.com/humoumou1215/wps-mcp)。项目采用 MIT；`package.json` 的 `private: true` 仅防止误发到 npm，不影响 GitHub 可见性。

## 工作流

| 工作流 | 触发 | 检查或产物 |
| --- | --- | --- |
| CI | main 推送、PR、手动、Release 调用 | Linux/Windows/macOS × Node 22.19.0/24，类型及 JS 语法检查、模拟测试和 JUnit 报告 |
| CI 打包 | 同上 | Shell 语法、生产依赖高危审计、压缩包/校验和、独立目录安装及 HTTP/Add-in 资源冒烟 |
| Security | main 推送、PR、每周一 10:23（北京时间）、手动 | CodeQL；PR 检查新增依赖高危漏洞；定时及手动进行生产依赖审计 |
| Release | 推送 `v*` 标签 | 完整 CI 成功后检查版本一致性，发布 GitHub Release、安装包和 SHA-256 |
| Dependabot | 每周一 03:00（北京时间） | npm 和 Actions 更新 PR；小版本/补丁分组，保留人工审查 |

GitHub Actions 固定到完整 commit SHA，由 Dependabot 更新。工作流默认只有 `contents: read`；CodeQL 上传和 Release 发布在对应任务中单独授权。PR 使用 `pull_request`，无外部密钥，也不连接个人电脑或真实 WPS。

主分支保护要求 `CI passed` 和 `CodeQL`，分支必须与 main 保持同步，讨论必须解决，禁止强制推送和删除。个人项目不强制第二位审批者；仍必须通过 PR 合并。配置调整在 GitHub Settings → Branches。Actions 默认令牌为只读，不允许其创建/批准 PR。

## 发布

先确保本次变更已合并到 main，工作区干净。更新版本并通过 PR 合并：

```sh
npm version patch --no-git-tag-version
# 将 package.json / package-lock.json 的变更提交到分支并创建 PR
```

合并后拉取 main，再创建与包版本相同的标签（下面以 0.1.1 为例）：

```sh
git switch main
git pull --ff-only
git tag -a v0.1.1 -m "Release v0.1.1"
git push origin v0.1.1
```

只有标签对应提交的完整 CI 成功且该提交已合并到 main 才发布；标签和 `package.json` 版本不一致会失败。包含 `-` 的版本发布为 prerelease。此流程不发布到 npm，不自动递增版本，也不自动合并依赖更新。

发布包含编译后的服务、Add-in、API skill、安装脚本、README、许可证和完整锁文件，不携带 Node.js 或依赖。解压后安装运行依赖即可启动：

```sh
npm ci --omit=dev
npm start
```

然后按 README 注册 Add-in。不要对发布包执行 `npm run build`；需要开发或运行实机测试时使用源码仓库。macOS 服务安装脚本可以直接使用包内的编译产物。

生产依赖审计阈值为 high；发现高危/严重漏洞时阻断 CI，并由 Dependabot 提交修复。CodeQL 的分析任务成功表示扫描执行成功，告警详情仍需在 Security → Code scanning 中审查。

## 真实 WPS 验收

CI 的宿主为模拟对象，不能证明真实 WPS API 兼容性。真实 ET/WPP/Writer 验收在安装 WPS 的本机显式运行 README 中的 `test:wps-live` 和 `test:wps-writer-live`。公开仓库不为 PR 配置个人电脑上的 self-hosted runner。
