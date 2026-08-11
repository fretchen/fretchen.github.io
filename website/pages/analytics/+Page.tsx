import React, { useEffect, useMemo, useState } from "react";
import { css } from "../../styled-system/css";
import { titleBar, tabs as tabStyles } from "../../layouts/shared";
import { button } from "../../styled-system/recipes";
import { Tab } from "../../components/Tab";
import { useAnalyticsStats, prewarmAnalyticsApi } from "../../hooks/useAnalyticsStats";
import { useWalletConnection } from "../../hooks/useWalletConnection";
import { OWNER_ADDRESS } from "../../utils/getChain";
import { SITE_CONFIG } from "../../utils/siteConfig";
import type { StatsDay } from "../../types/analytics";

const RANGES = [7, 30, 90] as const;

// ===== Styles =====

const container = css({ maxWidth: "900px", mx: "auto", px: "md", pt: "md" });

const infoBox = css({ padding: "lg", textAlign: "center", color: "gray.600", fontSize: "md" });

const errorBanner = css({
  padding: "sm",
  marginBottom: "md",
  borderRadius: "sm",
  backgroundColor: "dangerSurface",
  color: "danger",
  fontSize: "sm",
});

const headline = css({ fontSize: "3xl", fontWeight: "bold", color: "text", lineHeight: "tight" });

const subline = css({ fontSize: "sm", color: "textMuted", marginBottom: "lg" });

const chart = css({
  display: "flex",
  alignItems: "flex-end",
  gap: "1px",
  height: "120px",
  marginBottom: "xs",
  borderBottom: "1px solid token(colors.border)",
});

const barSlot = css({ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" });

const bar = css({ width: "100%", minHeight: "1px", backgroundColor: "brand", borderRadius: "1px" });

// Backfilled Umami days, greyed so the seam is visible rather than implied.
const barHistoric = css({ width: "100%", minHeight: "1px", backgroundColor: "gray.400", borderRadius: "1px" });

const axis = css({
  display: "flex",
  justifyContent: "space-between",
  fontSize: "xs",
  color: "textMuted",
  marginBottom: "xl",
});

const table = css({ width: "100%", borderCollapse: "collapse", fontSize: "sm" });

const th = css({
  textAlign: "left",
  paddingY: "xs",
  borderBottom: "1px solid token(colors.border)",
  fontSize: "xs",
  textTransform: "uppercase",
  letterSpacing: "wide",
  color: "textMuted",
  fontWeight: "semibold",
});

const thRight = css({
  textAlign: "right",
  paddingY: "xs",
  borderBottom: "1px solid token(colors.border)",
  fontSize: "xs",
  textTransform: "uppercase",
  letterSpacing: "wide",
  color: "textMuted",
  fontWeight: "semibold",
});

const td = css({ paddingY: "xs", borderBottom: "1px solid token(colors.border)" });

const tdRight = css({
  paddingY: "xs",
  borderBottom: "1px solid token(colors.border)",
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  color: "textMuted",
});

const pathLink = css({ color: "brand", textDecoration: "none", _hover: { textDecoration: "underline" } });

const footnote = css({ fontSize: "xs", color: "textMuted", marginTop: "lg" });

// ===== Helpers =====

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function barClass(day: StatsDay): string {
  return day.source === "umami" ? barHistoric : bar;
}

// ===== Page =====

export default function Page() {
  const { address, hasMounted, isConnected, connectWallet } = useWalletConnection();
  const [days, setDays] = useState<number>(30);

  useEffect(() => {
    prewarmAnalyticsApi();
  }, []);

  // isConnected is reconnect-aware + hydration-safe, so the owner check never
  // trusts `address` before wagmi's reconnect completes.
  const isOwner = isConnected && address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  const { data: stats, isPending, error } = useAnalyticsStats(!!isOwner, days);

  const peak = useMemo(() => Math.max(1, ...(stats?.days ?? []).map((d) => d.hits)), [stats?.days]);
  const hasHistoric = useMemo(() => (stats?.days ?? []).some((d) => d.source === "umami"), [stats?.days]);

  if (!hasMounted) {
    return (
      <div className={container}>
        <h1 className={titleBar.title}>Analytics</h1>
        <p className={infoBox}>Loading...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={container}>
        <h1 className={titleBar.title}>Analytics</h1>
        <div className={infoBox}>
          <div className={css({ display: "flex", justifyContent: "center" })}>
            <button className={button()} onClick={() => connectWallet("analytics")}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className={container}>
        <h1 className={titleBar.title}>Analytics</h1>
        <p className={infoBox}>This page is restricted to the site owner.</p>
      </div>
    );
  }

  return (
    <div className={container}>
      <h1 className={titleBar.title}>Analytics</h1>

      <div className={tabStyles.tabList}>
        {RANGES.map((range) => (
          <Tab key={range} label={`${range} days`} isActive={days === range} onClick={() => setDays(range)} />
        ))}
      </div>

      {error && <div className={errorBanner}>{error instanceof Error ? error.message : "Failed to load stats"}</div>}

      {isPending && !stats ? (
        <p className={infoBox}>Loading stats...</p>
      ) : stats ? (
        <>
          <div className={headline}>{stats.totalHits.toLocaleString()} views</div>
          <div className={subline}>
            across {stats.pages.length} {stats.pages.length === 1 ? "page" : "pages"} · {formatDay(stats.from)} –{" "}
            {formatDay(stats.to)}
          </div>

          <div className={chart}>
            {stats.days.map((day) => (
              <div key={day.date} className={barSlot} title={`${formatDay(day.date)}: ${day.hits} views`}>
                <div className={barClass(day)} style={{ height: `${(day.hits / peak) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className={axis}>
            <span>{formatDay(stats.from)}</span>
            <span>{formatDay(stats.to)}</span>
          </div>

          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Page</th>
                <th className={thRight}>Views</th>
              </tr>
            </thead>
            <tbody>
              {stats.pages.map((page) => (
                <tr key={page.path}>
                  <td className={td}>
                    <a
                      className={pathLink}
                      href={`${SITE_CONFIG.url}${page.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {page.path}
                    </a>
                  </td>
                  <td className={tdRight}>{page.hits.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {stats.pages.length === 0 && <p className={infoBox}>No traffic recorded in this range.</p>}

          {hasHistoric && (
            <p className={footnote}>
              Grey bars predate the hit counter and were backfilled from Umami, which filtered bots and counted sessions
              rather than pageviews — the two are not directly comparable.
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}
