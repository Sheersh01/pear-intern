import React, { useState } from "react";
import { Download, ExternalLink, Copy, Check } from "lucide-react";

export default function ImageCard({ imageUrl, label, prompt }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt || imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.card} className="animate-fade-up">
      <div style={styles.imageWrap}>
        <img src={imageUrl} alt={label} style={styles.image} loading="lazy" />
        <div style={styles.overlay}>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.overlayBtn}
          >
            <ExternalLink size={16} />
            Open
          </a>
          <a
            href={imageUrl}
            download="pearmedia-output.jpg"
            style={styles.overlayBtn}
          >
            <Download size={16} />
            Save
          </a>
        </div>
      </div>

      {label && <p style={styles.label}>{label}</p>}

      {prompt && (
        <div style={styles.promptRow}>
          <p style={styles.promptText}>
            {prompt.slice(0, 120)}
            {prompt.length > 120 ? "…" : ""}
          </p>
          <button style={styles.copyBtn} onClick={handleCopy}>
            {copied ? (
              <Check size={13} color="var(--accent)" />
            ) : (
              <Copy size={13} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  imageWrap: {
    position: "relative",
    aspectRatio: "1",
    overflow: "hidden",
    background: "#0c121c",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "transform 0.4s ease",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    background: "linear-gradient(transparent, rgba(7,11,18,0.84))",
    display: "flex",
    gap: "0.5rem",
    padding: "1rem 0.75rem 0.75rem",
    opacity: 0,
    transition: "opacity 0.2s ease",
    // Show on card hover via JS workaround in parent
  },
  overlayBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    padding: "0.35rem 0.75rem",
    borderRadius: "6px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(8px)",
    color: "#fff",
    fontSize: "0.75rem",
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.12)",
    fontFamily: "var(--font-mono)",
  },
  label: {
    padding: "0.6rem 0.75rem 0.25rem",
    fontSize: "0.7rem",
    fontFamily: "var(--font-mono)",
    color: "var(--accent)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  promptRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    padding: "0 0.75rem 0.75rem",
  },
  promptText: {
    flex: 1,
    fontSize: "0.75rem",
    color: "var(--text-dim)",
    lineHeight: 1.5,
    fontFamily: "var(--font-mono)",
  },
  copyBtn: {
    flexShrink: 0,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "var(--text-dim)",
    padding: "2px",
    marginTop: "2px",
  },
};
