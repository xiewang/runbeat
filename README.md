# RunBeat - 步频同步音乐播放器

一款智能跑步音乐 App，根据您的实时步频自动匹配最合适的音乐。

## 核心功能

- 🎵 **本地音乐播放** - 读取手机本地音乐库
- 📊 **BPM 自动分析** - 自动分析每首音乐的节拍速度
- 🏃 **实时步频检测** - 通过手机加速度传感器检测跑步步频
- 🔄 **智能音乐切换** - 根据步频自动选择最接近 BPM 的音乐
- 🥁 **节拍叠加** - 当音乐 BPM 与步频不匹配时，叠加生成式节拍

## 技术方案

1. **播放列表预先筛选** - 按 BPM 分类音乐库，选择接近当前步频的曲目
2. **生成式节拍音轨** - 实时合成鼓点叠加在原音乐上，增强节奏感

## 安装

### 方法一：直接下载 APK

从 Releases 页面下载最新版 APK 安装包。

### 方法二：本地构建 APK（无需 Expo 账号）

**需要：** Android Studio + JDK 17

```bash
# 1. 克隆项目
git clone https://github.com/你的用户名/runbeat.git
cd runbeat

# 2. 安装依赖
npm install

# 3. 生成 Android 项目
npx expo prebuild -p android

# 4. 用 Android Studio 打开 android 目录
# 5. Build → Build Bundle(s) / APK(s) → Build APK(s)
# 6. APK 位置: android/app/build/outputs/apk/debug/app-debug.apk
```

详细步骤见 [LOCAL_BUILD.md](./LOCAL_BUILD.md)

### 方法三：EAS 云端构建

```bash
# 1. 安装依赖
npm install

# 2. 配置 EAS
npx eas-cli login

# 3. 构建 APK
eas build -p android --profile preview
```

## 开发

```bash
# 启动开发服务器
npm start

# 运行到 Android 设备
npm run android

# 运行到 iOS 设备
npm run ios
```

## 权限说明

- **媒体库访问** - 读取本地音乐文件
- **传感器访问** - 检测跑步步频
- **后台播放** - 跑步时持续播放音乐

## 技术栈

- React Native + Expo
- TypeScript
- Web Audio API (BPM 分析 + 节拍生成)
- Expo AV (音频播放)
- Expo Sensors (加速度传感器)

## 项目结构

```
src/
  utils/
    BPMAnalyzer.ts      # BPM 分析器
    CadenceDetector.ts  # 步频检测器
    BeatGenerator.ts    # 节拍生成器
    MusicLibrary.ts     # 音乐库管理
    MusicPlayer.ts      # 音乐播放器
```

## 文档

- [BUILD.md](./BUILD.md) - 构建指南
- [LOCAL_BUILD.md](./LOCAL_BUILD.md) - 本地构建详细步骤
- [PROJECT.md](./PROJECT.md) - 项目完整文档

## License

MIT
