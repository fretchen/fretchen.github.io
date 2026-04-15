import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import { css } from "../../styled-system/css";
import { useGrowthApi } from "../../hooks/useGrowthApi";
import type { ContentQueue, Draft, Insights } from "../../types/growth";
import { CHANNEL_CHAR_LIMITS } from "../../types/growth";
import { OWNER_ADDRESS } from "../../utils/getChain";

type Tab = "drafts" | "approved" | "published" | "rejected";

// ===== Styles =====

const pageContainer = css({
  maxWidth: "900px",
  mx: "auto",
  px: "md",
  py: "lg",
});

const pageTitle = css({
  fontSize: "2xl",
  fontWeight: "bold",
  mb: "lg",
  color: "text",
});

const infoBox = css({
  padding: "lg",
  textAlign: "center",
  color: "gray.600",
  fontSize: "md",
});

const tabBar = css({
  display: "flex",
  gap: "xs",
  mb: "lg",
  flexWrap: "wrap",
});

const tabButton = css({
  padding: "sm md",
  border: "1px solid",
  borderColor: "gray.300",
  borderRadius: "sm",
  backgroundColor: "transparent",
  cursor: "pointer",
  fontSize: "sm",
  fontWeight: "medium",
  transition: "all 0.2s",
  color: "gray.700",
  _hover: { backgroundColor: "gray.100" },
});

const tabButtonActive = css({
  padding: "sm md",
  border: "1px solid",
  borderColor: "gray.600",
  borderRadius: "sm",
  backgroundColor: "gray.200",
  cursor: "pointer",
  fontSize: "sm",
  fontWeight: "medium",
  color: "gray.900",
});

const draftCard = css({
  border: "1px solid",
  borderColor: "gray.200",
  borderRadius: "md",
  padding: "md",
  mb: "md",
  backgroundColor: "white",
});

const cardHeader = css({
  display: "flex",
  gap: "xs",
  alignItems: "center",
  mb: "sm",
  flexWrap: "wrap",
});

const badge = css({
  padding: "2px 8px",
  borderRadius: "sm",
  fontSize: "xs",
  fontWeight: "medium",
});

const channelBadge = css({
  backgroundColor: "blue.100",
  color: "blue.800",
});

const langBadge = css({
  backgroundColor: "gray.100",
  color: "gray.700",
});

const scheduledBadge = css({
  backgroundColor: "green.100",
  color: "green.800",
});

const contentPreview = css({
  whiteSpace: "pre-wrap",
  fontSize: "sm",
  lineHeight: "1.6",
  mb: "sm",
  color: "gray.800",
});

const hashtagLine = css({
  fontSize: "xs",
  color: "gray.500",
  mb: "sm",
});

const sourceLink = css({
  fontSize: "xs",
  color: "blue.600",
  textDecoration: "underline",
  mb: "sm",
  display: "block",
});

const cardActions = css({
  display: "flex",
  gap: "xs",
  flexWrap: "wrap",
  alignItems: "center",
});

const actionButton = css({
  padding: "xs md",
  border: "none",
  borderRadius: "sm",
  cursor: "pointer",
  fontSize: "sm",
  fontWeight: "medium",
  transition: "all 0.2s",
  _disabled: { opacity: 0.6, cursor: "not-allowed" },
});

const approveButton = css({
  backgroundColor: "green.600",
  color: "white",
  _hover: { backgroundColor: "green.700" },
});

const rejectButton = css({
  backgroundColor: "red.600",
  color: "white",
  _hover: { backgroundColor: "red.700" },
});

const editButton = css({
  backgroundColor: "gray.200",
  color: "gray.800",
  _hover: { backgroundColor: "gray.300" },
});

const saveButton = css({
  backgroundColor: "blue.600",
  color: "white",
  _hover: { backgroundColor: "blue.700" },
});

const cancelButton = css({
  backgroundColor: "transparent",
  color: "gray.600",
  border: "1px solid",
  borderColor: "gray.300",
  _hover: { backgroundColor: "gray.100" },
});

const editTextarea = css({
  width: "100%",
  padding: "sm md",
  border: "1px solid",
  borderColor: "gray.300",
  borderRadius: "md",
  fontSize: "sm",
  minHeight: "100px",
  resize: "vertical",
  fontFamily: "inherit",
  mb: "sm",
  _focus: { borderColor: "blue.500", outline: "none" },
});

const editInput = css({
  width: "100%",
  padding: "sm md",
  border: "1px solid",
  borderColor: "gray.300",
  borderRadius: "md",
  fontSize: "sm",
  fontFamily: "inherit",
  mb: "sm",
  _focus: { borderColor: "blue.500", outline: "none" },
});

const scheduleInput = css({
  padding: "xs md",
  border: "1px solid",
  borderColor: "gray.300",
  borderRadius: "sm",
  fontSize: "sm",
});

const charCounter = css({
  fontSize: "xs",
  textAlign: "right",
  mb: "sm",
  color: "gray.500",
});

const charCounterWarn = css({
  fontSize: "xs",
  textAlign: "right",
  mb: "sm",
  color: "orange.600",
});

const charCounterOver = css({
  fontSize: "xs",
  textAlign: "right",
  mb: "sm",
  color: "red.600",
  fontWeight: "bold",
});

const overLimitWarning = css({
  fontSize: "xs",
  color: "red.600",
  mb: "sm",
});

const errorBanner = css({
  padding: "sm md",
  backgroundColor: "red.50",
  color: "red.700",
  borderRadius: "sm",
  mb: "md",
  fontSize: "sm",
});

const loadingText = css({
  padding: "lg",
  textAlign: "center",
  color: "gray.500",
});

const insightsPanel = css({
  mt: "xl",
  borderTop: "1px solid",
  borderColor: "gray.200",
  pt: "md",
});

const insightsList = css({
  listStyle: "disc",
  paddingLeft: "lg",
  fontSize: "sm",
  color: "gray.700",
  lineHeight: "1.6",
});

const connectButton = css({
  padding: "sm lg",
  backgroundColor: "blue.600",
  color: "white",
  border: "none",
  borderRadius: "sm",
  cursor: "pointer",
  fontWeight: "medium",
  fontSize: "sm",
  _hover: { backgroundColor: "blue.700" },
});

// ===== Sub-components =====

function DraftCardView({
  draft,
  showActions,
  onApprove,
  onReject,
  onUpdate,
  busy,
}: {
  draft: Draft;
  showActions: boolean;
  onApprove: (id: string, scheduledAt?: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onUpdate: (id: string, body: Partial<Draft>) => Promise<void>;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(draft.content);
  const [editHashtags, setEditHashtags] = useState(draft.hashtags.join(", "));
  const [scheduleDate, setScheduleDate] = useState(() => {
    if (!draft.scheduled_at) return "";
    // Format as local datetime string for <input type="datetime-local">
    const d = new Date(draft.scheduled_at);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [showSchedule, setShowSchedule] = useState(!!draft.scheduled_at);

  const limit = CHANNEL_CHAR_LIMITS[draft.channel] ?? 500;

  const handleSave = async () => {
    await onUpdate(draft.id, {
      content: editContent,
      hashtags: editHashtags
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean),
    });
    setEditing(false);
  };

  const handleApprove = async () => {
    if (showSchedule && scheduleDate) {
      await onApprove(draft.id, new Date(scheduleDate).toISOString());
    } else if (showSchedule) {
      // Schedule shown but no date — approve without schedule
      await onApprove(draft.id);
    } else {
      setShowSchedule(true);
      return; // show schedule input first
    }
    setShowSchedule(false);
    setScheduleDate("");
  };

  return (
    <div className={draftCard}>
      <div className={cardHeader}>
        <span className={`${badge} ${channelBadge}`}>{draft.channel}</span>
        <span className={`${badge} ${langBadge}`}>{draft.language.toUpperCase()}</span>
        {draft.scheduled_at && (
          <span className={`${badge} ${scheduledBadge}`}>
            Scheduled: {new Date(draft.scheduled_at).toLocaleString()}
          </span>
        )}
      </div>

      {editing ? (
        <>
          <textarea className={editTextarea} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
          <div
            className={
              editContent.length > limit
                ? charCounterOver
                : limit - editContent.length < 20
                  ? charCounterWarn
                  : charCounter
            }
          >
            {editContent.length}/{limit}
          </div>
          <input
            className={editInput}
            value={editHashtags}
            onChange={(e) => setEditHashtags(e.target.value)}
            placeholder="Hashtags (comma-separated)"
          />
          <div className={cardActions}>
            <button
              className={`${actionButton} ${saveButton}`}
              onClick={handleSave}
              disabled={busy || editContent.length > limit}
            >
              Save
            </button>
            <button className={`${actionButton} ${cancelButton}`} onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={contentPreview}>{draft.content}</p>
          {showActions && (
            <div className={draft.content.length > limit ? charCounterOver : charCounter}>
              {draft.content.length}/{limit} characters
            </div>
          )}
          {draft.content.length > limit && showActions && (
            <div className={overLimitWarning}>
              ⚠️ Content exceeds {draft.channel} limit ({draft.content.length}/{limit})
            </div>
          )}
          {draft.hashtags.length > 0 && <p className={hashtagLine}>{draft.hashtags.join(" ")}</p>}
          {draft.link && (
            <a className={sourceLink} href={draft.link} target="_blank" rel="noopener noreferrer">
              {draft.source_blog_post || draft.link}
            </a>
          )}
          {showActions && (
            <div className={cardActions}>
              <button className={`${actionButton} ${editButton}`} onClick={() => setEditing(true)} disabled={busy}>
                Edit
              </button>
              {draft.status !== "approved" && draft.status !== "published" && (
                <>
                  <button
                    className={`${actionButton} ${approveButton}`}
                    onClick={handleApprove}
                    disabled={busy || draft.content.length > limit}
                  >
                    {showSchedule ? "Confirm Approve" : "Approve"}
                  </button>
                  {showSchedule && (
                    <input
                      className={scheduleInput}
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                    />
                  )}
                  {showSchedule && (
                    <button
                      className={`${actionButton} ${cancelButton}`}
                      onClick={() => {
                        setShowSchedule(false);
                        setScheduleDate("");
                      }}
                    >
                      Skip Schedule
                    </button>
                  )}
                </>
              )}
              {draft.status !== "rejected" && draft.status !== "published" && (
                <button
                  className={`${actionButton} ${rejectButton}`}
                  onClick={() => onReject(draft.id)}
                  disabled={busy}
                >
                  Reject
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function InsightsSection({ insights }: { insights: Insights | null }) {
  if (!insights) return null;
  return (
    <div className={insightsPanel}>
      <details>
        <summary style={{ cursor: "pointer", fontWeight: "bold", marginBottom: "8px" }}>Insights & Analytics</summary>
        {(insights.growth_opportunities ?? []).length > 0 && (
          <>
            <h4 style={{ fontWeight: 600, marginBottom: "4px" }}>Growth Opportunities</h4>
            <ul className={insightsList}>
              {insights.growth_opportunities.map((opp, i) => (
                <li key={i}>{opp}</li>
              ))}
            </ul>
          </>
        )}
        {Object.entries(insights.social_metrics ?? {}).map(([platform, metrics]) => (
          <p key={platform} style={{ fontSize: "14px", color: "#555", marginTop: "4px" }}>
            <strong>{platform}:</strong> {metrics.followers} followers, {(metrics.engagement_rate * 100).toFixed(1)}%
            engagement
          </p>
        ))}
        {insights.last_analysis && (
          <p style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
            Last analysis: {new Date(insights.last_analysis).toLocaleString()}
          </p>
        )}
      </details>
    </div>
  );
}

// ===== Main Page =====

export default function Page() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { address, status } = useAccount();
  const { connectors, connect } = useConnect();
  const { fetchDrafts, fetchInsights, updateDraft, approveDraft: apiApprove, rejectDraft: apiReject } = useGrowthApi();

  const [queue, setQueue] = useState<ContentQueue | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [tab, setTab] = useState<Tab>("drafts");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Use status === "connected" (not just isConnected) to ensure wagmi's
  // reconnect is fully complete before we call signMessageAsync.
  const isOwner = hasMounted && status === "connected" && address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [q, ins] = await Promise.all([fetchDrafts(), fetchInsights()]);
      setQueue(q);
      setInsights(ins);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchDrafts, fetchInsights]);

  useEffect(() => {
    if (isOwner) {
      loadData();
    }
  }, [isOwner, loadData]);

  const handleApprove = async (id: string, scheduledAt?: string) => {
    setBusy(true);
    setError(null);
    try {
      await apiApprove(id, scheduledAt);
      // Optimistic update
      setQueue((prev) => {
        if (!prev) return prev;
        const draft = prev.drafts.find((d) => d.id === id);
        if (!draft) return prev;
        const updated = { ...draft, status: "approved", scheduled_at: scheduledAt ?? draft.scheduled_at };
        return {
          ...prev,
          drafts: prev.drafts.filter((d) => d.id !== id),
          approved: [...prev.approved, updated],
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await apiReject(id);
      // Optimistic update
      setQueue((prev) => {
        if (!prev) return prev;
        const draft = prev.drafts.find((d) => d.id === id) || prev.approved.find((d) => d.id === id);
        if (!draft) return prev;
        const updated = { ...draft, status: "rejected" };
        return {
          ...prev,
          drafts: prev.drafts.filter((d) => d.id !== id),
          approved: prev.approved.filter((d) => d.id !== id),
          rejected: [...prev.rejected, updated],
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (id: string, body: Partial<Draft>) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await updateDraft(id, body);
      // Update in-place
      setQueue((prev) => {
        if (!prev) return prev;
        const updateIn = (list: Draft[]) => list.map((d) => (d.id === id ? { ...d, ...updated } : d));
        return {
          ...prev,
          drafts: updateIn(prev.drafts),
          approved: updateIn(prev.approved),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setBusy(false);
    }
  };

  // Pre-hydration: show nothing interactive
  if (!hasMounted) {
    return (
      <div className={pageContainer}>
        <h1 className={pageTitle}>Growth Agent</h1>
        <p className={infoBox}>Loading...</p>
      </div>
    );
  }

  // Not connected or still reconnecting
  if (status !== "connected") {
    return (
      <div className={pageContainer}>
        <h1 className={pageTitle}>Growth Agent</h1>
        <div className={infoBox}>
          <p>Connect your wallet to manage drafts.</p>
          {connectors.length > 0 && (
            <button
              className={connectButton}
              onClick={() => connect({ connector: connectors[0] })}
              style={{ marginTop: "12px" }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    );
  }

  // Wrong address
  if (!isOwner) {
    return (
      <div className={pageContainer}>
        <h1 className={pageTitle}>Growth Agent</h1>
        <p className={infoBox}>This page is restricted to the site owner.</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "drafts", label: "Pending", count: queue?.drafts.length ?? 0 },
    { key: "approved", label: "Approved", count: queue?.approved.length ?? 0 },
    { key: "published", label: "Published", count: queue?.published.length ?? 0 },
    { key: "rejected", label: "Rejected", count: queue?.rejected.length ?? 0 },
  ];

  const currentDrafts = queue ? queue[tab] : [];
  const showActions = tab === "drafts" || tab === "approved";

  return (
    <div className={pageContainer}>
      <h1 className={pageTitle}>Growth Agent</h1>

      {error && <div className={errorBanner}>{error}</div>}

      {loading ? (
        <p className={loadingText}>Loading drafts...</p>
      ) : (
        <>
          <div className={tabBar}>
            {tabs.map((t) => (
              <button key={t.key} className={tab === t.key ? tabButtonActive : tabButton} onClick={() => setTab(t.key)}>
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          {currentDrafts.length === 0 ? (
            <p className={infoBox}>No {tab} drafts.</p>
          ) : (
            currentDrafts.map((draft) => (
              <DraftCardView
                key={draft.id}
                draft={draft}
                showActions={showActions}
                onApprove={handleApprove}
                onReject={handleReject}
                onUpdate={handleUpdate}
                busy={busy}
              />
            ))
          )}

          <InsightsSection insights={insights} />
        </>
      )}
    </div>
  );
}
