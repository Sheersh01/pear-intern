import React, { useState, useRef } from 'react';
import { Upload, ScanLine, Shuffle, RotateCcw, ImageIcon } from 'lucide-react';
import { analyzeImageWithGemini, buildVariationPrompt, generateImageFromPrompt } from '../utils/apiHelpers';
import { STATUS } from '../utils/constants';
import ImageCard from './ImageCard';

export default function WorkflowImage() {
  const [uploadedFile, setUploadedFile]   = useState(null); // { url, base64, mimeType }
  const [analysis, setAnalysis]           = useState(null);
  const [variationUrl, setVariationUrl]   = useState('');
  const [variationPrompt, setVariationPrompt] = useState('');
  const [status, setStatus]               = useState(STATUS.IDLE);
  const [error, setError]                 = useState('');
  const [dragging, setDragging]           = useState(false);
  const inputRef = useRef();

  const reset = () => {
    setUploadedFile(null); setAnalysis(null);
    setVariationUrl(''); setVariationPrompt('');
    setStatus(STATUS.IDLE); setError('');
  };

  const readFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const base64 = dataUrl.split(',')[1];
      setUploadedFile({ url: dataUrl, base64, mimeType: file.type });
      setStatus(STATUS.IDLE);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    readFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    setError('');
    setStatus(STATUS.ANALYZING);
    try {
      const result = await analyzeImageWithGemini(uploadedFile.base64, uploadedFile.mimeType);
      setAnalysis(result);
      setStatus(STATUS.WAITING);
    } catch (e) {
      setError(e.message);
      setStatus(STATUS.ERROR);
    }
  };

  const handleVariation = async () => {
    if (!analysis) return;
    setError('');
    setStatus(STATUS.GENERATING);
    const prompt = buildVariationPrompt(analysis);
    setVariationPrompt(prompt);
    try {
      const url = await generateImageFromPrompt(prompt);
      setVariationUrl(url);
      setStatus(STATUS.DONE);
    } catch (e) {
      setError(e.message);
      setStatus(STATUS.ERROR);
    }
  };

  const isAnalyzing  = status === STATUS.ANALYZING;
  const isGenerating = status === STATUS.GENERATING;
  const isWaiting    = status === STATUS.WAITING;
  const isDone       = status === STATUS.DONE;

  return (
    <div style={styles.wrapper}>
      {/* Left — controls */}
      <div style={styles.panel}>
        {/* Upload zone */}
        <div style={styles.stepLabel}>
          <StepBadge n="01" label="Upload your image" />
        </div>

        <div
          style={{
            ...styles.dropzone,
            ...(dragging ? styles.dropzoneDrag : {}),
            ...(uploadedFile ? styles.dropzoneFilled : {}),
          }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploadedFile && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => readFile(e.target.files[0])}
          />

          {uploadedFile ? (
            <div style={styles.previewWrap}>
              <img src={uploadedFile.url} alt="Uploaded" style={styles.preview} />
              <button style={styles.clearBtn} onClick={(e) => { e.stopPropagation(); reset(); }}>
                <RotateCcw size={13} /> Change image
              </button>
            </div>
          ) : (
            <>
              <Upload size={28} color="var(--muted)" />
              <p style={styles.dropText}>Drop image or <span style={{ color: 'var(--accent)' }}>click to browse</span></p>
              <p style={styles.dropHint}>JPG, PNG, WebP · Max 10 MB</p>
            </>
          )}
        </div>

        {uploadedFile && !analysis && (
          <button
            style={{
              ...styles.btn,
              ...(isAnalyzing ? styles.btnLoading : {}),
            }}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing
              ? <><Spinner /> Analyzing with Gemini Vision…</>
              : <><ScanLine size={16} /> Analyze Image</>
            }
          </button>
        )}

        {/* Analysis results */}
        {analysis && (
          <div style={styles.analysisBlock} className="animate-fade-up">
            <StepBadge n="02" label="AI Vision Analysis" />
            <div style={styles.tagGrid}>
              <AnalysisTag label="Subject" value={analysis.mainSubject} />
              <AnalysisTag label="Style" value={analysis.artisticStyle} />
              <AnalysisTag label="Lighting" value={analysis.lightingStyle} />
              <AnalysisTag label="Mood" value={analysis.mood} />
            </div>

            {analysis.colorPalette?.length > 0 && (
              <div style={styles.palette}>
                <span style={styles.paletteLabel}>Palette</span>
                {analysis.colorPalette.map((c, i) => (
                  <span key={i} style={styles.colorChip}>{c}</span>
                ))}
              </div>
            )}

            {analysis.detailedDescription && (
              <p style={styles.desc}>{analysis.detailedDescription}</p>
            )}

            <button
              style={{
                ...styles.btn,
                ...styles.btnAccent,
                ...(isGenerating ? styles.btnLoading : {}),
                marginTop: '0.5rem',
              }}
              onClick={handleVariation}
              disabled={isGenerating}
            >
              {isGenerating
                ? <><Spinner /> Generating variation…</>
                : <><Shuffle size={16} /> Generate Stylistic Variation</>
              }
            </button>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}
      </div>

      {/* Right — results */}
      <div style={styles.outputPanel}>
        <div style={styles.comparison}>
          {uploadedFile && (
            <div className="animate-fade-in">
              <StepBadge n="↑" label="Original" />
              <img src={uploadedFile.url} alt="Original" style={styles.compImg} />
            </div>
          )}
          {isDone && variationUrl ? (
            <div className="animate-fade-up">
              <StepBadge n="03" label="AI Variation" />
              <ImageCard imageUrl={variationUrl} label="Style Lab Output" prompt={variationPrompt} />
            </div>
          ) : (
            !uploadedFile && <EmptyState isLoading={isGenerating} />
          )}
        </div>
      </div>
    </div>
  );
}

function StepBadge({ n, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 500,
        color: 'var(--accent2)', background: 'rgba(87,200,255,0.1)',
        border: '1px solid rgba(87,200,255,0.2)', borderRadius: '4px',
        padding: '1px 6px',
      }}>{n}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{label}</span>
    </div>
  );
}

function AnalysisTag({ label, value }) {
  if (!value) return null;
  return (
    <div style={styles.tag}>
      <span style={styles.tagLabel}>{label}</span>
      <span style={styles.tagValue}>{value}</span>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)',
      borderTopColor: 'currentColor', borderRadius: '50%',
      display: 'inline-block', animation: 'spin 0.7s linear infinite',
    }} />
  );
}

function EmptyState({ isLoading }) {
  return (
    <div style={styles.empty}>
      {isLoading ? (
        <>
          <div style={styles.emptySpinner} />
          <p style={styles.emptyText}>Generating variation…</p>
        </>
      ) : (
        <>
          <ImageIcon size={32} color="var(--muted)" />
          <p style={styles.emptyText}>Upload an image to begin</p>
          <p style={styles.emptyHint}>Gemini will analyze its style, then generate a creative variation</p>
        </>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    alignItems: 'start',
  },
  panel: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  stepLabel: {},
  dropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    minHeight: '200px',
    border: '1.5px dashed var(--border)',
    borderRadius: 'var(--radius)',
    background: 'var(--surface)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: '1.5rem',
    textAlign: 'center',
  },
  dropzoneDrag: {
    borderColor: 'var(--accent2)',
    background: 'rgba(87,200,255,0.05)',
  },
  dropzoneFilled: {
    border: '1.5px solid var(--border)',
    cursor: 'default',
    padding: '0',
    overflow: 'hidden',
  },
  previewWrap: { width: '100%', position: 'relative' },
  preview: {
    width: '100%',
    maxHeight: '260px',
    objectFit: 'cover',
    display: 'block',
    borderRadius: 'calc(var(--radius) - 2px)',
  },
  clearBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    position: 'absolute',
    bottom: '0.5rem',
    right: '0.5rem',
    background: 'rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    borderRadius: '6px',
    padding: '0.3rem 0.6rem',
    fontSize: '0.72rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    backdropFilter: 'blur(8px)',
  },
  dropText: { fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500 },
  dropHint: { fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1.25rem',
    borderRadius: '9px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  btnAccent: {
    background: 'var(--accent2)',
    color: '#0a0a0f',
    border: '1px solid var(--accent2)',
  },
  btnLoading: { opacity: 0.7, cursor: 'not-allowed' },
  analysisBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1.25rem',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  tagGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' },
  tag: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
  },
  tagLabel: {
    display: 'block',
    fontSize: '0.6rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '2px',
  },
  tagValue: { fontSize: '0.8rem', color: 'var(--text)', fontWeight: 500 },
  palette: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' },
  paletteLabel: {
    fontSize: '0.65rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  colorChip: {
    fontSize: '0.72rem',
    fontFamily: 'var(--font-mono)',
    background: 'rgba(87,200,255,0.1)',
    border: '1px solid rgba(87,200,255,0.2)',
    borderRadius: '4px',
    padding: '1px 6px',
    color: 'var(--accent2)',
  },
  desc: {
    fontSize: '0.78rem',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1.6,
    borderTop: '1px solid var(--border)',
    paddingTop: '0.75rem',
  },
  error: {
    fontSize: '0.78rem',
    color: '#ff6b6b',
    fontFamily: 'var(--font-mono)',
    background: 'rgba(255,107,107,0.08)',
    border: '1px solid rgba(255,107,107,0.2)',
    borderRadius: '8px',
    padding: '0.6rem 0.875rem',
  },
  outputPanel: { position: 'sticky', top: '84px' },
  comparison: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  compImg: {
    width: '100%',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    display: 'block',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    minHeight: '400px',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius)',
    textAlign: 'center',
    padding: '2rem',
  },
  emptySpinner: {
    width: 40, height: 40,
    border: '3px solid var(--border)',
    borderTopColor: 'var(--accent2)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyText: { color: 'var(--text-dim)', fontFamily: 'var(--font-body)', fontWeight: 500 },
  emptyHint: { fontSize: '0.78rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', maxWidth: '260px' },
};
