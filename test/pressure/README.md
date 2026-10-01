# 手工 WPS 边界测试素材

此目录保存合成文档生成器、跨文件测试说明和评阅答案，不包含真实业务文档。它用于检查 Transform / Render 的语义映射、复杂对象与排版边界，不是并发吞吐量基准，也不属于 `npm test` 的自动测试。

## 环境与生成

需要 Python 3.10 或更高版本；在仓库根目录执行以下命令。Windows 可用 `py -3` 替代 `python`，macOS/Linux 可用 `python3`。

```sh
python -m pip install -r test/pressure/requirements.txt
python test/pressure/run.py basic generate
python test/pressure/run.py eoy-2026 generate
python test/pressure/run.py eoy-2026 verify
```

`basic/` 生成 Excel、Writer、PPT 三份复杂对象素材；题面嵌在文档中。Runner 按 Excel → Writer → PPT 顺序生成，Writer 先创建 PPT 使用的图片。

`eoy-2026/` 生成两个源文件和两个待填写目标文件。机构“示例银行”、人员、系统与指标均为虚构测试内容；数值使用固定随机种子。相同依赖下可重现内容，但 ZIP 时间戳和文档元信息可能导致二进制哈希不同。

默认生成目录为 `.dev/pressure-test/<场景>/`，已被 Git 忽略。可以指定其他目录：

```sh
python test/pressure/run.py eoy-2026 generate --output-dir .dev/pressure-test/eoy-run-02
python test/pressure/run.py eoy-2026 verify --output-dir .dev/pressure-test/eoy-run-02
```

生成操作拒绝覆盖非空目录。重复测试请使用新目录，以保留已有文档和 WPS 写入结果。生成器也可独立运行，但会把产物写入当前工作目录；推荐通过 Runner 使用它们。

## 评阅与边界

- [场景说明](eoy-2026/题目说明.md)列出用户任务、映射陷阱、待测能力及验收清单。
- [答案卡](eoy-2026/答案卡.md)、`truth.py` 和 `make_answer_key.py` 只给评阅人；被测 Agent 只接收四份生成文档及用户原句。这里不提供文件访问隔离，评测时需由执行者隔离答案。
- `python test/pressure/run.py eoy-2026 truth` 回读源文件并计算标准答案。
- `python test/pressure/run.py eoy-2026 answer-key` 在数据目录生成答案卡，可与仓库中的答案卡比较。
- `verify` 检查生成素材的结构、预填样例与留白位置，并做对象几何检查。它用于检查**测试前的素材**，不是目标填写完成后的评分器，也不能代替 WPS 的实机显示、分页或 API 验收。任一检查失败都返回非零退出码。

生成的 `.xlsx`、`.docx`、`.pptx`、图片、Office 锁文件和评测写入结果只保存在本地，不提交到仓库。旧 `pressure-test/` 路径仅供已有本地文档使用并被忽略。
