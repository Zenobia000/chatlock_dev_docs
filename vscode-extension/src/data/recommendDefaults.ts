import {
  AdrLedgerEntry,
  BootstrapIntent,
  DefaultRecommendation,
  DevTeamState,
  PendingDecision,
} from '../state/types';

interface RecommendContext {
  decision: PendingDecision;
  state: DevTeamState;
  bootstrap: BootstrapIntent | null;
  ledger: AdrLedgerEntry[];
}

/**
 * 7 條 heuristic 規則，依匹配度由高到低排序。
 * 每條規則回傳 DefaultRecommendation | null。
 * 第一個非 null 即為答案。
 */
const RULES: Array<{ name: string; match: (ctx: RecommendContext) => DefaultRecommendation | null }> = [
  // R0: OQ 自帶 options[].recommended=true → 直接用
  {
    name: 'options-flag',
    match: ({ decision }) => {
      const opt = decision.options?.find((o) => o.recommended);
      if (!opt) return null;
      return {
        option_label: opt.label,
        reasoning: opt.summary || 'OQ 本身已標記推薦選項。',
        source: 'options-flag',
        confidence: 'high',
      };
    },
  },

  // R1: problem statement 補完類（OQ 從 PRD §1 短缺偵測來）
  {
    name: 'problem-statement-fill',
    match: ({ decision, state, bootstrap }) => {
      const topic = decision.topic.toLowerCase();
      const isPmDecision =
        decision.blocking_gate === 'Gate1_PRD' &&
        (topic.includes('problem statement') || topic.includes('dogfooding') || topic.includes('細節'));
      if (!isPmDecision) return null;
      const featureCount = state.active_features.length;
      const learning = bootstrap?.learning?.mode ?? state.ux_mode ?? 'balanced';
      return {
        option_label: '接受 PRD v2 已預填的脈絡',
        reasoning: `PRD v2 從 bootstrap (${learning} mode, weak_areas=${bootstrap?.learning?.weak_areas?.length ?? '?'}) 推論出「為什麼值得解 / 不解的成本」各 4 條，標 ASSUMPTION。後續 multi-role review 會再驗。對 ${featureCount} 個 active feature 適用。若覺得不足可改用 Modify 模式自行補。`,
        source: 'cascade-hints',
        source_ref: 'PRD §1 + bootstrap learning + ASSUMPTION 標記',
        confidence: 'high',
      };
    },
  },

  // R2: rollout / canary / deployment 類
  {
    name: 'rollout-strategy',
    match: ({ decision, bootstrap }) => {
      const t = decision.topic.toLowerCase();
      if (!/rollout|canary|staged|deploy|big[- ]bang/.test(t)) return null;
      const scale = bootstrap?.business?.user_scale ?? '';
      if (scale.includes('< 100')) {
        return {
          option_label: 'Big-bang（單機部署，無 canary）',
          reasoning: `Bootstrap 標 user_scale < 100 + single-instance infra hint。canary 對 < 100 用戶過度設計，big-bang + git revert 已足夠。`,
          source: 'cascade-hints',
          source_ref: 'bootstrap.user_scale + cascade_hints.infra_seed',
          confidence: 'high',
        };
      }
      if (scale.includes('100') || scale.includes('10k')) {
        return {
          option_label: 'Staged rollout（依群組分批）',
          reasoning: `${scale} 規模適合 staged。Canary 對非 SaaS 過度。詳見 KB 10 §3.1 對比表。`,
          source: 'catalog',
          source_ref: 'KB 10 resilience_patterns §3.1',
          confidence: 'medium',
        };
      }
      return null;
    },
  },

  // R3: educational mode + deadline 張力（OQ-002 那種）
  {
    name: 'edu-vs-deadline',
    match: ({ decision, bootstrap }) => {
      const t = decision.topic.toLowerCase();
      if (!/張力|tension|edu.*deadline|deadline.*edu|聚焦|scope.*deadline/.test(t)) return null;
      const mode = bootstrap?.learning?.mode;
      const deadline = bootstrap?.team_timeline?.first_release_deadline ?? '';
      if (mode === 'educational' && deadline.startsWith('< 1')) {
        return {
          option_label: '改用 balanced mode 換取速度（MVP 後再切回 educational）',
          reasoning: `Educational 全展開 trade-off + < 1 月 deadline 是個矛盾。建議 MVP 衝刺改 balanced 模式（只看關鍵 gate decisions），把學習目標延後到 v2 再展開。這比延長 deadline 或聚焦 scope 風險更小。`,
          source: 'cascade-hints',
          source_ref: 'bootstrap.learning.mode vs first_release_deadline 衝突',
          confidence: 'high',
        };
      }
      return null;
    },
  },

  // R4: scope / MVP focus（OQ-003 那種）
  {
    name: 'mvp-scope-focus',
    match: ({ decision, bootstrap }) => {
      const t = decision.topic.toLowerCase();
      if (!/scope|聚焦|weak.*areas?|主軸/.test(t)) return null;
      const weakCount = bootstrap?.learning?.weak_areas?.length ?? 0;
      if (weakCount < 5) return null;
      return {
        option_label: '聚焦在「架構選型 + 資料庫設計」兩條主軸',
        reasoning: `Bootstrap 標 ${weakCount}/7 weak_areas 等於全選，全程 heavy callout 會拖慢 MVP。建議 P2 ADR 與 P3 ERD 重點教學，其他用 KB 預設值帶過。完成 MVP 後再迭代擴充學習領域。`,
        source: 'cascade-hints',
        source_ref: 'bootstrap.learning.weak_areas (全選)',
        confidence: 'medium',
      };
    },
  },

  // R5: DB / schema / migration 類
  {
    name: 'db-choice',
    match: ({ decision, bootstrap }) => {
      const t = decision.topic.toLowerCase();
      if (!/\b(db|database|資料庫|schema|migration)\b/.test(t)) return null;
      const scale = bootstrap?.business?.user_scale ?? '';
      const dataTypes = bootstrap?.compliance?.data_types ?? [];
      const hasPII = dataTypes.some((d) => /PII|金流|醫療/.test(d));
      if (scale.includes('< 100')) {
        return {
          option_label: hasPII ? 'PostgreSQL（single instance, encrypted）' : 'SQLite（單機）',
          reasoning: hasPII
            ? '< 100 用戶 + 有 PII → 單機 Postgres 足以負荷，啟用 at-rest encryption 滿足合規。'
            : '< 100 用戶 + 無敏感資料 → SQLite 最簡，無維運成本。需多人寫入時再升 Postgres。',
          source: 'catalog',
          source_ref: 'KB 11 data_and_stack_catalog + bootstrap.user_scale',
          confidence: 'high',
        };
      }
      return null;
    },
  },

  // R6: API design 類
  {
    name: 'api-style',
    match: ({ decision, bootstrap }) => {
      const t = decision.topic.toLowerCase();
      if (!/\b(api|rest|graphql|grpc|endpoint)\b/.test(t)) return null;
      const stack = bootstrap?.stack?.primary_language ?? '';
      return {
        option_label: 'REST + OpenAPI（同步、單向、人類可讀）',
        reasoning: `對小團隊 + ${stack || '一般 stack'}，REST + OpenAPI 學習成本最低、工具最成熟。GraphQL 適合複雜 client (mobile + web) 場景，gRPC 適合內部高吞吐。MVP 期建議 REST 起步，後續再評估。`,
        source: 'catalog',
        source_ref: 'KB 08 api_design_catalog',
        confidence: 'medium',
      };
    },
  },

  // R7: auth / token / session
  {
    name: 'auth-model',
    match: ({ decision, bootstrap }) => {
      const t = decision.topic.toLowerCase();
      if (!/\b(auth|token|session|login|授權|認證)\b/.test(t)) return null;
      const scale = bootstrap?.business?.user_scale ?? '';
      const dataTypes = bootstrap?.compliance?.data_types ?? [];
      const hasPII = dataTypes.some((d) => /PII|金流|醫療/.test(d));
      if (scale.includes('< 100') && !hasPII) {
        return {
          option_label: 'Session cookie（HttpOnly + Secure）',
          reasoning: '< 100 用戶 + 無敏感資料 → session cookie 最簡，無 JWT 旋轉 / 黑名單複雜度。Server-side session 用 SQLite/Postgres 存即可。',
          source: 'catalog',
          source_ref: 'KB 11 + KB 08',
          confidence: 'high',
        };
      }
      return null;
    },
  },

  // R8: measurement / metrics / KPI（OQ-005 那種）
  {
    name: 'kpi-measurement',
    match: ({ decision }) => {
      const t = decision.topic.toLowerCase();
      if (!/k4|ask.?back|量測|measurement|metric|kpi/.test(t)) return null;
      return {
        option_label: '手動觀察：每完成一個 feature handoff，人工統計 coding agent ask-back 次數記到 session-{id}.md',
        reasoning: '單人 PoC 階段不建構 metrics pipeline。手動記錄成本低、足以指導決策。Automated dashboard 屬 v2+ 範疇，當前 KPI 不阻擋 release。',
        source: 'cascade-hints',
        source_ref: 'bootstrap.team_size=單人 + scope guardrail',
        confidence: 'medium',
      };
    },
  },
];

export function recommend(ctx: RecommendContext): DefaultRecommendation {
  for (const rule of RULES) {
    const r = rule.match(ctx);
    if (r) return r;
  }
  return {
    option_label: '無預設建議',
    reasoning: '此 OQ 沒命中任何 heuristic 規則。請評估上方 Related Files 與 Similar Precedents，自行選擇或開 Roundtable 討論。',
    source: 'none',
    confidence: 'low',
  };
}

export function findSimilarPrecedents(
  decision: PendingDecision,
  ledger: AdrLedgerEntry[]
): AdrLedgerEntry[] {
  const topicLower = decision.topic.toLowerCase();
  // simple keyword overlap match
  const keywords = topicLower
    .split(/\s+|[、，,]/)
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w))
    .slice(0, 5);
  if (keywords.length === 0) return [];
  return ledger
    .filter((e) => {
      const text = `${e.title} ${(e.tags ?? []).join(' ')}`.toLowerCase();
      return keywords.some((k) => text.includes(k));
    })
    .slice(0, 5);
}
