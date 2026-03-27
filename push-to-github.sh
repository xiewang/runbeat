#!/bin/bash

# GitHub 推送脚本
# 使用方式：
# 1. 在 GitHub 网页创建新仓库（不要初始化）
# 2. 运行此脚本

echo "📦 推送到 GitHub"
echo "==============="
echo ""

# 检查 Git 状态
if [ ! -d ".git" ]; then
    echo "❌ 不是 Git 仓库"
    exit 1
fi

# 获取仓库地址
echo "请输入 GitHub 仓库地址（例如：https://github.com/你的用户名/runbeat.git）"
read REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ 仓库地址不能为空"
    exit 1
fi

# 添加远程仓库
git remote add origin $REPO_URL

# 推送
echo ""
echo "🚀 推送到 GitHub..."
git push -u origin main

echo ""
echo "✅ 推送完成！"
echo "仓库地址: $REPO_URL"
