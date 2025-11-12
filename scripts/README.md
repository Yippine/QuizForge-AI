# QuizForge-AI Systemd 服務管理

## 📋 功能說明

這些腳本用於將 QuizForge-AI 設定為 Ubuntu 系統服務，實現：
- 🚀 開機自動啟動
- 🔄 自動重啟（當服務異常停止時）
- 📊 系統日誌記錄
- 🎯 固定運行於 Port 3002

## 📦 文件說明

- `quizforge-ai.service` - systemd 服務配置文件
- `install-service.sh` - 服務安裝腳本
- `uninstall-service.sh` - 服務卸載腳本

## 🚀 安裝步驟

### 1. 確認環境
```bash
# 確認已安裝依賴
cd /home/leowu/Yippine/QuizForge-AI
npm install
```

### 2. 安裝服務
```bash
# 使用 sudo 執行安裝腳本
sudo ./scripts/install-service.sh
```

### 3. 驗證服務
```bash
# 查看服務狀態
sudo systemctl status quizforge-ai

# 查看即時日誌
sudo journalctl -u quizforge-ai -f
```

## 🔧 常用管理指令

### 服務控制
```bash
# 啟動服務
sudo systemctl start quizforge-ai

# 停止服務
sudo systemctl stop quizforge-ai

# 重啟服務
sudo systemctl restart quizforge-ai

# 查看狀態
sudo systemctl status quizforge-ai
```

### 開機自動啟動
```bash
# 啟用開機自動啟動
sudo systemctl enable quizforge-ai

# 停用開機自動啟動
sudo systemctl disable quizforge-ai
```

### 日誌查看
```bash
# 查看即時日誌（持續監控）
sudo journalctl -u quizforge-ai -f

# 查看最近 50 條日誌
sudo journalctl -u quizforge-ai -n 50

# 查看今天的日誌
sudo journalctl -u quizforge-ai --since today

# 查看指定時間範圍的日誌
sudo journalctl -u quizforge-ai --since "2025-01-01 00:00:00" --until "2025-01-02 00:00:00"
```

## 🗑️ 卸載服務

如果需要移除系統服務：

```bash
# 使用 sudo 執行卸載腳本
sudo ./scripts/uninstall-service.sh
```

卸載後，服務將：
- ❌ 停止運行
- ❌ 不會開機自動啟動
- ✅ 可以手動使用 `npm run dev` 啟動

## 🌐 訪問地址

服務安裝後，可通過以下地址訪問：
- **應用界面**: http://localhost:3002

## ⚙️ 服務配置說明

### 基本資訊
- **服務名稱**: quizforge-ai
- **運行用戶**: leowu
- **工作目錄**: /home/leowu/Yippine/QuizForge-AI
- **啟動命令**: npm run dev
- **監聽端口**: 3002

### 自動重啟設定
- **重啟策略**: always（總是重啟）
- **重啟間隔**: 10 秒
- 當服務異常停止時，系統會自動嘗試重啟

### 日誌設定
- 所有輸出都會記錄到系統日誌（journald）
- 可使用 `journalctl` 命令查看歷史日誌
- 日誌識別標籤: quizforge-ai

## 🔍 故障排除

### 服務無法啟動

1. 檢查 Node.js 和 npm 路徑是否正確
```bash
which node
which npm
```

2. 確認依賴已安裝
```bash
cd /home/leowu/Yippine/QuizForge-AI
ls -la node_modules
```

3. 查看詳細錯誤日誌
```bash
sudo journalctl -u quizforge-ai -n 100 --no-pager
```

### 端口被佔用

檢查 3002 端口是否被其他程序使用：
```bash
sudo netstat -tlnp | grep 3002
# 或
sudo lsof -i :3002
```

### 修改服務配置

如果需要修改服務配置（例如更改 Node 版本路徑）：

1. 編輯服務文件
```bash
sudo nano /etc/systemd/system/quizforge-ai.service
```

2. 重新載入並重啟
```bash
sudo systemctl daemon-reload
sudo systemctl restart quizforge-ai
```

## 📝 注意事項

1. **權限要求**: 安裝和管理服務需要 sudo 權限
2. **依賴檢查**: 安裝前請確保已執行 `npm install`
3. **Node 版本**: 服務配置中使用的是 Node v20.19.4（通過 nvm 安裝）
4. **開發模式**: 服務使用 `npm run dev` 啟動（Vite 開發服務器）
5. **生產環境**: 如需在生產環境使用，建議先 `npm run build` 然後使用 `npm run preview`

## 🔄 更新 Node 版本

如果更新了 Node.js 版本，需要更新服務配置：

1. 檢查新的 Node 路徑
```bash
which node
which npm
```

2. 編輯 `scripts/quizforge-ai.service`，更新路徑
```bash
nano scripts/quizforge-ai.service
```

3. 重新安裝服務
```bash
sudo ./scripts/uninstall-service.sh
sudo ./scripts/install-service.sh
```

## 📚 相關資源

- [systemd 官方文檔](https://www.freedesktop.org/software/systemd/man/)
- [journalctl 使用指南](https://www.freedesktop.org/software/systemd/man/journalctl.html)
- [Vite 官方文檔](https://vitejs.dev/)
