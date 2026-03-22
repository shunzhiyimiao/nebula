#!/bin/bash
# Capacitor 静态构建脚本
# 临时移走 API 目录（APK 不需要服务端路由）

set -e

echo "📦 开始 Capacitor 静态构建..."

# 备份 API 目录到项目外部
mv src/app/api /tmp/nebula_api_backup
echo "✓ API 目录已备份到 /tmp/nebula_api_backup"

# 执行构建（静态导出模式）
CAPACITOR_BUILD=true npm run build
BUILD_STATUS=$?

# 恢复 API 目录
mv /tmp/nebula_api_backup src/app/api
echo "✓ API 目录已恢复"

if [ $BUILD_STATUS -eq 0 ]; then
  echo "✅ 构建成功！静态文件在 out/ 目录"
else
  echo "❌ 构建失败"
  exit 1
fi
