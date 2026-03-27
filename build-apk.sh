#!/bin/bash

# RunBeat 快速构建脚本
# 一键构建 Android APK

set -e

echo "🎵 RunBeat APK 构建脚本"
echo "========================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 请在 RunBeat 项目目录中运行此脚本${NC}"
    exit 1
fi

# 检查 Node.js
echo -e "${YELLOW}📋 检查环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未找到 Node.js，请先安装 https://nodejs.org/${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js 版本: $(node --version)${NC}"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装依赖...${NC}"
    npm install
else
    echo -e "${GREEN}✓ 依赖已安装${NC}"
fi

# 检查 EAS CLI
echo -e "${YELLOW}📋 检查 EAS CLI...${NC}"
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}📦 安装 EAS CLI...${NC}"
    npm install -g eas-cli
fi
echo -e "${GREEN}✓ EAS CLI 已就绪${NC}"

# 检查登录状态
echo -e "${YELLOW}🔐 检查 Expo 登录状态...${NC}"
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}请登录 Expo 账号（免费注册）...${NC}"
    eas login
fi
echo -e "${GREEN}✓ 已登录 Expo${NC}"

# 构建 APK
echo ""
echo -e "${YELLOW}🔨 开始构建 APK...${NC}"
echo -e "${YELLOW}   这将需要 10-20 分钟，请耐心等待${NC}"
echo ""

eas build -p android --profile preview "$@"

echo ""
echo -e "${GREEN}✅ 构建完成！${NC}"
echo -e "${GREEN}   请查看上面的链接下载 APK${NC}"
echo ""
echo -e "${YELLOW}📱 安装说明:${NC}"
echo "   1. 下载 APK 文件"
echo "   2. 在 Android 手机上允许"安装未知来源应用""
echo "   3. 安装并打开 RunBeat"
echo "   4. 授予媒体库和传感器权限"
echo ""
