# RunBeat 构建指南

## 项目结构

```
RunBeat/
├── App.tsx                 # 主应用界面
├── index.ts               # 入口文件
├── app.json               # Expo 配置
├── eas.json               # EAS 构建配置
├── package.json           # 依赖配置
├── tsconfig.json          # TypeScript 配置
├── src/
│   └── utils/
│       ├── BPMAnalyzer.ts      # BPM 分析器
│       ├── CadenceDetector.ts  # 步频检测器
│       ├── BeatGenerator.ts    # 节拍生成器
│       ├── MusicLibrary.ts     # 音乐库管理
│       └── MusicPlayer.ts      # 音乐播放器
└── assets/                # 图片资源
```

## 构建 APK 的三种方式

### 方式一：EAS Build（推荐）

需要 Expo 账号，在云端构建，最简单。

```bash
# 1. 安装 EAS CLI
npm install -g eas-cli

# 2. 登录 Expo 账号
eas login

# 3. 配置项目
eas build:configure

# 4. 构建 APK
eas build -p android --profile preview

# 构建完成后，会提供一个下载链接
```

### 方式二：本地构建（需要 Android 开发环境）

```bash
# 1. 安装依赖
npm install

# 2. 生成原生项目
npx expo prebuild -p android

# 3. 进入 Android 目录
cd android

# 4. 构建 APK
./gradlew assembleRelease

# APK 输出位置: android/app/build/outputs/apk/release/app-release.apk
```

### 方式三：Expo Development Build

```bash
# 1. 安装 expo-dev-client
npx expo install expo-dev-client

# 2. 构建开发版本
eas build -p android --profile development

# 3. 安装后使用 expo start --dev-client 运行
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 扫描 QR 码在 Expo Go 中运行
# 或按 'a' 在 Android 模拟器运行
```

## 注意事项

1. **权限**: 首次运行需要授予媒体库和传感器权限
2. **音乐文件**: 需要手机本地有音乐文件才能测试
3. **BPM 分析**: 分析过程可能需要一些时间，取决于音乐数量

## 功能说明

- **开始跑步**: 启动步频检测，App 会根据步频自动切换音乐
- **自动同步**: 开启后，音乐会自动匹配当前步频
- **节拍叠加**: 当音乐 BPM 与步频不匹配时，会叠加节拍器声音
- **BPM 分析**: 首次使用需要分析音乐库，之后会缓存结果
