# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## 项目概述

这是一个名为"Nocturne Echo - 子夜回响"的云端音乐播放器应用，采用React 19构建，具有以下核心特性：
- 黑胶唱片视觉效果和实时音频频谱
- 与Supabase S3兼容存储集成
- 多种播放模式（顺序、随机、单曲循环）
- 视频播放功能
- API文档和分享功能
- 响应式设计，支持移动端

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 代码架构

### 核心结构
- **App.tsx**: 主应用组件，负责路由管理和全局状态
- **components/**: UI组件目录
  - MusicPlayer.tsx: 核心音乐播放器
  - MusicManager.tsx: 音乐管理界面
  - Discovery.tsx: 音乐发现功能
  - VideoSection.tsx: 视频播放区域
  - ApiDocs.tsx: API文档和分享功能
- **services/**: 业务逻辑服务
  - s3Service.ts: S3存储操作
  - discoveryService.ts: 音乐发现服务
  - translationService.ts: 翻译和标签提取
  - aiService.ts: AI相关功能
- **types.ts**: TypeScript类型定义
- **constants.ts**: 全局常量配置

### 数据流
1. App组件通过s3Service获取音乐和视频列表
2. 用户交互触发状态更新
3. 各个视图组件通过props接收数据和回调函数
4. 音频播放通过HTML audio元素控制

### 关键技术点
- 使用React.lazy进行组件懒加载
- 通过S3 Client与云端存储交互
- 利用Web Audio API实现音频可视化
- 实现了确定性的默认封面生成算法
- 支持键盘快捷键（Ctrl/Cmd+K打开搜索）

## 配置说明

主要配置位于constants.ts中：
- S3_CONFIG: 存储端点和认证信息
- EDGE_FUNCTION_CONFIG: 边缘函数配置
- EMOTIONAL_QUOTES: 情感文案集合
- DEFAULT_COVERS: 默认封面图片URL列表

## 注意事项

- 所有API密钥和访问凭证已在代码中硬编码，请注意安全风险
- 项目使用Vercel部署，包含vercel.json配置文件
- 支持共享模式（通过URL参数mode=shared启用）
- terser依赖已添加到dependencies中，确保Vercel等部署平台能正确构建
- 存在一个循环chunk警告，但不影响正常构建和运行