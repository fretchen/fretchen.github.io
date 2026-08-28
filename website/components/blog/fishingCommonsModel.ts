// Types für Moana's Choice Game - Updated to boats-based system

export const otherChiefs = ["Chief Kai", "Chief Tala", "Chief Sina"];

export type ScenarioType = "random" | "sustainable" | "aggressive";
export type CommunityScenarioType = "democratic" | "hierarchical";

export type RoundHistory = {
  round: number;
  moanaBoats: number | null;
  moanaFish: number | null;
  otherBoats: number[] | null;
  otherFish: number[] | null;
  totalBoats: number | null;
  totalCatch: number | null;
  fishAfter: number | null;
  regeneration: number | null;
};

export type IslandRoundHistory = RoundHistory & {
  // Cost-related attributes for island efficiency analysis
  moanaCost: number | null;
  moanaCostPerFish: number | null;
  otherCosts: number[] | null;
  otherCostPerFish: number[] | null;
  totalCost: number | null;
  avgCostPerFish: number | null;
};

export type CommunityRoundHistory = RoundHistory & {
  // Community governance specific attributes
  leader: number; // Who was leader this round (0=Moana, 1=Kai, 2=Tala, 3=Sina)
  leaderStrategy: string; // "conservative" | "moderate" | "aggressive"
  leaderDistributionMethod: string; // "equal" | "hybrid" | "efficiency"
  leaderRedistributionPolicy: string; // "conservative" | "moderate" | "progressive"
  redistributionAmount: number; // How much fish was redistributed
  moanaNetTransfer: number; // Moana's gain/loss through redistribution
  activeOstromPrinciples: string[]; // Which principles were active this round
  moanaOriginalCatch: number; // Before redistribution
  otherOriginalCatch: number[]; // Before redistribution
  // Cost-related attributes (Option 1: minimal cost extension)
  moanaCost: number; // Moana's total cost for this round
  otherCosts: number[]; // Other chiefs' total costs for this round
};

// Mathematical parameters from the notebook
export const MODEL_PARAMS = {
  // Regeneration parameters
  g0: 0.03, // Linear growth factor
  g1: 0.001, // Quadratic growth factor

  // Catch efficiency parameter
  y0: 0.01, // Catch efficiency

  // Cost parameter
  c0: 0.125, // Cost per boat

  // cost for the individual islands
  // important for the second game
  c_islands: [0.125, 0.25, 0.75, 1],

  // Initial stock
  s_init: 100,

  // Number of players (4 total: Moana + 3 chiefs)
  nplayers: 4,
};

// Community governance parameters
export const COMMUNITY_PARAMS = {
  base_quota: 0.2, // Base quota for least efficient
  efficiency_bonus: 0.1, // Additional quota per efficiency level
  cooperation_bonus: 0.05, // Bonus for community participation
};

export const calculateEfficientBoats = (s_t: number, c_t: number): number => {
  /**
   * What is the number of boats that gives us maximum catch with no losses?
   * If we were really smart, we could calculate it from the condition y_t = c_t
   *
   * Args:
   *     s_t: stock at time t
   *     c_t: cost of fishing per boat
   */
  return Math.pow((MODEL_PARAMS.y0 * s_t) / c_t, 2) / MODEL_PARAMS.nplayers;
};

// Calculate sustainable boat numbers
// based on the assumption the y_t = g_t
export const calculateSustainableBoats = (stock: number): number => {
  // Sustainable boats: b_sust = (g0/y0 * (1 - g1 * s_init))^2
  const b_sust = Math.pow((MODEL_PARAMS.g0 / MODEL_PARAMS.y0) * (1 - MODEL_PARAMS.g1 * stock), 2);
  return b_sust / MODEL_PARAMS.nplayers;
};

// Calculate sustainable and competitive boat numbers based on the notebook
export const calculateOptimalBoats = () => {
  // Boats per player (divide total by number of players)
  const low_fishing = Math.floor(calculateSustainableBoats(MODEL_PARAMS.s_init));
  const intensive_fishing = Math.floor(calculateEfficientBoats(MODEL_PARAMS.s_init, MODEL_PARAMS.c0));
  return { low_fishing, intensive_fishing };
};

// Get the calculated optimal values
export const OPTIMAL_BOATS = calculateOptimalBoats();

// Mathematical functions from the notebook - exact implementation
export const calculateTotalCatch = (stock: number, totalBoats: number): number => {
  // y_t = y0 * s_t * sqrt(b_t)
  return MODEL_PARAMS.y0 * stock * Math.sqrt(totalBoats);
};

export const calculateRegeneration = (stock: number): number => {
  // g_t = g0 * (s_t - g1 * s_t^2)
  return MODEL_PARAMS.g0 * (stock - MODEL_PARAMS.g1 * stock * stock);
};

export type ConservationStrategy = "aggressive" | "moderate" | "conservative";

export interface ConservationResult {
  adjustedSustainableBoats: number;
  strategy: ConservationStrategy;
  conservationFactor: number;
}

/**
 * Simulates the decision of a leader on the appropriate conservation level
 * based on current stock level and their island efficiency
 */
export const leaderConservationLevel = (
  leader: number,
  sustainableBoats: number,
  currentStock: number,
  initialStock: number,
  previousStock?: number,
): ConservationResult => {
  // Define conservation strategies with slightly more aggressive factor
  const conFactor = 2.5; // Increased from 2 to 2.5 for stronger effects
  const conservationStrategies: Record<ConservationStrategy, number> = {
    aggressive: conFactor, // 150% above sustainable (risky)
    moderate: 1.0, // Exactly sustainable (safe)
    conservative: 1 / conFactor, // 60% of sustainable (very safe)
  };

  // Simulate leader's decision based on stock level, their island efficiency, and trend
  let strategy: ConservationStrategy;

  // Calculate stock trend if previous stock is available
  let stockTrend = 0;
  if (previousStock !== undefined) {
    stockTrend = (currentStock - previousStock) / previousStock;
  }

  // Enhanced decision logic: consider both absolute stock and trend
  if (currentStock < 0.85 * initialStock || stockTrend < -0.08) {
    // Low stock OR strong negative trend - be conservative
    if (leader === 0) {
      // Efficient player (Moana) might take more risk
      strategy = "moderate";
    } else {
      strategy = "conservative";
    }
  } else if (currentStock > 0.98 * initialStock && stockTrend > -0.02) {
    // Very high stock AND no negative trend - can be more aggressive
    strategy = "aggressive";
  } else {
    strategy = "moderate";
  }

  const conservationFactor = conservationStrategies[strategy];
  const adjustedSustainableBoats = sustainableBoats * conservationFactor;

  return {
    adjustedSustainableBoats,
    strategy,
    conservationFactor,
  };
};

/**
 * Simulates the leader's choice of distribution method for quotas
 */
export const leaderDistribution = (
  leader: number,
  nplayers: number,
  cooperationBonus: number,
  efficiencyBonus: number = 0.1,
  baseQuota: number = 0.25,
): { quotaWeights: number[]; method: string } => {
  // Simulate leader's choice based on their own efficiency
  let method: string;
  if (leader <= 1) {
    // Efficient leaders prefer efficiency-based
    method = "efficiency";
  } else if (leader >= 2) {
    // Less efficient leaders prefer more equality
    method = "hybrid";
  } else {
    method = "equal";
  }

  // Calculate quotas based on leader's chosen method
  const quotaWeights: number[] = [];

  if (method === "equal") {
    // Equal quotas for all
    for (let jj = 0; jj < nplayers; jj++) {
      quotaWeights.push(1 / nplayers);
    }
  } else if (method === "efficiency") {
    // Pure efficiency-based quotas
    let totalQuotaWeight = 0;
    for (let jj = 0; jj < nplayers; jj++) {
      const efficiencyLevel = nplayers - jj - 1; // Island 0 is most efficient
      const quotaWeight = baseQuota + efficiencyLevel * efficiencyBonus * 1.5; // More extreme
      quotaWeights.push(quotaWeight);
      totalQuotaWeight += quotaWeight;
    }
    // Normalize
    for (let i = 0; i < quotaWeights.length; i++) {
      quotaWeights[i] = quotaWeights[i] / totalQuotaWeight;
    }
  } else {
    // hybrid - Mix of efficiency and equality
    let totalQuotaWeight = 0;
    for (let jj = 0; jj < nplayers; jj++) {
      const efficiencyLevel = nplayers - jj - 1;
      let quotaWeight = baseQuota + efficiencyLevel * efficiencyBonus * 0.7; // Less extreme
      if (jj === leader) {
        quotaWeight += cooperationBonus;
      }
      quotaWeights.push(quotaWeight);
      totalQuotaWeight += quotaWeight;
    }
    // Normalize
    for (let i = 0; i < quotaWeights.length; i++) {
      quotaWeights[i] = quotaWeights[i] / totalQuotaWeight;
    }
  }

  return { quotaWeights, method };
};

/**
 * Simulates the leader's choice of redistribution policy based on their position.
 */
export const leaderRedistribution = (leader: number): { redistributionRate: number; policy: string } => {
  // LEADER DECISION 3: Choose redistribution policy
  const redistributionPolicies = {
    progressive: 0.2, // Higher redistribution
    moderate: 0.15, // Standard redistribution
    conservative: 0.1, // Lower redistribution
  };

  // Leader's redistribution choice depends on their position
  let redistributionPolicy: keyof typeof redistributionPolicies;

  if (leader >= 2) {
    // Less efficient leaders prefer more redistribution
    redistributionPolicy = "progressive";
  } else if (leader === 0) {
    // Most efficient leader prefers less
    redistributionPolicy = "conservative";
  } else {
    redistributionPolicy = "moderate";
  }

  const currentRedistributionRate = redistributionPolicies[redistributionPolicy];

  return { redistributionRate: currentRedistributionRate, policy: redistributionPolicy };
};
