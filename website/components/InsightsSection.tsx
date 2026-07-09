import React from "react";
import { css } from "../styled-system/css";
import { type Insights } from "../types/growth";

const insightsPanel = css({
  mt: "sm",
  mb: "md",
});

const insightsList = css({
  listStyle: "disc",
  paddingLeft: "lg",
  fontSize: "sm",
  color: "gray.700",
  lineHeight: "1.6",
});

const sectionHeading: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: "4px",
  marginTop: "12px",
};

export default function InsightsSection({ insights }: { insights: Insights | null }) {
  if (!insights) return null;
  return (
    <div className={insightsPanel}>
      <details>
        <summary style={{ cursor: "pointer", fontWeight: "bold", marginBottom: "8px" }}>Insights & Analysis</summary>

        {(insights.top_topics ?? []).length > 0 && (
          <>
            <h4 style={sectionHeading}>Audience Interests</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
              {insights.top_topics!.map((topic, i) => (
                <span
                  key={i}
                  style={{
                    background: "#e8f0fe",
                    color: "#1a73e8",
                    borderRadius: "12px",
                    padding: "2px 10px",
                    fontSize: "13px",
                  }}
                >
                  {topic}
                </span>
              ))}
            </div>
          </>
        )}

        {(insights.best_pages_for_social ?? []).length > 0 && (
          <>
            <h4 style={sectionHeading}>Posts Worth Promoting</h4>
            <ul className={insightsList}>
              {insights.best_pages_for_social!.map((page, i) => (
                <li key={i}>
                  <a href={page.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500 }}>
                    {page.title}
                  </a>
                  {page.selection_type && (
                    <span style={{ marginLeft: "6px", fontSize: "11px", color: "#888" }}>[{page.selection_type}]</span>
                  )}
                  <br />
                  <span style={{ fontSize: "13px", color: "#555" }}>{page.reason}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {(insights.growth_opportunities ?? []).length > 0 && (
          <>
            <h4 style={sectionHeading}>Growth Actions</h4>
            <ul className={insightsList}>
              {insights.growth_opportunities.map((opp, i) => (
                <li key={i}>{opp}</li>
              ))}
            </ul>
          </>
        )}

        {Object.entries(insights.social_metrics ?? {}).length > 0 && (
          <>
            <h4 style={sectionHeading}>Reach</h4>
            {Object.entries(insights.social_metrics).map(([platform, metrics]) => (
              <p key={platform} style={{ fontSize: "14px", color: "#555", marginTop: "4px" }}>
                <strong>{platform}:</strong> {metrics.followers} followers
              </p>
            ))}
          </>
        )}

        {insights.last_analysis && (
          <p style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
            Last analysis: {new Date(insights.last_analysis).toLocaleString()}
          </p>
        )}
      </details>
    </div>
  );
}
