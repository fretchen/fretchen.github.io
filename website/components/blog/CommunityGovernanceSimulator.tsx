import React, { useState, useEffect } from "react";
import { css } from "../../styled-system/css";
import {
  otherChiefs,
  MODEL_PARAMS,
  COMMUNITY_PARAMS,
  calculateEfficientBoats,
  calculateSustainableBoats,
  calculateTotalCatch,
  calculateRegeneration,
  leaderConservationLevel,
  leaderDistribution,
  leaderRedistribution,
  type CommunityScenarioType,
  type CommunityRoundHistory,
} from "./fishingCommonsModel";

const CommunityScenarioSelector: React.FC<{
  scenario: CommunityScenarioType;
  setScenario: (scenario: CommunityScenarioType) => void;
}> = ({ scenario, setScenario }) => {
  const scenarios = {
    democratic: {
      name: "🤝 Democratic Fishing Council",
      description: "Rotating leadership, graduated quotas, wealth redistribution based on Ostrom's principles",
    },
    hierarchical: {
      name: "👑 Moana-Led Governance",
      description: "Fixed leadership by Moana, efficiency focus, minimal redistribution",
    },
  };

  return (
    <div
      className={css({
        marginBottom: "5",
        textAlign: "center",
        border: "1px solid #e5e7eb",
        borderRadius: "lg",
        padding: "4",
        background: "zinc.50",
      })}
    >
      <div className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "2" })}>
        🏛️ Community Governance System
      </div>
      <div className={css({ display: "flex", gap: "3", justifyContent: "center", flexWrap: "wrap" })}>
        {Object.entries(scenarios).map(([key, info]) => {
          const isSelected = scenario === key;

          return (
            <button
              key={key}
              onClick={() => {
                setScenario(key as CommunityScenarioType);
              }}
              className={css({
                padding: "12px 16px",
                border: isSelected ? "2px solid" : "1px solid",
                borderColor: isSelected ? "blue.500" : "gray.300",
                borderRadius: "8px",
                backgroundColor: isSelected ? "blue.50" : "white",
                cursor: "pointer",
                textAlign: "left",
                maxWidth: "220px",
                fontSize: "sm",
                position: "relative",
              })}
            >
              <div className={css({ fontWeight: 600, marginBottom: "4px", color: "gray.900" })}>{info.name}</div>
              <div
                className={css({
                  color: "gray.500",
                  fontSize: "xs",
                  lineHeight: "1.3",
                })}
              >
                {info.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CommunityResultsTable: React.FC<{ history: CommunityRoundHistory[] }> = ({ history }) => {
  // Calculate totals
  const moanaSum = history.reduce((sum, h) => sum + (h.moanaFish ?? 0), 0);
  const chiefsSums = otherChiefs.map((_, i) =>
    history.reduce((sum, h) => sum + (h.otherFish && h.otherFish[i] !== undefined ? h.otherFish[i] : 0), 0),
  );
  const totalRedistribution = history.reduce((sum, h) => sum + h.redistributionAmount, 0);
  // Calculate cost totals (Option 1: minimal cost extension)
  const moanaCostSum = history.reduce((sum, h) => sum + (h.moanaCost ?? 0), 0);
  const chiefsCostSums = otherChiefs.map((_, i) =>
    history.reduce((sum, h) => sum + (h.otherCosts && h.otherCosts[i] !== undefined ? h.otherCosts[i] : 0), 0),
  );

  // Helper function for redistribution display with costs
  function redistributionCell(
    originalCatch: number | null,
    finalCatch: number | null,
    netTransfer: number | null,
    cost: number | null,
  ) {
    if (originalCatch === null || finalCatch === null || netTransfer === null || cost === null) {
      return <span>-</span>;
    }

    return (
      <div className={css({ textAlign: "center" })}>
        <div className={css({ fontSize: "xs" })}>
          {originalCatch.toFixed(1)}🐟 → {finalCatch.toFixed(1)}🐟
        </div>
        <div className={css({ fontSize: "xs", color: "gray.500" })}>${cost.toFixed(2)}</div>
      </div>
    );
  }

  // Helper function for leader display
  function leaderCell(leader: number, strategy: string, distributionMethod?: string, redistributionPolicy?: string) {
    const leaderNames = ["Moana", "Kai", "Tala", "Sina"];

    // Icon mappings for each decision type
    const conservationIcons = {
      conservative: "🛡️",
      moderate: "⚖️",
      aggressive: "⚔️",
    };

    const distributionIcons = {
      equal: "🟰",
      hybrid: "🔄",
      efficiency: "📈",
    };

    const redistributionIcons = {
      conservative: "🔐",
      moderate: "🔄",
      progressive: "🔓",
    };

    return (
      <div className={css({ textAlign: "center" })}>
        <div className={css({ fontWeight: 600, fontSize: "xs", marginBottom: "2px" })}>{leaderNames[leader]}</div>

        {/* Decision Icons Row */}
        <div
          className={css({
            display: "flex",
            justifyContent: "center",
            gap: "2px",
            fontSize: "xs",
            marginBottom: "2px",
          })}
        >
          <span title={`Conservation Strategy: ${strategy}`}>
            {conservationIcons[strategy as keyof typeof conservationIcons] || "❓"}
          </span>
          <span title={`Distribution Method: ${distributionMethod || "unknown"}`}>
            {distributionMethod
              ? distributionIcons[distributionMethod as keyof typeof distributionIcons] || "❓"
              : "❓"}
          </span>
          <span title={`Redistribution Policy: ${redistributionPolicy || "unknown"}`}>
            {redistributionPolicy
              ? redistributionIcons[redistributionPolicy as keyof typeof redistributionIcons] || "❓"
              : "❓"}
          </span>
        </div>

        {/* Strategy text for reference */}
      </div>
    );
  }

  return (
    <div className={css({ margin: "18px 0" })}>
      {/* Legend for Leadership Decision Icons */}
      <div
        className={css({
          marginBottom: "12px",
          padding: "8px 12px",
          backgroundColor: "slate.50",
          borderRadius: "6px",
          fontSize: "xs",
          border: "1px solid",
          borderColor: "gray.200",
        })}
      >
        <div className={css({ fontWeight: "600", marginBottom: "6px" })}>Leadership Decision Icons Guide:</div>

        {/* Conservation Strategy Icons */}
        <div className={css({ marginBottom: "4px" })}>
          <strong>Conservation Strategy:</strong>
          <span className={css({ marginLeft: "8px" })}>🛡️ conservative (protect stocks)</span>
          <span className={css({ marginLeft: "8px" })}>⚖️ moderate (balanced approach)</span>
          <span className={css({ marginLeft: "8px" })}>⚔️ aggressive (maximize current catch)</span>
        </div>

        {/* Distribution Method Icons */}
        <div className={css({ marginBottom: "4px" })}>
          <strong>Distribution Method:</strong>
          <span className={css({ marginLeft: "8px" })}>🟰 equal (same quotas for all)</span>
          <span className={css({ marginLeft: "8px" })}>🔄 hybrid (balanced allocation)</span>
          <span className={css({ marginLeft: "8px" })}>📈 efficiency (quota based on capability)</span>
        </div>

        {/* Redistribution Policy Icons */}
        <div>
          <strong>Redistribution Policy:</strong>
          <span className={css({ marginLeft: "8px" })}>🔐 conservative (minimal sharing)</span>
          <span className={css({ marginLeft: "8px" })}>🔄 moderate (balanced redistribution)</span>
          <span className={css({ marginLeft: "8px" })}>🔓 progressive (significant wealth sharing)</span>
        </div>
      </div>

      <div className={css({ display: "flex", justifyContent: "center" })}>
        <table className={css({ borderCollapse: "collapse", fontSize: "sm", minWidth: "600px" })}>
          <thead>
            <tr className={css({ background: "sky.200" })}>
              <th className={css({ padding: "6px 8px" })}>Round</th>
              <th className={css({ padding: "6px 8px" })}>Leader</th>
              <th className={css({ padding: "6px 8px" })}>
                Moana
                <br />
                Original → Final • Cost
              </th>
              {otherChiefs.map((chief) => (
                <th key={chief} className={css({ padding: "6px 8px", fontSize: "xs" })}>
                  {chief.replace("Chief ", "")}
                  <br />
                  Original → Final • Cost
                </th>
              ))}
              <th className={css({ padding: "6px 8px" })}>Stock After</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, idx) => (
              <tr key={idx} className={css({ background: idx % 2 === 0 ? "slate.50" : "white" })}>
                <td
                  className={css({
                    padding: "4px 8px",
                    textAlign: "center",
                    fontWeight: 400,
                  })}
                >
                  {h.round}
                </td>
                {/* Leader */}
                <td className={css({ padding: "4px 8px" })}>
                  {leaderCell(h.leader, h.leaderStrategy, h.leaderDistributionMethod, h.leaderRedistributionPolicy)}
                </td>
                {/* Moana */}
                <td className={css({ padding: "4px 8px" })}>
                  {redistributionCell(h.moanaOriginalCatch, h.moanaFish, h.moanaNetTransfer, h.moanaCost)}
                </td>
                {/* Other Chiefs */}
                {otherChiefs.map((_, i) => (
                  <td key={i} className={css({ padding: "4px 8px" })}>
                    {h.otherFish && h.otherOriginalCatch && h.otherFish[i] !== undefined && h.otherCosts
                      ? redistributionCell(
                          h.otherOriginalCatch[i],
                          h.otherFish[i],
                          h.otherFish[i] - h.otherOriginalCatch[i],
                          h.otherCosts[i],
                        )
                      : "-"}
                  </td>
                ))}
                {/* Fish Stock */}
                <td className={css({ padding: "4px 8px", textAlign: "center", fontWeight: 500 })}>
                  {h.fishAfter !== null ? `${Math.round(h.fishAfter)}🐟` : "-"}
                </td>
              </tr>
            ))}
            {/* Summary Row */}
            <tr className={css({ background: "slate.200", fontWeight: 600, borderTop: "2px solid", borderTopColor: "sky.200" })}>
              <td className={css({ padding: "4px 8px", textAlign: "center" })} colSpan={2}>
                Total
              </td>
              <td className={css({ padding: "4px 8px", textAlign: "center" })}>
                {Math.round(moanaSum)}🐟
                <br />
                <span className={css({ fontSize: "xs", color: "gray.500" })}>${moanaCostSum.toFixed(2)}</span>
              </td>
              {chiefsSums.map((sum, i) => (
                <td key={i} className={css({ padding: "4px 8px", textAlign: "center" })}>
                  {Math.round(sum)}🐟
                  <br />
                  <span className={css({ fontSize: "xs", color: "gray.500" })}>${chiefsCostSums[i].toFixed(2)}</span>
                </td>
              ))}
              <td className={css({ padding: "4px 8px", textAlign: "center", fontSize: "xs" })}>
                Redistributed: {totalRedistribution.toFixed(1)}🐟
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CommunityEndSummary: React.FC<{
  scenario: CommunityScenarioType;
  fishStock: number;
  history: CommunityRoundHistory[];
}> = ({ scenario, fishStock, history }) => {
  const totalRedistribution = history.reduce((sum, h) => sum + h.redistributionAmount, 0);
  const allPrinciples = [...new Set(history.flatMap((h) => h.activeOstromPrinciples))];

  // Calculate economic metrics
  const totalFishCaught = history.reduce((sum, h) => sum + (h.totalCatch ?? 0), 0);
  const moanaCostSum = history.reduce((sum, h) => sum + (h.moanaCost ?? 0), 0);
  const chiefsCostSums = otherChiefs.map((_, i) =>
    history.reduce((sum, h) => sum + (h.otherCosts && h.otherCosts[i] !== undefined ? h.otherCosts[i] : 0), 0),
  );
  const totalCost = moanaCostSum + chiefsCostSums.reduce((sum, cost) => sum + cost, 0);
  const avgCostPerFish = totalFishCaught > 0 ? totalCost / totalFishCaught : 0;

  return (
    <div className={css({ textAlign: "center", margin: "18px 0" })}>
      <div
        className={css({
          background: "sky.50",
          border: "1px solid",
          borderColor: "indigo.200",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "16px",
        })}
      >
        <div className={css({ fontSize: "sm", marginBottom: "8px" })}>
          🏛️ <strong>{scenario === "democratic" ? "Democratic Council" : "Moana-Led Governance"}</strong> Results
        </div>
        <div className={css({ fontSize: "sm", marginBottom: "8px" })}>
          🐟 <strong>{Math.round(totalFishCaught)}</strong> fish caught {"·"} 💰{" "}
          <strong>${avgCostPerFish.toFixed(2)}</strong> average cost per fish
        </div>
        {scenario === "democratic" && (
          <div className={css({ fontSize: "xs", marginBottom: "8px", color: "success", fontStyle: "italic" })}>
            ✨ Community Benefit: Lower costs through coordinated fishing
          </div>
        )}
        <div className={css({ fontSize: "sm", marginBottom: "8px" })}>
          ↔️ Fish Redistributed: <strong>{totalRedistribution.toFixed(1)}🐟</strong>
        </div>
        <div className={css({ fontSize: "sm", marginBottom: "8px" })}>
          🌊 <strong>{Math.round(fishStock)}</strong> fish remaining in ocean
        </div>
      </div>

      {/* Ostrom Principles Active */}
      <div
        className={css({
          background: "green.50",
          border: "1px solid",
          borderColor: "green.200",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "16px",
          fontSize: "xs",
        })}
      >
        <div className={css({ fontWeight: 600, marginBottom: "8px" })}>🎯 Active Ostrom Principles:</div>
        <div className={css({ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" })}>
          {allPrinciples.map((principle, i) => (
            <span
              key={i}
              className={css({
                background: "green.100",
                color: "green.800",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "xs",
              })}
            >
              {principle}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function CommunityGovernanceSimulator() {
  const [scenario, setScenario] = useState<CommunityScenarioType>("democratic");
  const [history, setHistory] = useState<CommunityRoundHistory[]>([]);
  const fishStock =
    history.length > 0
      ? Math.max(0, history[history.length - 1].fishAfter ?? MODEL_PARAMS.s_init)
      : MODEL_PARAMS.s_init;

  const getActiveOstromPrinciples = (leader: number, scenario: CommunityScenarioType): string[] => {
    const principles = [];

    if (scenario === "democratic") {
      // Democratic governance implements most of Ostrom's principles
      principles.push("1. Clearly defined boundaries");
      principles.push("2. Collective choice arrangements");
      principles.push("3. Community monitoring");
      principles.push("4. Graduated sanctions");
      principles.push("5. Conflict resolution mechanisms");
      principles.push("7. Nested enterprises");
      if (leader !== 0) principles.push("6. Recognition of rights to organize"); // When others lead, shows external respect
      // Principle 8 (Local congruence) is inherently present as rules adapt to local conditions
    } else {
      // Hierarchical governance implements fewer principles
      principles.push("1. Clearly defined boundaries");
      principles.push("8. Congruence with local conditions");
      if (leader === 0) principles.push("3. Monitoring by authorities"); // Moana-led monitoring
    }

    return principles;
  };

  // Auto-simulate all rounds when scenario changes
  useEffect(() => {
    const applyRedistribution = (originalCatches: number[], leader: number, currentStock: number) => {
      const redistributionResult = leaderRedistribution(leader);
      const redistributionRate = redistributionResult.redistributionRate;

      // Calculate sustainable catch per player (like in Python)
      const sustainableCatchPerPlayer =
        calculateTotalCatch(currentStock, calculateSustainableBoats(currentStock)) / MODEL_PARAMS.nplayers;

      // Initialize arrays
      const redistributionTax: number[] = new Array<number>(MODEL_PARAMS.nplayers).fill(0);
      const underfished: number[] = new Array<number>(MODEL_PARAMS.nplayers).fill(0);
      const finalCatches = [...originalCatches];

      // Step 1: Calculate redistribution tax for players above sustainable catch
      for (let jj = 0; jj < MODEL_PARAMS.nplayers; jj++) {
        if (originalCatches[jj] > sustainableCatchPerPlayer) {
          // Calculate tax for excess catch
          const excessCatch = originalCatches[jj] - sustainableCatchPerPlayer;
          redistributionTax[jj] = excessCatch * redistributionRate;
          finalCatches[jj] -= redistributionTax[jj];
        } else {
          redistributionTax[jj] = 0.0;
        }
      }

      // Step 2: Calculate underfished amounts for players below sustainable catch
      for (let jj = 0; jj < MODEL_PARAMS.nplayers; jj++) {
        if (finalCatches[jj] < sustainableCatchPerPlayer) {
          underfished[jj] = sustainableCatchPerPlayer - finalCatches[jj];
        } else {
          underfished[jj] = 0;
        }
      }

      // Step 3: Redistribute the collected tax to underfished players
      const totalRedistributionAmount = redistributionTax.reduce((sum, tax) => sum + tax, 0);
      const totalUnderfished = underfished.reduce((sum, amount) => sum + amount, 0);

      const redistributionReceived: number[] = new Array<number>(MODEL_PARAMS.nplayers).fill(0);

      if (totalUnderfished > 0) {
        for (let jj = 0; jj < MODEL_PARAMS.nplayers; jj++) {
          if (underfished[jj] > 0) {
            // Calculate redistribution share based on underfished amount
            const share = underfished[jj] / totalUnderfished;
            const redistributionShare = totalRedistributionAmount * share;
            finalCatches[jj] += redistributionShare;
            redistributionReceived[jj] = redistributionShare;
          }
        }
      }

      return {
        finalCatches,
        redistributionAmount: totalRedistributionAmount,
        netTransfers: redistributionReceived.map((received, i) => received - redistributionTax[i]),
      };
    };
    const nRounds = 5; // Increased from 3 to 5 for better strategy progression
    let currentStock = MODEL_PARAMS.s_init;
    const newHistory: CommunityRoundHistory[] = [];
    let previousStock: number | undefined;

    for (let round = 1; round <= nRounds; round++) {
      // Leadership rotation: democratic rotates, hierarchical stays with Moana
      const leader = scenario === "democratic" ? (round - 1) % MODEL_PARAMS.nplayers : 0;

      // Calculate sustainable boats first
      const totalSustainableBoats = calculateSustainableBoats(currentStock) * MODEL_PARAMS.nplayers;

      // Use the leader conservation level function to determine strategy (with trend awareness)
      const conservationDecision = leaderConservationLevel(
        leader,
        totalSustainableBoats,
        currentStock,
        MODEL_PARAMS.s_init,
        previousStock,
      );
      const adjustedSustainableBoats = conservationDecision.adjustedSustainableBoats;
      const leaderStrategy = conservationDecision.strategy;

      // Declare allChiefBoats/distributionResult outside the if-statement so they're
      // accessible later (distributionResult.method is also needed further below).
      let allChiefBoats: number[];
      let distributionResult: ReturnType<typeof leaderDistribution> | undefined;

      // in the case of the hierarchical scenario use the standard sustainable boats
      if (scenario === "hierarchical") {
        allChiefBoats = [0, 1, 2, 3].map(() => calculateSustainableBoats(currentStock));
      } else {
        // LEADER DECISION 2: Choose quota distribution method
        distributionResult = leaderDistribution(
          leader,
          MODEL_PARAMS.nplayers,
          COMMUNITY_PARAMS.cooperation_bonus,
          COMMUNITY_PARAMS.efficiency_bonus,
          COMMUNITY_PARAMS.base_quota,
        );

        allChiefBoats = distributionResult.quotaWeights.map((weight, jj) => {
          // Calculate economically viable boats for this chief
          const econBoats = calculateEfficientBoats(currentStock, MODEL_PARAMS.c_islands[jj]);

          if (econBoats > adjustedSustainableBoats * weight) {
            // If the economic boats exceed the adjusted sustainable level, use the quota weights
            return adjustedSustainableBoats * weight;
          } else {
            // Otherwise, use the economic boats (more restrictive)
            return econBoats;
          }
        });
      }

      const moanaBoats = allChiefBoats[0];
      const otherBoats = allChiefBoats.slice(1);
      const totalBoats = allChiefBoats.reduce((a, b) => a + b, 0);

      // Calculate regeneration and catch
      const regeneration = calculateRegeneration(currentStock);
      const totalCatch = calculateTotalCatch(currentStock, totalBoats);

      // Calculate original catches (proportional to boats)
      const originalCatches = allChiefBoats.map((boats) => (boats / totalBoats) * totalCatch);
      const moanaOriginalCatch = originalCatches[0];
      const otherOriginalCatch = originalCatches.slice(1);

      // Declare variables outside the if-else blocks so they're accessible later
      let moanaFish: number;
      let otherFish: number[];
      let moanaNetTransfer: number;
      let redistributionAmount: number;
      let leaderDistributionMethod: string = "equal"; // Default for hierarchical
      let leaderRedistributionPolicy: string = "conservative"; // Default for hierarchical

      // Calculate the latest choice of the chief if we are in the democratic scenario
      if (scenario === "democratic") {
        // Reuse the distributionResult already calculated above instead of recomputing it.
        leaderDistributionMethod = distributionResult!.method;

        // Apply community redistribution
        const redistribution = applyRedistribution(originalCatches, leader, currentStock);
        const redistributionResult = leaderRedistribution(leader);
        leaderRedistributionPolicy = redistributionResult.policy;

        moanaFish = redistribution.finalCatches[0];
        otherFish = redistribution.finalCatches.slice(1);
        moanaNetTransfer = redistribution.netTransfers[0];
        redistributionAmount = redistribution.redistributionAmount;
      } else {
        // Hierarchical scenario: no redistribution
        moanaFish = moanaOriginalCatch;
        otherFish = otherOriginalCatch;
        moanaNetTransfer = 0;
        redistributionAmount = 0;
      }

      // Get active Ostrom principles
      const activeOstromPrinciples = getActiveOstromPrinciples(leader, scenario);

      // Calculate costs for each chief (Option 1: minimal cost extension)
      const allChiefCosts = allChiefBoats.map((boats, index) => boats * MODEL_PARAMS.c_islands[index]);
      const moanaCost = allChiefCosts[0];
      const otherCosts = allChiefCosts.slice(1);

      // Update stock
      const nextStock = currentStock - totalCatch + regeneration;

      // Store round result
      newHistory.push({
        round,
        moanaBoats,
        moanaFish,
        otherBoats,
        otherFish,
        totalBoats,
        totalCatch,
        fishAfter: nextStock,
        regeneration,
        leader,
        leaderStrategy,
        leaderDistributionMethod,
        leaderRedistributionPolicy,
        redistributionAmount,
        moanaNetTransfer,
        activeOstromPrinciples,
        moanaOriginalCatch,
        otherOriginalCatch,
        moanaCost,
        otherCosts,
      });

      // Update for next round
      currentStock = Math.max(0, nextStock);
      previousStock = currentStock; // Store for trend calculation in next round
    }

    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setHistory(newHistory);
    }, 0);
  }, [scenario]);

  return (
    <div
      className={css({
        border: "1px solid #bae6fd",
        borderRadius: "lg",
        padding: "4.5",
        margin: "18px 0",
        background: "slate.50",
      })}
    >
      <CommunityScenarioSelector scenario={scenario} setScenario={setScenario} />
      <CommunityResultsTable history={history} />
      <CommunityEndSummary scenario={scenario} fishStock={fishStock} history={history} />
    </div>
  );
}
