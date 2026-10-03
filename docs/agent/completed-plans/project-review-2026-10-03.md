# Project Review — 2026-10-03

## Goal

Review the existing Harness for correctness, safety, compatibility, and useful
maintenance improvements. Produce a prioritized report without changing runtime
code or templates.

## Scope

- Read product, architecture, quality, security, performance, and brain docs.
- Inspect CLI reconciliation, manifests, file safety, generated checks, and tool
  adapters.
- Run existing quality gates and reproduce suspected defects in temporary Git
  repositories.
- Check current official documentation for tool adapter assumptions.
- Run an independent evaluator pass as required by AGENTS.md.

## Acceptance Criteria

- Findings identify concrete triggers, effects, source locations, and remedies.
- Confirmed defects are distinguished from optional improvements.
- Record validation results and limitations.
- Move this plan to completed-plans with the review results.

## Results

Reviewed commit `32891df` on `main`, including all runtime modules, tests,
generated checks, template catalog, tool adapters, relevant docs, and brain
decisions. An independent evaluator reviewed CLI reconciliation, file safety,
and diagnostics. Both reviewers reproduced the four safety/manifest findings.

The review found one P1 and six P2 issues, plus a diagnostic consistency
follow-up. Findings and a suggested implementation sequence follow. This review
adds only this report; runtime code and templates remain unchanged.

Follow-up implementation: all confirmed findings were addressed in
[Harness Safety and Adapter Maintenance](harness-safety-and-adapters.md), which
records the regression coverage, independent evaluation, and remaining limits.

## 验证结果与边界

- 本地环境：macOS，Node.js `24.12.0`，npm `11.12.1`。
- `npm test`：22/22 通过。
- `npm run check`：instructions、docs、architecture、brain、templates 全部通过。
- `npm run verify:package`：73 个文件，压缩包预估 28,935 字节，通过。
- 临时 Git 仓库复现：自定义 hook 丢失、过期计划覆盖、文件权限放宽、
  manifest 误报健康、hook 输出协议、子目录执行、技能目录删除漏检。
- 额外复现：brain 页面的符号链接会被 doctor 忽略，但 checker 会读取并检查。
- 复现脚本保存在 `/tmp/harness-review-safety-20261003.mjs` 和
  `/tmp/harness-review-checks-20261003.mjs`；它们创建的临时仓库已清理。
- 未运行原生 Codex/Claude 会话，也未在 Windows/Linux 上重跑矩阵；hook
  行为结论基于脚本真实输出与当前官方协议对照。没有做性能基准测试。

## 已确认问题

### 1. [P1] JSON 合并会删除用户自定义 hook 和安全检查

位置：`src/harness.mjs:47–54, 107–133`。

Hook 归属通过命令子字符串判断。已有命令
`node scripts/agent/check.mjs --only instructions && npm run security`
会被识别为 Harness 自有 hook，整体替换成模板中的基础检查。复现中追加的
安全检查、用户 matcher 和 timeout 全部消失，CLI 仍然正常完成。

这违反了安全更新应保留用户配置的约定。应只迁移确切的已知模板命令；用户
修改过的 hook 应保留，必要时生成冲突提案。为追加命令、包装命令、超时设置、
多组 hook 和用户权限规则补充测试。

### 2. [P2] 应用计划前不验证目标，可能覆盖确认期间的新内容

位置：`src/cli.mjs:117–127`、`src/harness.mjs:308–311, 475–479`。

计划先读取文件并决定写入内容，随后等待用户确认。`applyPlan` 直接写入旧计划，
没有检查文件是否变化。复现：生成计划时 `AGENTS.md` 不存在；确认前创建用户
文件；应用计划后用户内容被模板覆盖。已有 managed/merged 文件也存在同类窗口。

应记录每个目标在计划生成时的存在状态与哈希，并在任何写入开始前核对目标和
manifest；变化时停止并重新规划。并发执行还应使用仓库级互斥。原子 rename
只能防止半个文件，不能解决过期计划覆盖。

### 3. [P2] 原子替换会放宽已有文件的访问权限

位置：`src/fs-safe.mjs:79–85`。

临时文件固定使用 `0644`，替换后覆盖原文件权限。复现中已有
`.claude/settings.json` 的权限从 `0600` 变成 `0644`，其中原有 `env`
配置保留下来，却可被其他本地用户读取。

应保留已有常规文件的权限；只有新文件使用默认权限。可执行位策略应单独处理，
并增加 POSIX 上私有配置文件权限的回归测试。

### 4. [P2] Stop hook 输出和失败状态不符合工具协议

位置：`templates/codex/hooks.json:8`、`templates/claude/settings.json:18`、
`scripts/agent/check.mjs:239–244`，以及仓库对应的工具配置。

两种适配器直接调用通用 checker。成功时实际输出
`check: ok (instructions)`，失败时退出码为 `1`。
当前 Codex 的 Stop 事件要求成功输出 JSON；用退出码阻止结束需要 `2`。
Claude 的普通失败退出码也不会单独阻止 Stop。

应增加专用 hook 适配层：成功时输出符合事件协议的 JSON；检查失败时提供
明确的阻止/继续理由，使用支持的 JSON 决策或退出码。读取 `stop_hook_active`
并限制自动续跑，避免反复失败导致无尽循环。通用 checker 保持 CLI/CI 的
普通退出码和文本输出。

官方依据：[Codex Hooks](https://learn.chatgpt.com/docs/hooks)、
[Claude Code Hooks](https://code.claude.com/docs/en/hooks)。
Codex 还要求用户信任新增或改变的 hook；安装/升级文档应提示这一独立步骤。

### 5. [P2] Hook 使用相对路径，在项目子目录启动时失效

位置：`templates/codex/hooks.json:8`、`templates/claude/settings.json:18`。

从已安装项目的子目录执行同一 hook 命令，得到 `MODULE_NOT_FOUND`。
Codex 官方说明 hook 使用会话 cwd，允许从仓库子目录启动，因此当前命令不能
稳定找到检查脚本；即使改为绝对脚本路径，checker 自己也依赖 `process.cwd()`。

应由 hook 适配器解析 Git 根目录并把检查工作目录设为根目录。Claude 可以使用
项目根目录变量，Codex 按官方建议解析 Git 根目录；确保 Windows、路径含空格、
子目录启动都有测试。官方依据同上。

### 6. [P2] Manifest 验证不完整，doctor 会错误报告健康

位置：`src/harness.mjs:176–195, 553–580`。

目前只验证 selection 的粗略类型，未验证工具/模块枚举和 files/pending 的完整
记录结构。两个独立场景都复现了 `ok: true`：

- 将 tools/modules 改为未知值；
- 将 managed 文件的记录 state 改成非法值，然后修改实际文件内容。

第二个场景绕过了仅在 `state === "managed"` 时运行的内容校验。应在 doctor
和 update 共用入口完整验证枚举、哈希、版本、ownership/state 组合和 pending
字段；非法记录应返回结构化错误，并保持 `doctor --json` 可解析。

### 7. [P2] 已启用的 Codex 技能目录全部丢失，质量检查仍通过

位置：`scripts/agent/check.mjs:44–48, 100–107`、
`templates/github/agent-harness.yml`。

checker 只检查当前存在的技能目录。删除 `.agents/skills/` 后，完整 checker
仍返回 `0`，因为空列表没有必需项校验，技能对齐检查也被跳过。与此同时 doctor
报出 6 个缺失文件。生成的 CI 只运行 checker，因此这类退化可以通过 CI。

应根据已启用工具和模块验证必需技能，而不是仅遍历已有目录；通过共享测试
fixtures 校准 checker 与 doctor。生成的脚本必须保持独立运行，不能直接依赖
安装缓存中的 CLI 模块。

## 其他优化机会

### 运行时支持应更新

CI 仅测试 Node 20/22，生成的 CI 固定 Node 20，文档最低版本也是 20。当前官方
发布页已将 Node 20 标为 EOL，Node 22/24 为 LTS。建议先增加 Node 24 矩阵并把
生成的 CI 切换到受支持版本，再决定是否提高最低要求；提高最低版本需写兼容性
说明。来源：[Node.js Releases](https://nodejs.org/en/about/previous-releases)。

### 测试应覆盖实际升级与发布包运行

已有测试覆盖初始化、幂等、CRLF、冲突、脏工作区和基本路径安全，但没有旧版本
到新版本的真实模板升级 fixture，也没有 hook 事件协议测试。打包检查仅验证
目录清单和入口权限。建议把 tarball 解包后的 init/check/doctor smoke test 纳入
CI，并覆盖三种 ownership 的跨版本更新、冲突解决和中断恢复。

### 诊断与文件安全规则应保持一致

doctor 使用 `Dirent.isFile()` 过滤 brain 页面，符号链接页被忽略；checker 则
跟随链接读取。额外复现中，指向无效外部页面的符号链接使 doctor 返回健康，
checker 报错。位置：`src/harness.mjs:591–594`、
`scripts/agent/check.mjs:174–178`。建议两个入口统一明确拒绝链接，并增加配对
fixtures。项目检测读取 package.json/pyproject.toml 也没有沿用 CLI 文件大小与
符号链接限制，值得一起收敛读取策略。

### 维护结构与文档可进一步收敛

`src/harness.mjs` 集中承担 JSON 合并、manifest 校验、seed 适配、规划和诊断。
在修复期间按职责提取模块即可，不必更换框架或新增生产依赖。checker 仍保持
独立交付，通过测试或生成机制防止两套规则漂移。

根 `docs/QUALITY.md` 应列出已存在的 npm test/check/verify:package，
`docs/PERFORMANCE.md` 应把未填写的网页/API 模板预算改成 CLI 文件规模、运行时间
与内存预算。`brain/roadmap.md` 的“CI workflow examples”也应反映已交付内容。

## 建议实施顺序

1. **安全更新 PR**：保留用户 hook、写入前检查计划有效性、保留已有权限；
   加入上述复现的回归测试。
2. **工具适配 PR**：专用 Stop hook wrapper、根目录定位、输出/失败协议、
   防重复续跑和信任步骤说明；同时补 Node 24 CI 支持。
3. **诊断与维护 PR**：完整 manifest 验证、checker 必需项、brain 链接策略、
   跨版本/打包 smoke fixtures、模块提取与文档收敛。

零依赖、模板随包发布、三种文件 ownership、manifest 最后写入、CRLF 哈希
归一化等现有设计值得保留。当前评审没有证明吞吐或运行速度是主要瓶颈；先修复
安全更新和验证可信度，对项目价值更直接。
