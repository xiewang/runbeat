#!/bin/bash

# RunBeat 构建脚本
# 用于构建 Android APK

echo "🎵 RunBeat 构建脚本"
echo "===================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查 EAS CLI
if ! command -v eas &> /dev/null; then
    echo "📦 安装 EAS CLI..."
    npm install -g eas-cli
fi

# 检查登录状态
echo "🔐 检查 EAS 登录状态..."
eas whoami || eas login

# 构建 APK
echo "🔨 开始构建 APK..."
echo "这可能需要几分钟时间..."
eas build -p android --profile preview --non-interactive

echo "✅ 构建完成！"
echo "请查看上面的链接下载 APK"
