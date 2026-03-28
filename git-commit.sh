#!/bin/bash

# Git 提交脚本
echo "=== Git 提交脚本 ==="
echo ""

# 检查 Git 状态
echo "1. 检查 Git 状态..."
git status
echo ""

# 询问是否添加所有修改
echo "2. 是否添加所有修改的文件？"
echo "输入 'y' 确认，其他键取消:"
read -r add_all

if [ "$add_all" = "y" ]; then
    echo "正在添加所有修改的文件..."
    git add .
    echo "文件已添加！"
    echo ""
else
    echo "跳过添加文件，退出脚本。"
    exit 1
fi

# 询问提交信息
echo "3. 请输入提交信息:"
read -r commit_message

if [ -z "$commit_message" ]; then
    commit_message="更新项目"
    echo "使用默认提交信息: $commit_message"
fi

# 执行提交
echo ""
echo "4. 执行 Git 提交..."
git commit -m "$commit_message"
echo ""

# 询问是否推送到远程
echo "5. 是否推送到远程仓库？"
echo "输入 'y' 确认，其他键取消:"
read -r push_to_remote

if [ "$push_to_remote" = "y" ]; then
    echo "正在推送到远程仓库..."
    git push
    echo "推送完成！"
else
    echo "跳过推送，提交已完成。"
fi

echo ""
echo "=== 操作完成 ==="
