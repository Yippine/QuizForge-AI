---
task: ipas-initial-quiz-generation
type: references
created: 2026-05-25
item: 標籤命名決策
---

# 難度標籤命名決策

$$\text{TagMapping} = \begin{cases}
T1 & \to \text{「初級仿真題」} & 100\%\;\text{難度，對標 115 年考試水準} \\
T2 & \to \text{「中級強化題」} & 110\text{-}115\%\;\text{難度，跨概念應用} \\
T3 & \to \text{「高級挑戰題」} & 125\text{-}130\%\;\text{難度，整合型反直覺}
\end{cases}$$

$$\text{Decision}: \text{標籤欄原值 T1/T2/T3（機器可讀 key）} \to \text{中文全名（人類可讀 value）}$$

$$\text{Rationale}: \text{副總只需題目集，無系統匯入需求} \to \text{可讀性優先，三個 CSV 全部替換}$$

$$\text{Applied}: \texttt{ipas-quiz-L11.csv} + \texttt{ipas-quiz-L12.csv} + \texttt{ipas-quiz-complete.csv}$$

$$\text{Delivery}: \text{2026-05-25 已傳送給副總湯惠剛（tommy）}$$
