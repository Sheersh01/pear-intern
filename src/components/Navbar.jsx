import React, { useState, useEffect } from "react";
import { TABS } from "../utils/constants";
import { getRateLimitStatus } from "../utils/apiHelpers";

export default function Navbar({ activeTab, setActiveTab }) {
  const [quota, setQuota] = useState(getRateLimitStatus());

  // Refresh quota display whenever tab changes or on an interval
  useEffect(() => {
    setQuota(getRateLimitStatus());
    const id = setInterval(() => setQuota(getRateLimitStatus()), 5000);
    return () => clearInterval(id);
  }, [activeTab]);

  const quotaColor =
    quota.percentUsed > 80
      ? "#ff6b6b"
      : quota.percentUsed > 50
        ? "#ffc857"
        : "var(--accent)";
  return (
    <header style={styles.header}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>🍐</span>
        <span style={styles.logoText}>
          Pear<strong>Media</strong>
        </span>
        <span style={styles.badge}>AI Studio</span>
      </div>

      <nav style={styles.nav}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === TABS.TEXT ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab(TABS.TEXT)}
        >
          <span style={styles.tabNum}>01</span>
          Creative Studio
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === TABS.IMAGE ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab(TABS.IMAGE)}
        >
          <span style={styles.tabNum}>02</span>
          Style Lab
        </button>
      </nav>

      <div
        style={styles.quotaWrap}
        title={`${quota.used} of ${quota.limitPerDay} daily requests used`}
      >
        <div style={styles.quotaBar}>
          <div
            style={{
              ...styles.quotaFill,
              width: `${quota.percentUsed}%`,
              background: quotaColor,
            }}
          />
        </div>
        <span style={{ ...styles.quotaText, color: quotaColor }}>
          {quota.remaining} / {quota.limitPerDay} req left
        </span>
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 2rem",
    height: "64px",
    borderBottom: "1px solid #252535",
    background: "rgba(10,10,15,0.85)",
    backdropFilter: "blur(16px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontFamily: "var(--font-head)",
    fontSize: "1.1rem",
    letterSpacing: "-0.01em",
  },
  logoIcon: { fontSize: "1.4rem" },
  logoText: { color: "var(--text)" },
  badge: {
    fontSize: "0.6rem",
    fontFamily: "var(--font-mono)",
    background: "rgba(184,255,87,0.12)",
    color: "var(--accent)",
    border: "1px solid rgba(184,255,87,0.25)",
    borderRadius: "99px",
    padding: "2px 8px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  nav: { display: "flex", gap: "0.25rem" },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.4rem 1rem",
    borderRadius: "8px",
    border: "1px solid transparent",
    background: "transparent",
    color: "var(--text-dim)",
    fontFamily: "var(--font-body)",
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  tabActive: {
    background: "rgba(184,255,87,0.08)",
    border: "1px solid rgba(184,255,87,0.2)",
    color: "var(--accent)",
  },
  tabNum: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.65rem",
    opacity: 0.5,
  },
  quotaWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "3px",
    minWidth: "120px",
  },
  quotaBar: {
    width: "100%",
    height: "4px",
    background: "var(--border)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  quotaFill: {
    height: "100%",
    borderRadius: "2px",
    transition: "width 0.4s ease, background 0.4s ease",
  },
  quotaText: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.62rem",
    transition: "color 0.4s ease",
  },
};
