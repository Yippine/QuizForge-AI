---
source: conversation
date: "2026-05-22"
topic: "IPAS 指引分析與初級兩考科出題對應關係"
related:
  - references/ipas-ai-talent-guide-115may.md
  - references/tommy-260521-260522-ipas-quiz-prep-request.md
  - resources/ipas-ai-talent-guide-115may.pdf
---

# IPAS 指引分析與出題對應關係

$$\text{Guide} = \text{官方能力標準} \to \text{iPAS 認證依據} \to \text{出題範圍定義}$$

## 任務來源

$$\text{副總湯惠剛} \xrightarrow{\text{2026-05-21}} \text{請準備 iPAS 初級考題} \xrightarrow{\text{2026-05-22}} \text{附上出題參考（本指引）}$$

- 目標：為 **iPAS 初級 AI 應用規劃師** 兩個考科出練習題
- 附件用途：對齊官方能力標準作為出題範圍依據

## 文件定性

$$\text{ipas-ai-talent-guide-115may.pdf} = \text{數位發展部 115v3.0} \xrightarrow{\text{官方}} \text{iPAS 考試的能力標準根據}$$

- 指導單位：moda 數位發展部
- 版本：115v3.0（115年5月）
- 關鍵更新：新增「AI 治理素養」+ 新增「AI 協作與開發（Vibe Coding）」

## 初級兩考科與能力類型對應

$$\text{iPAS 初級 AI 應用規劃師} = \text{素養類} \Rightarrow \text{對應 一、AI 應用素養}$$

| 考科 | 認證等級 | 認證分類 | 對應能力類型 |
|------|---------|---------|------------|
| L21 人工智慧技術應用規劃 | **初級** | **素養類** | 一、AI 應用素養（能力 1 AI 素養） |
| L23 機器學習技術與應用 | **初級** | **素養類** | 一、AI 應用素養（能力 2 AI 治理素養） |

$$\text{L21 核心知識} = \{\text{AI 基本原理},\; \text{應用情境與限制},\; \text{產業導入可行性},\; \text{問題定義與解決}\}$$

$$\text{L23 核心知識} = \{\text{ML 基本概念},\; \text{AI 風險辨識},\; \text{道德倫理},\; \text{資料治理與隱私保護}\}$$

## 出題素材對應（表格來源）

| 素材 | PDF 頁碼 | 出題用途 |
|------|---------|---------|
| 表 2 五大能力類型說明 | p.6–7 | 素養範疇定義 |
| 表 4 能力關鍵內涵（一、二欄） | p.10–11 | 知識點清單（逐項出題） |
| 表 7 AI 應用人才角色定位 | p.15 | 情境題：AI 加值型 vs 導入型 |
| 表 10 各產業應用情境 | p.18–19 | 情境題場景 |
| 第六節 負責任 AI | p.23–24 | 115v3.0 新增考點（AI 治理素養） |

## 115v3.0 新增重點（高機率出現在新題）

$$\text{新增}_1 = \text{AI 治理素養（能力 2）} = \{\text{隱私保護},\; \text{風險分類管理},\; \text{幻覺（Hallucination）},\; \text{責任歸屬}\}$$

> 素養類不考工具操作；側重「知道為什麼」而非「知道怎麼做」

## Knowledge-base 現況

```
knowledge-base/ipas/ai-planning/intermediate/
├── L21-人工智慧技術應用規劃/questions/{official,mock-exam}.json  ✅
├── L23-機器學習技術與應用/questions/{official,mock-exam}.json    ✅
└── （無 notes/ 講義資料夾）                                       ❌ 待補
```

$$\text{缺口} = \text{knowledge-base 無講義} \Rightarrow \text{指引 PDF 內容尚未整合進 KB，出題時需手動對照}$$
