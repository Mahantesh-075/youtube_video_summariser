import { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { 
  Youtube, FileText, LayoutTemplate, Download, 
  ArrowRight, Activity, Zap, CheckCircle 
} from 'lucide-react';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter',
});

function App() {
  const [url, setUrl] = useState('');
  const [tokenLimit, setTokenLimit] = useState(500);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Results state
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'diagram'
  
  const mermaidRef = useRef(null);

  // Render mermaid diagram when result changes or tab changes
  useEffect(() => {
    if (result?.mermaid_code && activeTab === 'diagram' && mermaidRef.current) {
      const renderDiagram = async () => {
        try {
          mermaidRef.current.innerHTML = '';
          const { svg } = await mermaid.render('mermaid-svg', result.mermaid_code);
          mermaidRef.current.innerHTML = svg;
        } catch (err) {
          console.error("Mermaid parsing error:", err);
          mermaidRef.current.innerHTML = `<div class="error-text">Failed to render diagram. The AI might have generated invalid syntax.</div>`;
        }
      };
      renderDiagram();
    }
  }, [result, activeTab]);

  const handleSummarize = async (e) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Use relative path relying on Vite proxy
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: url, token_limit: parseInt(tokenLimit) })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch summary');
      }

      const data = await response.json();
      setResult(data);
      setActiveTab('summary');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadDoc = async () => {
    try {
      const response = await fetch('/api/download-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: result.title, summary: result.summary })
      });

      if (!response.ok) throw new Error('Failed to generate document');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${result.title.substring(0, 30)}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert("Error downloading document: " + err.message);
    }
  };

  const handleDownloadDiagram = () => {
    if (!mermaidRef.current) return;
    const svgElement = mermaidRef.current.querySelector('svg');
    if (!svgElement) return;
    
    // Ensure XML namespace for valid SVG file
    if (!svgElement.getAttribute('xmlns')) {
      svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title.substring(0, 30)}_Diagram.svg`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="app-wrapper">
      {/* ── Header ── */}
      <header className="header">
        <a href="/" className="header__logo">
          <div className="header__icon"><Youtube color="white" size={24} /></div>
          <span className="header__title">VideoSummariser</span>
        </a>
        <div className="header__badge">AI Powered</div>
      </header>

      <main className="main">
        {/* ── Hero Section ── */}
        <section className="hero">
          <div className="hero__tagline">Turn hours of video into seconds of reading</div>
          <h1 className="hero__heading">YouTube to <span>Knowledge</span></h1>
          <p className="hero__subtitle">
            Paste a YouTube link below. Our AI will instantly extract the transcript, 
            generate a token-optimized summary, and build a visual diagram of the core concepts.
          </p>

          <form onSubmit={handleSummarize} className="input-section">
            <div className="input-wrapper">
              <input 
                type="url" 
                placeholder="https://www.youtube.com/watch?v=..." 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button type="submit" className="btn-summarize" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Summarize'}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </div>
            
            <div className="token-control mt-4">
              <label>Summary Length ({tokenLimit} tokens)</label>
              <input 
                type="range" 
                min="100" 
                max="1500" 
                step="50"
                value={tokenLimit}
                onChange={(e) => setTokenLimit(e.target.value)}
              />
            </div>
          </form>
        </section>

        {/* ── States ── */}
        {isLoading && (
          <div className="loading-container fade-in">
            <div className="loading-spinner"></div>
            <h3 className="loading-text">Analyzing Video Content...</h3>
            <p className="loading-subtext">Extracting transcript and calling Gemini AI</p>
          </div>
        )}

        {error && (
          <div className="error-container fade-in">
            <div className="error-box">
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && !isLoading && (
          <section className="results fade-in">
            <h2 className="results__title">{result.title}</h2>
            <p className="results__video-title">Generated from {url}</p>

            <div className="actions-row">
              <button onClick={handleDownloadDoc} className="btn-action btn-action--primary">
                <Download size={18} /> Download Word Doc
              </button>
              {activeTab === 'diagram' && (
                <button onClick={handleDownloadDiagram} className="btn-action fade-in">
                  <Download size={18} /> Download Diagram (SVG)
                </button>
              )}
            </div>

            <div className="tabs">
              <button 
                className={`tab-btn ${activeTab === 'summary' ? 'tab-btn--active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                <FileText size={18} /> Text Summary
              </button>
              <button 
                className={`tab-btn ${activeTab === 'diagram' ? 'tab-btn--active' : ''}`}
                onClick={() => setActiveTab('diagram')}
              >
                <LayoutTemplate size={18} /> Visual Diagram
              </button>
            </div>

            {activeTab === 'summary' ? (
              <div className="summary-card fade-in">
                {/* Simple markdown to HTML parser for display */}
                <div dangerouslySetInnerHTML={{ 
                  __html: result.summary
                    .replace(/## (.*)/g, '<h2>$1</h2>')
                    .replace(/### (.*)/g, '<h3>$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/- (.*)/g, '<li>$1</li>')
                    .replace(/\n/g, '<br/>')
                }} />
              </div>
            ) : (
              <div className="diagram-card fade-in">
                <div ref={mermaidRef} className="mermaid-container"></div>
              </div>
            )}
          </section>
        )}

        {/* ── Features List (Only show when no results) ── */}
        {!result && !isLoading && (
          <div className="features fade-in">
            <div className="feature-card">
              <div className="feature-card__icon feature-card__icon--purple"><Zap /></div>
              <h3>Lightning Fast</h3>
              <p>Uses the official YouTube transcripts API to fetch text instantly without downloading video.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon feature-card__icon--blue"><Activity /></div>
              <h3>Smart Chunking</h3>
              <p>Gemini AI intelligently condenses hours of speech into structured, readable key takeaways.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon feature-card__icon--cyan"><CheckCircle /></div>
              <h3>Visual Exports</h3>
              <p>Automatically generates downloadable Word documents and block diagrams via Mermaid.js.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
