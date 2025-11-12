# ⚠️ 講義功能檔案 UTF-8 編碼問題報告

## 📋 問題摘要

v2 窗口在測試開發伺服器時發現 **Vite UTF-8 解析錯誤**，追查後發現是講義功能的檔案包含無效的 UTF-8 字節，導致：

1. ❌ Vite 開發伺服器崩潰（panic at vue.rs:18:59）
2. ❌ 前端顯示的中文資料全部亂碼
3. ❌ 檔案被識別為 binary data 而非 UTF-8 文本

---

## 🔍 受影響的檔案

### 1. `src/views/LectureSubjects.vue`

- **狀態**: ❌ 嚴重損壞
- **檔案類型**: `data` (應為 `UTF-8 text`)
- **損壞位置**: 7 個無效字節 (0xd7 等)
- **影響範圍**:
  - 註解中的中文描述
  - **資料部分的 `name` 和 `description` 欄位**（會顯示在前端）

**損壞的資料範例**:

```javascript
const subjects = ref([
  {
    id: "L21",
    name: "�� 1 - AI �(��", // ❌ 應該是中文
    count: 9,
    color: "primary",
    description: "iPAS AI �(��+�� �t�", // ❌ 應該是中文
  },
  {
    id: "L23",
    name: "�� 3 - AI 8ÀS", // ❌ 應該是中文
    count: 12,
    color: "secondary",
    description: "iPAS AI �(��+��	8ÀS�", // ❌ 應該是中文
  },
]);
```

### 2. `src/views/SubjectLectures.vue`

- **狀態**: ⚠️ 可能損壞（需檢查）
- **檔案類型**: `UTF-8 text` (但可能包含無效字節)
- **建議**: 完整檢查所有中文內容

### 3. `src/views/LectureDetail.vue`

- **狀態**: ❓ 未檢查
- **建議**: 檢查是否存在及編碼狀況

---

## 🔧 無效字節詳情

**檢測到的問題字節**:

- `0xd7` 出現在 7 個位置（第 91, 106, 123, 1555, 1624, 1678, 1692 字節）
- `0xd1`, `0xc9`, `0xa3` 等其他無效字節
- 這些字節不是合法的 UTF-8 序列

**可能原因**:

1. 從其他編碼（如 Big5、GB2312）複製貼上時未正確轉換
2. 編輯器設定錯誤
3. 文件系統編碼問題

---

## ✅ 修復步驟（給 v3 窗口）

### 方案 A：重新創建資料（推薦）

1. **備份當前檔案**:

```bash
cp src/views/LectureSubjects.vue /tmp/LectureSubjects_damaged.vue
cp src/views/SubjectLectures.vue /tmp/SubjectLectures_damaged.vue
```

2. **確認編輯器設定**:

   - 確保使用 UTF-8 編碼
   - 檢查 VSCode 右下角是否顯示 "UTF-8"

3. **重新輸入損壞的中文資料**:

```javascript
// LectureSubjects.vue 應該是：
const subjects = ref([
  {
    id: "L21",
    name: "科目一 - AI 技術應用與規劃", // ✅ 正確的中文
    count: 9,
    color: "primary",
    description: "iPAS AI 技術應用與規劃 (9個主題)",
  },
  {
    id: "L23",
    name: "科目三 - AI 機器學習", // ✅ 正確的中文
    count: 12,
    color: "secondary",
    description: "iPAS AI 機器學習技術與應用 (12個主題)",
  },
]);
```

4. **驗證檔案編碼**:

```bash
# 應該顯示 "UTF-8 text"
file src/views/LectureSubjects.vue

# 不應該有任何輸出（表示沒有無效字節）
python3 -c "
with open('src/views/LectureSubjects.vue', 'rb') as f:
    data = f.read()
    try:
        data.decode('utf-8')
        print('✅ UTF-8 valid')
    except UnicodeDecodeError as e:
        print(f'❌ UTF-8 error: {e}')
"
```

### 方案 B：使用 Python 清理（快速但可能遺失資訊）

```python
# 清理無效字節但保留結構
with open('src/views/LectureSubjects.vue', 'rb') as f:
    data = f.read()

# 解碼時忽略錯誤
text = data.decode('utf-8', errors='replace')

# 重新保存為純淨 UTF-8
with open('src/views/LectureSubjects.vue', 'w', encoding='utf-8') as f:
    f.write(text)
```

⚠️ **注意**: 這會將損壞字符替換為 `�`，仍需手動修復

---

## 🛡️ 預防措施

### 1. 編輯器設定檢查

```json
// VSCode settings.json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false
}
```

### 2. Git 設定

```bash
# 在 .gitattributes 中強制 UTF-8
*.vue text eol=lf encoding=UTF-8
*.js text eol=lf encoding=UTF-8
```

### 3. 提交前驗證

```bash
# 檢查所有 Vue 檔案的編碼
find src -name "*.vue" -exec file {} \; | grep -v "UTF-8 text"
```

---

## 📊 當前狀態

### v2 窗口的臨時修復

為了讓開發伺服器能運行，v2 已將無效字節替換為 'x'：

- ✅ 開發伺服器可以啟動
- ❌ 但前端顯示的中文仍是亂碼

### Router 配置

這些路由已經設定（src/router/index.js）：

- `/lectures` → LectureSubjects.vue
- `/lectures/:subjectId` → SubjectLectures.vue
- `/lectures/:subjectId/:lectureId` → LectureDetail.vue

### HomePage 整合

HomePage.vue 已有 `startLectures()` 按鈕導航到講義功能

---

## 🎯 v3 窗口需要做的事

### 優先級 P0（必須修復）

1. ✅ 修復 `LectureSubjects.vue` 的中文資料（name, description）
2. ✅ 檢查並修復 `SubjectLectures.vue` 的中文內容
3. ✅ 檢查 `LectureDetail.vue` 是否存在及編碼狀況
4. ✅ 驗證所有檔案為有效 UTF-8

### 優先級 P1（建議）

1. 設定編輯器強制使用 UTF-8
2. 在 .gitattributes 中設定檔案編碼
3. 提交前執行編碼驗證

---

## 📝 驗證清單

修復完成後，請執行以下檢查：

```bash
# 1. 檢查檔案類型
file src/views/Lecture*.vue
# 應該全部顯示 "UTF-8 text"

# 2. 檢查 UTF-8 有效性
python3 << 'EOF'
import glob
for filepath in glob.glob('src/views/Lecture*.vue'):
    with open(filepath, 'rb') as f:
        try:
            f.read().decode('utf-8')
            print(f'✅ {filepath}: Valid UTF-8')
        except UnicodeDecodeError as e:
            print(f'❌ {filepath}: {e}')
EOF

# 3. 啟動開發伺服器測試
npm run dev
# 不應該出現 "Utf8Error" 錯誤

# 4. 在瀏覽器測試
# 訪問 http://localhost:3002/lectures
# 確認中文正常顯示
```

---

## 🔗 相關資訊

- **錯誤訊息**: `Utf8Error { valid_up_to: 91, error_len: Some(1) }`
- **Vite 版本**: v7.1.7
- **錯誤位置**: `crates/oxide/src/extractor/pre_processors/vue.rs:18:59`
- **v2 臨時修復**: 已將 0xd7 等無效字節替換為 'x'，但資料仍需重寫

---

**報告生成時間**: 2025-11-09 00:17
**報告生成者**: v2 窗口 Claude Code
**接收者**: v3 窗口 Claude Code
