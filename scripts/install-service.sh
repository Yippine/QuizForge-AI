#!/bin/bash

# QuizForge-AI 系統服務安裝腳本

# 切換到專案根目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 開始安裝 QuizForge-AI systemd 服務 (Port 3002)..."
echo "📂 專案根目錄: $PROJECT_ROOT"
echo ""

# 檢查是否為 root 或有 sudo 權限
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  此腳本需要 sudo 權限，請使用: sudo ./scripts/install-service.sh"
    exit 1
fi

# 定義顏色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 檢查 Node 和 npm 是否可用
echo "🔍 檢查環境..."
if [ ! -f "/home/leowu/.nvm/versions/node/v20.19.4/bin/node" ]; then
    echo -e "${RED}❌ Node.js 未找到，請確認安裝路徑${NC}"
    exit 1
fi

if [ ! -f "/home/leowu/.nvm/versions/node/v20.19.4/bin/npm" ]; then
    echo -e "${RED}❌ npm 未找到，請確認安裝路徑${NC}"
    exit 1
fi

if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules 不存在，請先執行 npm install${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 環境檢查通過${NC}"

echo ""
echo "📦 步驟 1/4: 複製服務文件到系統目錄..."
cp "$PROJECT_ROOT/scripts/quizforge-ai.service" /etc/systemd/system/quizforge-ai.service
echo -e "${GREEN}✓ 服務文件已複製${NC}"

echo ""
echo "🔄 步驟 2/4: 重新載入 systemd..."
systemctl daemon-reload
echo -e "${GREEN}✓ systemd 已重新載入${NC}"

echo ""
echo "⚙️  步驟 3/4: 啟用服務（開機自動啟動）..."
systemctl enable quizforge-ai.service
echo -e "${GREEN}✓ 服務已設定為開機自動啟動${NC}"

echo ""
echo "🎯 步驟 4/4: 啟動服務..."
systemctl start quizforge-ai.service
sleep 3
echo -e "${GREEN}✓ 服務啟動指令已執行${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ 安裝完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 服務狀態檢查："
echo ""
systemctl status quizforge-ai.service --no-pager | head -15

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}📖 常用管理指令：${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "查看服務狀態："
echo "  sudo systemctl status quizforge-ai"
echo ""
echo "啟動服務："
echo "  sudo systemctl start quizforge-ai"
echo ""
echo "停止服務："
echo "  sudo systemctl stop quizforge-ai"
echo ""
echo "重啟服務："
echo "  sudo systemctl restart quizforge-ai"
echo ""
echo "查看即時日誌："
echo "  sudo journalctl -u quizforge-ai -f"
echo ""
echo "查看最近日誌："
echo "  sudo journalctl -u quizforge-ai -n 50"
echo ""
echo "停用開機自動啟動："
echo "  sudo systemctl disable quizforge-ai"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🌐 服務訪問地址：${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  應用界面: http://localhost:3002"
echo ""
echo "  💡 提示：服務會在系統重啟後自動啟動"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
