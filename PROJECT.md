# RunBeat - 步频同步音乐播放器

## 项目概述

一款智能跑步音乐 App，根据实时步频自动匹配最合适的音乐，解决音源版权问题。

## 核心实现方案

### 方案 1: 播放列表预先筛选 ✅ 已实现
- 按 BPM 分类本地音乐库
- 自动选择接近当前步频的曲目
- 简单直接，无版权问题

### 方案 2: 生成式节拍音轨 ✅ 已实现
- 实时合成鼓点/节拍器
- 叠加在原音乐上（混音）
- 用户"听感"上是变速的，实际是混合

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│                    (React Native UI)                         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  MusicLibrary │    │CadenceDetector│    │  MusicPlayer  │
│   (音乐库)     │    │   (步频检测)   │    │   (播放器)     │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        ▼                     │                     ▼
┌───────────────┐              │            ┌───────────────┐
│  BPMAnalyzer  │              │            │ BeatGenerator │
│   (BPM分析)   │              │            │   (节拍生成)   │
└───────────────┘              │            └───────────────┘
                               │
                               ▼
                        ┌───────────────┐
                        │  手机加速度传感器 │
                        └───────────────┘
```

## 核心模块

### 1. BPMAnalyzer - BPM 分析器
- 使用能量峰值检测算法
- 降采样提高性能
- 缓存分析结果

### 2. CadenceDetector - 步频检测器
- 加速度传感器数据读取
- 峰值检测算法识别步伐
- 5秒滑动窗口计算 BPM

### 3. BeatGenerator - 节拍生成器
- Web Audio API 合成节拍
- 可调整 BPM 和音量
- 与音乐播放同步

### 4. MusicLibrary - 音乐库管理
- 读取本地音乐文件
- BPM 分析和缓存
- 智能匹配算法

### 5. MusicPlayer - 音乐播放器
- Expo AV 音频播放
- 节拍叠加控制
- 播放状态管理

## 使用流程

1. **首次启动**
   - 授予媒体库权限
   - 授予传感器权限
   - 自动扫描本地音乐

2. **BPM 分析**
   - 点击"分析 BPM"按钮
   - 等待分析完成
   - 结果自动缓存

3. **开始跑步**
   - 点击"开始跑步"
   - 步频检测启动
   - 自动播放匹配音乐

4. **智能切换**
   - 步频变化时自动切换音乐
   - 或叠加节拍器补充节奏

## 构建 APK

### 使用 EAS Build（最简单）

```bash
# 1. 进入项目目录
cd RunBeat

# 2. 安装 EAS CLI
npm install -g eas-cli

# 3. 登录 Expo 账号（免费注册）
eas login

# 4. 构建 APK
eas build -p android --profile preview

# 5. 等待构建完成，下载 APK
# 构建时间约 10-20 分钟
```

### 构建输出

构建完成后，你会得到一个可以直接安装的 APK 文件：
- 文件名: `runbeat-[version]-preview.apk`
- 大小: 约 30-50 MB
- 支持: Android 8.0+

## 项目文件

```
RunBeat/
├── App.tsx                    # 主界面 (300+ 行)
├── index.ts                   # 入口
├── app.json                   # Expo 配置
├── eas.json                   # EAS 构建配置
├── package.json               # 依赖
├── tsconfig.json              # TypeScript 配置
├── README.md                  # 项目说明
├── BUILD.md                   # 构建指南
├── src/
│   └── utils/
│       ├── BPMAnalyzer.ts     # BPM 分析 (130+ 行)
│       ├── CadenceDetector.ts # 步频检测 (100+ 行)
│       ├── BeatGenerator.ts   # 节拍生成 (120+ 行)
│       ├── MusicLibrary.ts    # 音乐库管理 (110+ 行)
│       └── MusicPlayer.ts     # 音乐播放器 (160+ 行)
└── assets/                    # 图标和启动图
```

## 技术栈

- **框架**: React Native + Expo
- **语言**: TypeScript
- **音频**: Expo AV + Web Audio API
- **传感器**: Expo Sensors
- **构建**: EAS Build

## 依赖列表

```json
{
  "expo": "~55.0.8",
  "expo-av": "^16.0.8",
  "expo-sensors": "^55.0.9",
  "expo-media-library": "^55.0.10",
  "expo-file-system": "^55.0.11",
  "react-native": "0.83.2",
  "@react-native-community/slider": "^5.1.2"
}
```

## 下一步优化

1. **渐进式 BPM 调整** - 平滑过渡而非直接切换
2. **播放列表智能排序** - 根据跑步阶段自动排序
3. **离线节拍分析** - 更精确的 BPM 检测算法
4. **数据持久化** - 保存跑步历史和偏好
5. **UI 美化** - 添加动画和视觉效果

## License

MIT License - 可自由使用和修改
