import React, { useState } from "react";
import {
  Wand2,
  ImageIcon,
  RotateCcw,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  getEnhancedPrompt,
  generateImageFromPrompt,
} from "../utils/apiHelpers";
import { STATUS, PLACEHOLDER_PROMPTS } from "../utils/constants";
import ImageCard from "./ImageCard";

const placeholder =
  PLACEHOLDER_PROMPTS[Math.floor(Math.random() * PLACEHOLDER_PROMPTS.length)];

export default function WorkflowText() {
  const [userPrompt, setUserPrompt] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState(STATUS.IDLE);
  const [error, setError] = useState("");

  const reset = () => {
    setUserPrompt("");
    setEnhancedPrompt("");
    setImageUrl("");
    setStatus(STATUS.IDLE);
    setError("");
  };

  const handleEnhance = async () => {
    if (!userPrompt.trim()) return;
    setError("");
    setStatus(STATUS.ENHANCING);
    try {
      const result = await getEnhancedPrompt(userPrompt);
      setEnhancedPrompt(result);
      setStatus(STATUS.WAITING);
    } catch (e) {
      setError(e.message);
      setStatus(STATUS.ERROR);
    }
  };

  const handleGenerate = async () => {
    if (!enhancedPrompt.trim()) return;
    setError("");
    setStatus(STATUS.GENERATING);
    try {
      const url = await generateImageFromPrompt(enhancedPrompt);
      setImageUrl(url);
      setStatus(STATUS.DONE);
    } catch (e) {
      setError(e.message);
      setStatus(STATUS.ERROR);
    }
  };

  const isEnhancing = status === STATUS.ENHANCING;
  const isGenerating = status === STATUS.GENERATING;
  const isWaiting = status === STATUS.WAITING;
  const isDone = status === STATUS.DONE;

  return (
    <div style={styles.wrapper}>
      {/* Left panel */}
      <div style={styles.panel}>
        <div style={styles.stepHeader}>
          <StepBadge n="01" label="Describe your vision" />
        </div>

        <textarea
          style={styles.textarea}
          placeholder={`e.g. "${placeholder}"`}
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          rows={4}
          disabled={isEnhancing || isGenerating}
        />

        <button
          style={{
            ...styles.btn,
            ...(isEnhancing ? styles.btnLoading : {}),
            opacity: !userPrompt.trim() ? 0.4 : 1,
          }}
          onClick={handleEnhance}
          disabled={!userPrompt.trim() || isEnhancing || isGenerating}
        >
          {isEnhancing ? (
            <>
              <Spinner /> Enhancing with AI…
            </>
          ) : (
            <>
              <Wand2 size={16} /> Enhance Prompt
            </>
          )}
        </button>

        {/* Step 2 — Approval */}
        {(isWaiting || isGenerating || isDone) && (
          <div style={styles.approvalBlock} className="animate-fade-up">
            <StepBadge n="02" label="Review & edit enhanced prompt" />
            <p style={styles.hint}>
              ✏️ AI-engineered your prompt — tweak it before generating.
            </p>
            <textarea
              style={{ ...styles.textarea, ...styles.textareaEnhanced }}
              value={enhancedPrompt}
              onChange={(e) => setEnhancedPrompt(e.target.value)}
              rows={6}
              disabled={isGenerating}
            />

            <button
              style={{
                ...styles.btn,
                ...styles.btnAccent,
                ...(isGenerating ? styles.btnLoading : {}),
              }}
              onClick={handleGenerate}
              disabled={isGenerating || !enhancedPrompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Spinner /> Generating image…
                </>
              ) : (
                <>
                  <ImageIcon size={16} /> Generate Image{" "}
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        {isDone && (
          <button style={styles.resetBtn} onClick={reset}>
            <RotateCcw size={13} /> Start over
          </button>
        )}
      </div>

      {/* Right panel — output */}
      <div style={styles.outputPanel}>
        {isDone && imageUrl ? (
          <div className="animate-fade-up">
            <StepBadge n="03" label="Your generated image" />
            <div style={{ marginTop: "1rem" }}>
              <ImageCard
                imageUrl={imageUrl}
                label="Creative Studio Output"
                prompt={enhancedPrompt}
              />
            </div>
          </div>
        ) : (
          <EmptyState isLoading={isGenerating} />
        )}
      </div>
    </div>
  );
}

function StepBadge({ n, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        marginBottom: "0.75rem",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          fontWeight: 500,
          color: "var(--accent)",
          background: "rgba(211,173,115,0.1)",
          border: "1px solid rgba(211,173,115,0.2)",
          borderRadius: "4px",
          padding: "1px 6px",
        }}
      >
        {n}
      </span>
      <span
        style={{
          fontSize: "0.8rem",
          color: "var(--text-dim)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        border: "2px solid rgba(255,255,255,0.2)",
        borderTopColor: "currentColor",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

function EmptyState({ isLoading }) {
  return (
    <div style={styles.empty}>
      {isLoading ? (
        <>
          <div style={styles.emptySpinner} />
          <p style={styles.emptyText}>Generating your image…</p>
          <p style={styles.emptyHint}>This can take 10–30 seconds</p>
        </>
      ) : (
        <>
          <Sparkles size={32} color="var(--muted)" />
          <p style={styles.emptyText}>Your image will appear here</p>
          <p style={styles.emptyHint}>
            Describe your idea and let AI enhance it
          </p>
        </>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem",
    alignItems: "start",
  },
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  stepHeader: { marginBottom: "0" },
  textarea: {
    width: "100%",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    color: "var(--text)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.82rem",
    lineHeight: 1.6,
    padding: "0.85rem 1rem",
    resize: "vertical",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  textareaEnhanced: {
    borderColor: "rgba(211,173,115,0.25)",
    background: "rgba(211,173,115,0.04)",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.65rem 1.25rem",
    borderRadius: "9px",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    width: "100%",
  },
  btnAccent: {
    background: "rgba(211,173,115,0.12)",
    color: "var(--text)",
    border: "1px solid rgba(211,173,115,0.28)",
  },
  btnLoading: { opacity: 0.7, cursor: "not-allowed" },
  approvalBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    padding: "1.25rem",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
  },
  hint: {
    fontSize: "0.75rem",
    color: "var(--text-dim)",
    fontFamily: "var(--font-mono)",
  },
  error: {
    fontSize: "0.78rem",
    color: "#cf7f88",
    fontFamily: "var(--font-mono)",
    background: "rgba(207,127,136,0.08)",
    border: "1px solid rgba(207,127,136,0.2)",
    borderRadius: "8px",
    padding: "0.6rem 0.875rem",
  },
  resetBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "transparent",
    border: "none",
    color: "var(--text-dim)",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontFamily: "var(--font-mono)",
    padding: "0.25rem 0",
  },
  outputPanel: { position: "sticky", top: "84px" },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    minHeight: "400px",
    border: "1px dashed var(--border)",
    borderRadius: "var(--radius)",
    textAlign: "center",
    padding: "2rem",
  },
  emptySpinner: {
    width: 40,
    height: 40,
    border: "3px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  emptyText: {
    color: "var(--text-dim)",
    fontFamily: "var(--font-body)",
    fontWeight: 500,
  },
  emptyHint: {
    fontSize: "0.78rem",
    color: "var(--muted)",
    fontFamily: "var(--font-mono)",
  },
};
