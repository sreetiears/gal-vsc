# 大肥鱼陪伴宠 (gal-vsc)

Cursor 优先的 VS Code / Cursor 扩展 demo：底部面板里的蓝色大肥鱼会跟着你的编码活动涨 **好感度** 与 **陪伴**。

## 功能（MVP）

- Panel 内可拖动角色 + 泡内短句 + 心情滤镜
- 好感度 / 陪伴双轨（陪伴升级加成感）
- 监听：保存、打字、诊断、Task/终端、Git commit、空闲
- Cursor：可选安装 Hooks，把 Agent 回合映射为事件
- 状态写入 `globalState`，重载窗口保留

## 开发

```bash
npm install
npm run compile
npm test
```

在 Cursor / VS Code 中打开本仓库，按 **F5**（Run Extension）启动 Extension Development Host，打开底部 **大肥鱼** 面板。

命令面板：

- `大肥鱼: 显示陪伴面板`
- `大肥鱼: 重置存档`
- `大肥鱼: 安装 Cursor Hooks`（需已打开工作区）

## 素材

- 原图：`assets/source/whale-original.jpg`（用户提供）
- 运行时：`media/pet/whale-idle.png`（去白底抠图）
- 形象为社区同人风格，本仓库仅作个人/学习 demo；商用请自行确认权利。

## 许可

代码 MIT。美术素材权利归原作者 / 提供者，详见上文。
