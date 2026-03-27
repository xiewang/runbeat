# RunBeat 本地构建 APK 完整指南

## 方案一：使用 Android Studio（推荐）

### 前置要求
- Android Studio（最新版）
- Node.js 18+
- JDK 17

### 步骤

```bash
# 1. 进入项目目录
cd RunBeat

# 2. 安装依赖
npm install

# 3. 生成 Android 原生项目
npx expo prebuild -p android

# 4. 用 Android Studio 打开
open android/build.gradle  # 或手动用 Android Studio 打开 android 目录

# 5. 在 Android Studio 中
# - 等待 Gradle 同步完成
# - 点击菜单 Build → Generate Signed Bundle/APK
# - 选择 APK → Next
# - 创建或选择密钥库（keystore）→ Next
# - 选择 release → Finish

# APK 输出位置
android/app/build/outputs/apk/release/app-release.apk
```

---

## 方案二：命令行构建（无需 Android Studio）

### 前置要求

**macOS:**
```bash
# 安装 Android SDK
brew install android-sdk

# 配置环境变量（添加到 ~/.zshrc）
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

**然后安装必要组件：**
```bash
# 安装 SDK 组件
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
sdkmanager "platform-tools"
```

### 构建步骤

```bash
# 1. 进入项目
cd RunBeat

# 2. 安装依赖
npm install

# 3. 生成原生项目
npx expo prebuild -p android

# 4. 进入 Android 目录
cd android

# 5. 赋予 gradlew 执行权限
chmod +x gradlew

# 6. 构建 Release APK
./gradlew assembleRelease

# 7. APK 位置
# app/build/outputs/apk/release/app-release.apk
```

---

## 方案三：使用 EAS 本地构建

```bash
# 1. 安装 EAS CLI
npm install -g eas-cli

# 2. 登录 Expo（免费）
eas login

# 3. 本地构建（不需要 Android Studio）
eas build -p android --profile preview --local

# APK 会保存在本地
```

---

## 常见问题

### 1. Gradle 下载慢
```bash
# 在 android/gradle.properties 添加
systemProp.http.proxyHost=127.0.0.1
systemProp.http.proxyPort=7890
systemProp.https.proxyHost=127.0.0.1
systemProp.https.proxyPort=7890
```

### 2. 内存不足
```bash
# 在 android/gradle.properties 修改
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m
```

### 3. 签名问题（Release 版需要签名）
```bash
# 生成密钥库
cd android
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 在 android/gradle.properties 添加
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=你的密码
MYAPP_RELEASE_KEY_PASSWORD=你的密码
```

---

## 快速检查清单

构建前确认：
- [ ] Node.js 已安装 (`node --version`)
- [ ] 依赖已安装 (`npm install` 完成)
- [ ] ANDROID_HOME 已设置 (`echo $ANDROID_HOME`)
- [ ] Android SDK 已安装 (`sdkmanager --list`)

---

## 推荐流程（最简单）

如果你是 macOS 且已安装 Android Studio：

```bash
cd RunBeat
npm install
npx expo prebuild -p android
# 然后用 Android Studio 打开 android 文件夹，点击 Build → Build Bundle(s) / APK(s) → Build APK(s)
```
