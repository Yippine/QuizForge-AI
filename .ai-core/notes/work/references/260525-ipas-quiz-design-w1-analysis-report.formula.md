---
title: "iPAS 初級題庫生成策略研究報告"
task: ipas-initial-quiz-generation
workflow: w1-research
created: 2026-05-22
status: completed
sources:
  - 115年第一次第一科（L21）50題
  - 115年第一次第二科（L23）50題
  - 114年第四梯次第一科（L21）50題
  - 114年第四梯次第二科（L23）50題
---

# w1 研究報告：iPAS 初級題庫生成策略

$$\text{Report} = \text{難度落差分析} \oplus \text{分類體系（MECE）} \oplus \text{出題策略} \oplus \text{T1/T2/T3 設計律}$$

---

## Part 1：114 vs 115 難度落差分析（G₀）

$$\text{DifficultyGap} = \Delta(\text{情境化深度}) + \Delta(\text{技術精度}) + \Delta(\text{陷阱密度}) + \Delta(\text{新技術涵蓋})$$

### 1.1 第一科（L21）落差

| 維度 | 114年（對照組）| 115年（基準 100%）| 落差 |
|------|-------------|-----------------|------|
| 情境長度 | 2-4行，單一情境 | 4-8行，多條件情境 | +50% |
| 技術精度 | 基本定義層（Bias-Variance, KNN算法）| 機制層（Flash Attention IO特性、VAE用途切換）| 大幅上升 |
| 陷阱類型 | 一般干擾選項 | 反直覺正確答案（Q4: One-hot≠outlier處理；Q43: 6陳述混合錯誤）| 更精妙 |
| 計算題 | 無 | Q18 Binary Search步驟計算 | 新增 |
| 新技術 | 較少 | Flash Attention, RFT, VAE for anomaly detection | +5項 |

$$\text{115年第一科難度結構} = \begin{cases}
\text{情境推理題} & 60\%\text{（vs 114年的 40\%）} \\
\text{技術機制題} & 25\%\text{（vs 114年的 35\%）} \\
\text{法規應用題} & 10\% \\
\text{計算題} & 5\%
\end{cases}$$

**115年 L21 關鍵難點（陷阱題解析）**：

- **Q4**：離群值問題，One-hot Encoding 用於類別→數值轉換，不是處理outlier的正確方式 → 答案C（最不適當）
- **Q22**：VAE 在「無標注異常資料」情況下做異常偵測（學習正常分佈，偏差=異常），不是生成圖像
- **Q43**：6條陳述綜合判斷，錯誤點在「半監督=僅未標注資料」（實際兼用）+ 「自監督=同監督式需人工標注」
- **Q26**：LIME 是 post-hoc（後處理），非 intrinsic（模型本身透明）

### 1.2 第二科（L23）落差

| 維度 | 114年（對照組）| 115年（基準 100%）| 落差 |
|------|-------------|-----------------|------|
| 新技術密度 | MCP/A2A/APE（新但可預測）| SynthID/AgentKit/RFT/Homomorphic Encryption | +大幅 |
| 計算題 | 無 | Q25 ROI（月省費=600×50-600×2000/1000×0.8=29,040，回收=200,000÷29,040≈7月）| 新增 |
| 系統排序題 | Q30 物流四步驟排序 | Q44 語音AI改進步驟排序（更複雜）| 更難 |
| 合規深度 | 基本隱私（Federated Learning）| Homomorphic Encryption + 資安部署策略 | 深化 |
| 治理角度 | 單一角度 | 多角度（技術+法遵+資安+成本）整合判斷 | 顯著 |

$$\text{115年第二科新增考點} = \begin{cases}
\text{Vibe Coding（Q19）} & \to \text{AI輔助開發，代碼需審查律} \\
\text{AgentKit（Q21）} & \to \text{OpenAI 2025年，Agents建構/工具整合/流程} \\
\text{SynthID（Q22）} & \to \text{Google Veo，每幀不可見數位浮水印} \\
\text{RFT（Q40）} & \to \text{Reinforcement Fine-tuning，reward訊號調整行為偏好} \\
\text{ROI計算（Q25）} & \to \text{具體數字計算，需掌握Token Economics公式}
\end{cases}$$

---

## Part 2：MECE 分類體系（G₁）

### 2.1 L21 分類體系

$$\text{L21\_Categories} = \{C_1, C_2, C_3, C_4, C_5, C_6\} \quad \text{ME} \times \text{CE}$$

| 代號 | 分類名稱 | 子分類 | 115年題數 | 114年題數 |
|------|---------|--------|---------|---------|
| L21-C1 | AI基本概念與分類 | 強/弱AI、AGI、應用領域分類 | 3 | 2 |
| L21-C2 | 機器學習範式與演算法 | 監督/非監督/半監督/強化/自監督、DT/SVM/KNN/RF/LR | 8 | 10 |
| L21-C3 | 資料處理與特徵工程 | 資料類型、清洗、特徵工程、視覺化、Big Data、ETL | 8 | 8 |
| L21-C4 | 模型訓練、評估與優化 | 過擬合、正則化、損失函數、評估指標、Fine-tuning、遷移學習 | 10 | 12 |
| L21-C5 | 進階AI技術 | 深度學習架構(CNN/RNN/LSTM/Transformer)、生成模型(VAE/GAN/Diffusion)、LLM、XAI、RAG | 14 | 12 |
| L21-C6 | AI應用規劃與治理 | 應用場景、導入流程、法規(金融AI/個資)、資料治理 | 7 | 6 |

**覆蓋率目標**：每分類最少 35 題，C4/C5 各 50 題（最高頻）

### 2.2 L23 分類體系

$$\text{L23\_Categories} = \{D_1, D_2, D_3, D_4, D_5, D_6, D_7, D_8\} \quad \text{ME} \times \text{CE}$$

| 代號 | 分類名稱 | 子分類 | 115年題數 | 114年題數 |
|------|---------|--------|---------|---------|
| L23-D1 | 生成式AI基礎 | GenAI vs 鑑別式AI、LLM架構、基礎模型 | 5 | 4 |
| L23-D2 | 提示工程 | Zero/Few-shot、CoT/ToT、Graph Prompting、APE、Context Engineering | 8 | 9 |
| L23-D3 | RAG與知識增強 | RAG架構、Chunking、增量索引、MCP、Knowledge Distillation | 7 | 6 |
| L23-D4 | AI Agent與工具整合 | Context-aware Agent、Solution Graph、AgentKit、A2A、n8n | 6 | 5 |
| L23-D5 | No-Code/Low-Code與AI開發 | 平台特性、AutoML區別、Vibe Coding、AI程式碼工具 | 7 | 7 |
| L23-D6 | 部署、運維與效能 | 部署策略、Latency、Token Economics、Data Drift、ROI/TCO | 7 | 6 |
| L23-D7 | AI風險、倫理與治理 | Hallucination、Bias、Privacy(Federated/HE)、SynthID/C2PA、合規 | 8 | 9 |
| L23-D8 | 生成式AI商業應用規劃 | 應用場景、導入流程、PoC、成本效益分析 | 5 | 4 |

**覆蓋率目標**：每分類最少 30 題，D2/D3/D7 各 40 題（最高頻）

---

## Part 3：出題策略設計

### 3.1 難度梯度設計律

$$\text{DifficultyTier} = \begin{cases}
T1\_\text{仿真} & 100\% \Rightarrow \text{情境化推理 + 精確機制辨別} & 30\% \\
T2\_\text{強化} & 110\text{-}115\% \Rightarrow \text{跨分類整合 + 計算題 + 多步推導} & 40\% \\
T3\_\text{挑戰} & 125\text{-}130\% \Rightarrow \text{多陳述混合 + 反直覺 + 三維整合} & 30\%
\end{cases}$$

### 3.2 T1 出題模板（仿真 115年水準）

$$T1\_\text{pattern} = \text{企業情境}(4\text{行}) + \text{技術機制選擇}(1\text{個關鍵陷阱選項})$$

**設計要素**：
- 情境：具體企業 + 具體業務問題 + 具體技術限制
- 選項：一個「聽起來合理但技術上錯誤」的干擾選項
- 依據：對應學習指引章節（必填出題參考）

**T1 範例（L21-C4）**：
> 某電商平台訓練商品推薦模型，測試集準確率 94%，但上線後一個月準確率降至 71%。分析顯示近期用戶行為模式與訓練資料的統計分布差異顯著增加。下列何者最能描述此現象？
> (A) 模型過擬合訓練資料（B) 訓練資料品質不足（C) Data Drift 導致模型退化（D) 評估指標設計不當
> 答案：C；出題參考：學習指引科目1 p.XX（機器學習部署與監控）

### 3.3 T2 出題模板（跨概念整合）

$$T2\_\text{pattern} = \text{多條件情境}(6\text{行}) + \text{跨分類知識整合} \mid \text{計算題} \mid \text{排序題}$$

**T2 計算題型（L23-D6）**：
> 某企業每月需翻譯 800 份文件，人工翻譯每份 80 元。改用 LLM API，每份需 3,000 Tokens，Token 費用 1.0 元/1000 Tokens。系統整合費用 25 萬元。ROI 評估：月節省成本與回收期各為何？
> (A) 月省 61,000 元，約 4 個月 (B) 月省 61,000 元，約 5 個月 (C) 月省 57,000 元，約 4.4 個月 (D) 月省 57,000 元，約 5 個月

計算律：月省 = 800×80 - 800×3000/1000×1.0 = 64,000 - 2,400 = 61,600 元；回收 = 250,000 ÷ 61,600 ≈ 4.06 ≈ 4 個月

### 3.4 T3 出題模板（整合挑戰）

$$T3\_\text{pattern} = \text{多陳述複合}(5\text{-}6\text{條}) \mid \text{反直覺整合} \mid \text{技術+法遵+成本三維}$$

**T3 多陳述範例（L21-C2）**：
> 關於不同機器學習範式的特性，下列陳述何者正確？
> 1. 半監督學習結合少量標注與大量未標注資料...（正確）
> 2. 自監督學習的訓練方式與監督學習相同，需人工標注...（錯誤）
> 3. 強化學習中，策略是將狀態映射至動作的函數...（正確）
> 4. 遷移學習必須使用與目標任務完全相同的資料格式...（錯誤）
> 5. 聯邦學習屬於分散式訓練，各節點不分享原始資料...（正確）

---

## Part 4：出題數量與覆蓋率規劃

### 4.1 L21 出題配額

$$\text{L21\_Quota} = \sum_{i=1}^{6} n_{Ci} = 375\text{題}$$

| 分類 | T1（30%）| T2（40%）| T3（30%）| 小計 |
|------|---------|---------|---------|------|
| L21-C1 AI基本概念 | 15 | 20 | 15 | 50 |
| L21-C2 ML範式與演算法 | 15 | 20 | 15 | 50 |
| L21-C3 資料處理 | 12 | 14 | 12 | 38 |
| L21-C4 訓練評估優化 | 19 | 24 | 19 | 62 |
| L21-C5 進階AI技術 | 26 | 36 | 26 | 88 |
| L21-C6 應用規劃治理 | 26 | 36 | 25 | 87 |
| **合計** | **113** | **150** | **112** | **375** |

### 4.2 L23 出題配額

$$\text{L23\_Quota} = \sum_{j=1}^{8} n_{Dj} = 375\text{題}$$

| 分類 | T1（30%）| T2（40%）| T3（30%）| 小計 |
|------|---------|---------|---------|------|
| L23-D1 GenAI基礎 | 8 | 9 | 8 | 25 |
| L23-D2 提示工程 | 15 | 20 | 15 | 50 |
| L23-D3 RAG知識增強 | 15 | 20 | 15 | 50 |
| L23-D4 AI Agent工具 | 12 | 14 | 12 | 38 |
| L23-D5 No-Code/Low-Code | 12 | 14 | 12 | 38 |
| L23-D6 部署運維效能 | 15 | 20 | 15 | 50 |
| L23-D7 AI風險倫理治理 | 15 | 20 | 15 | 50 |
| L23-D8 商業應用規劃 | 22 | 30 | 22 | 74 |
| **合計** | **114** | **147** | **114** | **375** |

**合計：L21（375題）+ L23（375題）= 750題合併完整版**

---

## Part 5：高機率新考點清單

$$\text{HighPriority}_{115v3.0} = \text{下列主題在 115年首次大量出現，應優先覆蓋}$$

### L21 高機率新考點

| 考點 | 出題參考 | 建議題數 | 難度 |
|------|---------|--------|------|
| Flash Attention 機制（減少中間結果儲存） | 學習指引科目1 LLM優化 | 3 | T2 |
| VAE vs GAN vs Diffusion 用途差異 | 學習指引科目1 生成模型 | 5 | T2/T3 |
| RLHF 流程（偏好資料→獎勵模型→PPO）| 學習指引科目1 LLM訓練 | 4 | T2 |
| post-hoc XAI（LIME/SHAP）vs intrinsic XAI | 學習指引科目1 XAI | 5 | T2 |
| Batch Inference vs Real-time Inference | 學習指引科目1 推論服務 | 3 | T1 |
| 金融機構AI作業規範（必要揭露事項）| 能力指引表10 p.18 | 4 | T1 |
| 去識別化策略（政府資料開放）| 能力指引表10 p.19 | 3 | T1 |

### L23 高機率新考點

| 考點 | 出題參考 | 建議題數 | 難度 |
|------|---------|--------|------|
| Vibe Coding（AI輔助開發+代碼審查必要性）| 學習指引科目2 AI協作 | 5 | T1/T2 |
| AgentKit（Agents建構/工具整合/任務流程）| 學習指引科目2 Agent工具 | 4 | T2 |
| SynthID（每幀不可見數位浮水印）| 學習指引科目2 內容真實性 | 3 | T1 |
| RFT（reward訊號調整行為偏好）| 學習指引科目2 Fine-tuning | 4 | T2 |
| Homomorphic Encryption（加密狀態下計算）| 學習指引科目2 隱私技術 | 3 | T3 |
| Token Economics計算（ROI公式）| 學習指引科目2 成本分析 | 5 | T2 |
| MCP vs RAG 差異（工具互動 vs 知識補充）| 學習指引科目2 知識增強 | 4 | T2 |
| Encoder-Decoder vs Decoder-only | 學習指引科目2 LLM架構 | 3 | T2 |
| PoC 範疇界定（不含長期治理框架建立）| 學習指引科目2 導入流程 | 3 | T1 |

---

## Part 6：陷阱選項設計原則

$$\text{TrapDesign} = \begin{cases}
\text{技術相近混淆} & \text{（VAE異常偵測 vs VAE圖像生成）} \\
\text{因果倒置} & \text{（Data Drift → 模型退化，非「過擬合」）} \\
\text{範疇錯誤} & \text{（PoC }\neq\text{ 建立長期治理框架）} \\
\text{程度誇大} & \text{（Homomorphic Encryption可在加密狀態下「任何運算」→ 僅限特定運算）} \\
\text{多陳述選項挖坑} & \text{（某條陳述刻意使用「必須」「總是」等絕對詞）}
\end{cases}$$

---

## Part 7：出題參考對應索引

$$\text{ReferenceMap（建議給每題標注）} = \begin{cases}
\text{學習指引科目1} & \Rightarrow L21\text{ 各分類知識點頁碼} \\
\text{學習指引科目2} & \Rightarrow L23\text{ 各分類知識點頁碼} \\
\text{能力指引表2/4/7/10} & \Rightarrow \text{高機率考點表格頁碼} \\
\text{115年試題 Q\{N\}} & \Rightarrow \text{仿真題標注對應原題（T1出題參考）} \\
\text{114年試題 Q\{N\}} & \Rightarrow \text{比較題用（T3對照設計）}
\end{cases}$$

---

## Summary

$$\text{Deliverable\_Strategy} = \begin{cases}
\text{ipas-quiz-L21.csv} & 375\text{題，C1-C6，T1:T2:T3=3:4:3} \\
\text{ipas-quiz-L23.csv} & 375\text{題，D1-D8，T1:T2:T3=3:4:3} \\
\text{ipas-quiz-complete.csv} & 750\text{題，合併+統一欄位驗證}
\end{cases}$$

$$\text{NextStep} = G_2\text{（L21出題）} \to G_3\text{（L23出題）} \to G_4\text{（合併）} \to G_5\text{（QA驗收）}$$
