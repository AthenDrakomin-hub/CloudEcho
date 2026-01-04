# Nocturne Echo - 子夜回响 | 我的云端音乐生态

![License](https://img.shields.io/badge/license-MIT-red)
![React](https://img.shields.io/badge/React-19-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)
![Vercel](https://img.shields.io/badge/Deployment-Vercel-black)

这是一个专为“情感共鸣”设计的私有云端音乐播放与管理生态系统。集成了伤感文案、DJ 律动、黑胶视觉以及强大的 S3 存储管理功能。

## 🌟 核心特性

- **沉浸式播放器**：
  - **黑胶视觉**：高度还原的黑胶唱片旋转动画。
  - **实时频谱**：基于 Web Audio API 的动态音频频率可视化。
  - **情感文案**：内置深度伤感语录，随乐而动，触动心弦。
- **全功能管理系统**：
  - **S3 深度集成**：通过 Supabase S3 协议直接管理云端文件。
  - **增删改查**：支持音频上传、永久删除、重命名（自动处理云端元数据）。
- **精选视频空间**：
  - 支持云端 MV 发现与播放，打造视听双重享受。
- **多维映射分享**：
  - **Shared Mode**：一键生成只读分享链接，对外发布你的私人曲库，自动隐藏管理权限。
  - **API 友好**：结构化的存储路径，方便其他项目通过 SDK 直接调用。
- **极致响应式**：针对移动端深度优化，无论是桌面端还是手机端都能获得完美的网易云式体验。

## 🛠️ 技术栈

- **前端框架**：React 19 (ES Modules)
- **样式处理**：Tailwind CSS
- **图标库**：Font Awesome 6
- **云存储**：Supabase Storage (S3 Compatible)
- **部署平台**：Vercel
- **核心协议**：AWS SDK v3 for JavaScript

## 🚀 快速开始

### 1. 配置存储
项目已预配置了存储参数（见 `constants.ts`）。如需使用自己的存储桶，请修改：
- `endpoint`
- `accessKeyId`
- `secretAccessKey`
- `bucketName`

### 2. 部署到 Vercel
项目包含 `vercel.json`，支持 SPA 路由。
1. 将代码推送至 GitHub。
2. 在 Vercel 后台导入项目。
3. 框架选择 `Other`（或自动识别），构建命令保留默认即可。

## 📁 目录结构

- `/components`：UI 组件（播放器、管理、视频、文档）。
- `/services`：核心服务（S3 文件操作逻辑）。
- `types.ts`：全局类型定义。
- `constants.ts`：系统常量与 S3 配置。
- `App.tsx`：主应用逻辑与路由分发。

## 📝 免责声明
本项目仅供学习交流使用。请确保上传的音视频资源符合当地版权法律法规。

---
*“原来什么都可以是假，只有痛苦是真的。” —— 子夜回响*
