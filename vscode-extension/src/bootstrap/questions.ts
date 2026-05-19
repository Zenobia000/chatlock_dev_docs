export type QuestionType = 'text' | 'single' | 'multi';

export interface Question {
  id: string;
  group: string;
  type: QuestionType;
  prompt: string;
  why: string;
  options?: string[];
  placeholder?: string;
}

export const QUESTIONS: Question[] = [
  {
    id: 'Q1',
    group: '業務脈絡',
    type: 'text',
    prompt: '你的產品要解決什麼核心問題？目標用戶是誰？',
    why: 'Problem statement 是後續 PRD §1 與所有 ADR 的源頭。寫具體一點：誰、什麼情境下、什麼痛、現在怎麼解、為何不夠。',
    placeholder: '例：給 junior 工程師用的架構決策 copilot — 他們知道怎麼寫 code，但不知道開發前該規劃什麼...',
  },
  {
    id: 'Q2',
    group: '業務脈絡',
    type: 'single',
    prompt: '預期用戶規模（首年 MAU）？',
    why: '規模決定 NFR baseline、infra 選型、是否需要分散式架構。10k 是 single VM vs cluster 的常見分水嶺。',
    options: [
      '< 100 (內部工具 / PoC)',
      '100 – 10k (小型產品)',
      '10k – 1M (中型產品)',
      '> 1M (大型 / 高流量)',
    ],
  },
  {
    id: 'Q3',
    group: '規模與效能',
    type: 'single',
    prompt: '延遲敏感度？',
    why: '決定是否需要快取 / CDN / read replica / async queue。延遲要求愈高、架構複雜度愈高。',
    options: [
      '即時 (< 100ms，如遊戲 / 交易)',
      '互動 (< 1s，如一般 Web)',
      '批次 (秒級，如報表)',
      '離線 (分鐘級+，如 ETL)',
    ],
  },
  {
    id: 'Q4',
    group: '合規與資安',
    type: 'multi',
    prompt: '你的系統會處理什麼資料？（多選）',
    why: '決定加密（at-rest / in-transit）、audit log、retention 策略、是否需要 DPIA。資料等級錯估會在 P3 設計階段被打回票。',
    options: [
      '無敏感資料 (公開內容 / 匿名數據)',
      'PII (姓名 / Email / 電話 / 地址)',
      '金流 (信用卡 / 銀行帳號)',
      '醫療 (病歷 / 健保 / 用藥)',
      '兒少資料 (< 13 歲使用者)',
    ],
  },
  {
    id: 'Q5',
    group: '合規與資安',
    type: 'multi',
    prompt: '需要符合的合規框架？（多選）',
    why: '合規框架決定文件 / 流程 / observability 的優先級。SOC2 audit 會要求 access log、change log；GDPR 會要求 right-to-be-forgotten 流程。',
    options: [
      '無 / 不確定',
      'SOC2 (B2B SaaS 客戶常要求)',
      'GDPR (有歐盟用戶)',
      'HIPAA (美國醫療)',
      'PCI-DSS (處理信用卡)',
      'ISO 27001 / 個資法 / 其他',
    ],
  },
  {
    id: 'Q6',
    group: '合規與資安',
    type: 'single',
    prompt: '是否需要稽核軌跡 (audit trail)？',
    why: 'audit log 影響 DB schema (created_by / updated_by)、event sourcing 決策、儲存成本估算。',
    options: ['不需要', '重要操作要 (登入 / 權限變更)', '所有寫操作都要'],
  },
  {
    id: 'Q7',
    group: '團隊與時程',
    type: 'single',
    prompt: '目前 team size？',
    why: '決定 code review 流程、observability 投入比、是否需要 service ownership 邊界。單人專案不需要 micro-service 切分。',
    options: ['單人', '2-5 人 (小團隊)', '6-20 人 (中型團隊)', '> 20 人 (大型 / 多團隊)'],
  },
  {
    id: 'Q8',
    group: '團隊與時程',
    type: 'single',
    prompt: '第一版上線 deadline？',
    why: '決定技術選型激進度。1 個月 deadline 不適合自研 framework；6 個月可以接受嘗試新技術。',
    options: ['< 1 個月 (MVP 衝刺)', '1-3 個月 (短期)', '3-6 個月 (一般)', '6 個月+ (長期 / 沒有)'],
  },
  {
    id: 'Q9',
    group: '既有 stack',
    type: 'multi',
    prompt: '主要程式語言 / 既有 stack 限制？（可多選）',
    why: '可複選，現實常見混合（例如 Python 後端 + TypeScript 前端）。後續 framework 推薦基於此；有限制會跳過不相關選項。也可在 Other 自填你正在用的特定 framework / library。',
    options: [
      'Python (data / ML / 後端)',
      'TypeScript / Node (全端 / 前端重)',
      'Java / Kotlin (企業 / Android)',
      'Go (高效能後端)',
      'Rust (系統 / 高效能)',
      'C# / .NET',
      'Ruby / Rails',
      'PHP / Laravel',
      '開放 (沒偏好)',
    ],
  },
  {
    id: 'Q10',
    group: '既有 stack',
    type: 'multi',
    prompt: '部署環境？（可多選）',
    why: '可複選，現實常見 hybrid（例如 local dev + AWS prod，或 Cloudflare edge + AWS origin）。決定 IaC 工具、observability 選型、CI/CD 模板。',
    options: [
      'Local / 自架 VPS',
      'AWS',
      'GCP',
      'Azure',
      'Cloudflare / Vercel / Netlify (Edge)',
      'Kubernetes (任一 cloud)',
      'Heroku / Railway / Render (PaaS)',
      '還沒決定',
    ],
  },
  {
    id: 'Q11',
    group: '學習目標',
    type: 'single',
    prompt: '你想了解每個決策的程度？',
    why: '決定後續 decision card 出現頻率與深度。Educational 會慢但學最多；fast-handoff 最快但你會錯過學習機會。',
    options: [
      'Educational — 每個決策我都想懂為什麼（會看每張 decision card）',
      'Balanced — 只看重要決策 (架構 / DB / API)，其他自動就好',
      'Fast-handoff — 盡快產出 spec 給 coder，少打擾我',
    ],
  },
  {
    id: 'Q12',
    group: '學習目標',
    type: 'multi',
    prompt: '你對哪些領域最沒把握？（多選）',
    why: '系統會在這些領域多花教育成本（多 callout、多 trade-off 對比）。誠實選會得到最好的引導。',
    options: [
      '架構選型 (mono / micro / serverless / agentic)',
      '資料庫設計 (schema / index / migration)',
      'API 設計 (REST / GraphQL / gRPC / 版控)',
      '部署 / CI/CD',
      '監控 / observability (log / metric / trace)',
      '測試策略 (unit / integration / e2e 比例)',
      '合規 / 資安',
      '都還好 (我有底)',
    ],
  },
];

export const GROUPS = Array.from(new Set(QUESTIONS.map((q) => q.group)));
