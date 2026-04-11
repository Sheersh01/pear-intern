import React, { useState } from "react";
import Navbar from "./components/Navbar";
import WorkflowText from "./components/WorkflowText";
import WorkflowImage from "./components/WorkflowImage";
import { TABS } from "./utils/constants";

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS.TEXT);
  const hasKey = !!import.meta.env.VITE_GEMINI_KEY;

  return (
    <div style={styles.app}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* API Key warning */}
      {!hasKey && (
        <div style={styles.keyWarning}>
          ⚠️ &nbsp;No <code>VITE_GEMINI_KEY</code> found in <code>.env</code> —
          get a free key at{" "}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)" }}
          >
            aistudio.google.com
          </a>
        </div>
      )}

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <span style={styles.tag}>
            {activeTab === TABS.TEXT
              ? "✦ Workflow A — Text to Image"
              : "✦ Workflow B — Style Transfer"}
          </span>
          <h1 style={styles.heroTitle}>
            {activeTab === TABS.TEXT ? (
              <>
                AI-Enhanced
                <br />
                <em>Creative Studio</em>
              </>
            ) : (
              <>
                Vision-Powered
                <br />
                <em>Style Lab</em>
              </>
            )}
          </h1>
          <p style={styles.heroSub}>
            {activeTab === TABS.TEXT
              ? "Type a simple idea → Gemini engineers the perfect prompt → Pollinations generates your image."
              : "Upload any image → Gemini Vision decodes its DNA → Generate a stylistic variation."}
          </p>
        </div>
        <div style={styles.heroBadges}>
          <ApiPill
            name="Gemini 2.5 Flash"
            tag="Text + Vision"
            color="var(--accent2)"
          />
          <ApiPill
            name="Pollinations.ai"
            tag="Image Gen · Free"
            color="var(--accent)"
          />
        </div>
      </section>

      {/* Main content */}
      <main style={styles.main}>
        <div
          key={activeTab}
          className="animate-fade-up"
          style={styles.tabContent}
        >
          {activeTab === TABS.TEXT ? <WorkflowText /> : <WorkflowImage />}
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>🍐 Pear Media AI Studio</span>
        <span style={{ color: "var(--muted)" }}>
          Built with Vite · React · Gemini · Pollinations
        </span>
        <a
          href="https://github.com/your-username/pearmedia-ai-prototype"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--text-dim)",
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
          }}
        >
          GitHub ↗
        </a>
      </footer>
    </div>
  );
}

function ApiPill({ name, tag, color }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.35rem 0.85rem",
        borderRadius: "99px",
        background: "var(--card)",
        border: `1px solid ${color}33`,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          color: "var(--text)",
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          color,
          background: `${color}15`,
          borderRadius: "4px",
          padding: "1px 5px",
        }}
      >
        {tag}
      </span>
    </div>
  );
}

const styles = {
  app: { minHeight: "100vh", display: "flex", flexDirection: "column" },
  keyWarning: {
    padding: "0.6rem 2rem",
    background: "rgba(211,173,115,0.08)",
    border: "1px solid rgba(211,173,115,0.18)",
    borderLeft: "none",
    borderRight: "none",
    fontSize: "0.8rem",
    fontFamily: "var(--font-mono)",
    color: "#d8bb84",
    textAlign: "center",
  },
  hero: {
    padding: "3rem 2rem 2rem",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1.5rem",
    borderBottom: "1px solid var(--border)",
    background: `radial-gradient(ellipse 60% 80% at 20% 50%, rgba(126,147,184,0.07) 0%, transparent 70%)`,
  },
  heroInner: { maxWidth: "560px" },
  tag: {
    display: "inline-block",
    fontFamily: "var(--font-mono)",
    fontSize: "0.7rem",
    color: "var(--text-dim)",
    letterSpacing: "0.06em",
    marginBottom: "0.75rem",
  },
  heroTitle: {
    fontFamily: "var(--font-head)",
    fontSize: "clamp(2rem, 5vw, 3.5rem)",
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: "-0.03em",
    marginBottom: "0.75rem",
    background:
      "linear-gradient(135deg, var(--text) 60%, var(--text-dim) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: {
    color: "var(--text-dim)",
    fontSize: "0.9rem",
    lineHeight: 1.7,
    maxWidth: "440px",
    fontFamily: "var(--font-mono)",
  },
  heroBadges: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    alignItems: "flex-end",
  },
  main: {
    flex: 1,
    padding: "2.5rem 2rem",
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
  },
  tabContent: {},
  footer: {
    padding: "1.25rem 2rem",
    borderTop: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "0.78rem",
    color: "var(--text-dim)",
    fontFamily: "var(--font-mono)",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
};
