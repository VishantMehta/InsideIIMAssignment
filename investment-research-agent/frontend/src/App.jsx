import { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './index.css';

function App() {
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Track progress of nodes
  const [completedNodes, setCompletedNodes] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  
  // Final data states
  const [ticker, setTicker] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [swotData, setSwotData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [finalDecision, setFinalDecision] = useState(null);
  const [isCached, setIsCached] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  
  const eventSourceRef = useRef(null);

  // Clean up EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!company.trim()) return;

    // Reset state
    setLoading(true);
    setError(null);
    setCompletedNodes([]);
    setCurrentNode('intake');
    
    setTicker(null);
    setFinancials(null);
    setAnalysisData(null);
    setSwotData(null);
    setRiskData(null);
    setFinalDecision(null);
    setIsCached(false);
    setActiveTab('overview');
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const url = `${API_BASE_URL}/api/research?company=${encodeURIComponent(company)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.done) {
          es.close();
          setLoading(false);
          setCurrentNode(null);
          return;
        }

        if (data.error) {
          setError(data.error);
          setLoading(false);
          setCurrentNode(null);
          es.close();
          return;
        }

        const node = data.node;
        
        setCompletedNodes(prev => {
          if (!prev.includes(node)) return [...prev, node];
          return prev;
        });

        // Predict next node for UI feedback
        const sequence = ['intake', 'research', 'fetchFinancials', 'analyze', 'swotAnalysis', 'riskAssessment', 'decide', 'respond'];
        const currentIndex = sequence.indexOf(node);
        if (currentIndex !== -1 && currentIndex < sequence.length - 1) {
          setCurrentNode(sequence[currentIndex + 1]);
        }

        // Store data payloads
        if (data.ticker) setTicker(data.ticker);
        if (data.financials) setFinancials(data.financials);
        if (data.analysisData) setAnalysisData(data.analysisData);
        if (data.swotData) setSwotData(data.swotData);
        if (data.riskData) setRiskData(data.riskData);
        if (data.finalDecision) setFinalDecision(data.finalDecision);
        if (data.isCached !== undefined) setIsCached(data.isCached);
        
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    };

    es.onerror = (err) => {
      console.error("EventSource failed:", err);
      setError("Connection to server failed or stream ended unexpectedly.");
      setLoading(false);
      setCurrentNode(null);
      es.close();
    };
  };

  const getStatusText = (node) => {
    switch(node) {
      case 'intake': return 'Intaking company information...';
      case 'research': return 'Gathering recent news and market data...';
      case 'fetchFinancials': return 'Fetching financial metrics from Yahoo Finance...';
      case 'analyze': return 'Analyzing research and financials...';
      case 'swotAnalysis': return 'Generating SWOT matrix...';
      case 'riskAssessment': return 'Calculating overall risk score...';
      case 'decide': return 'Formulating final investment decision...';
      case 'respond': return 'Formatting final report...';
      default: return `Processing ${node}...`;
    }
  };

  const allNodes = ['intake', 'research', 'fetchFinancials', 'analyze', 'swotAnalysis', 'riskAssessment', 'decide', 'respond'];

  // Helper formats
  const formatDollar = (val) => {
    if (!val) return 'N/A';
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };
  
  const formatPercent = (val) => {
    if (!val) return 'N/A';
    return `${(val * 100).toFixed(2)}%`;
  };

  // Sections
  const renderOverview = () => (
    <div className="section-content fade-in">
      <h2>Overview</h2>
      <div className="card-grid">
        <div className="metric-card">
          <div className="metric-label">Company</div>
          <div className="metric-value">{company}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Ticker</div>
          <div className="metric-value">{ticker || 'N/A'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Sector</div>
          <div className="metric-value">{financials?.metrics?.sector || 'N/A'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Industry</div>
          <div className="metric-value">{financials?.metrics?.industry || 'N/A'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Current Price</div>
          <div className="metric-value">{financials?.metrics?.currentPrice ? `$${financials.metrics.currentPrice.toFixed(2)}` : 'N/A'}</div>
        </div>
      </div>
    </div>
  );

  const renderFinancialHealth = () => (
    <div className="section-content fade-in">
      <h2>Financial Health</h2>
      <div className="card-grid">
        <div className="metric-card">
          <div className="metric-label">Market Cap</div>
          <div className="metric-value">{formatDollar(financials?.metrics?.marketCap)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">P/E Ratio</div>
          <div className="metric-value">{financials?.metrics?.peRatio?.toFixed(2) || 'N/A'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">EPS</div>
          <div className="metric-value">{financials?.metrics?.eps?.toFixed(2) || 'N/A'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Debt</div>
          <div className="metric-value">{formatDollar(financials?.metrics?.totalDebt)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Free Cash Flow</div>
          <div className="metric-value">{formatDollar(financials?.metrics?.freeCashFlow)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Gross Margin</div>
          <div className="metric-value">{formatPercent(financials?.metrics?.grossMargin)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Operating Margin</div>
          <div className="metric-value">{formatPercent(financials?.metrics?.operatingMargin)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Net Margin</div>
          <div className="metric-value">{formatPercent(financials?.metrics?.netMargin)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">ROE</div>
          <div className="metric-value">{formatPercent(financials?.metrics?.roe)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">ROA</div>
          <div className="metric-value">{formatPercent(financials?.metrics?.roa)}</div>
        </div>
      </div>
    </div>
  );

  const renderStockPerformance = () => {
    const data = financials?.historicalPrices || [];
    const formattedData = data.map(d => ({
      date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }),
      close: d.close
    }));

    return (
      <div className="section-content fade-in">
        <h2>Stock Performance (1Y)</h2>
        <div className="chart-container card">
          {formattedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Line type="monotone" dataKey="close" stroke="#38bdf8" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p>No historical data available.</p>
          )}
        </div>
      </div>
    );
  };

  const renderSWOT = () => (
    <div className="section-content fade-in">
      <h2>SWOT Analysis</h2>
      <div className="swot-grid">
        <div className="swot-quadrant card strengths">
          <h3>Strengths</h3>
          <ul>{swotData?.strengths?.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </div>
        <div className="swot-quadrant card weaknesses">
          <h3>Weaknesses</h3>
          <ul>{swotData?.weaknesses?.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </div>
        <div className="swot-quadrant card opportunities">
          <h3>Opportunities</h3>
          <ul>{swotData?.opportunities?.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </div>
        <div className="swot-quadrant card threats">
          <h3>Threats</h3>
          <ul>{swotData?.threats?.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </div>
      </div>
    </div>
  );

  const renderRiskAssessment = () => {
    const score = riskData?.overallRiskScore || 0;
    
    return (
      <div className="section-content fade-in">
        <h2>Risk Assessment</h2>
        
        <div className="risk-score-container card">
          <div className="risk-score-label">Overall Risk Score</div>
          <div className="risk-score-value">
            <span className={`risk-badge score-${Math.ceil(score/3)}`}>{score}</span>
            <span className="risk-out-of">/ 10</span>
          </div>
        </div>

        <div className="risk-factors">
          <h3>Key Risk Factors</h3>
          {riskData?.riskFactors?.map((risk, idx) => (
            <div key={idx} className="risk-factor-card card">
              <div className="risk-factor-header">
                <h4>{risk.factor}</h4>
                <span className={`badge severity-${risk.severity}`}>{risk.severity.toUpperCase()}</span>
              </div>
              <p>{risk.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReasoningLogs = () => (
    <div className="section-content fade-in">
      <h2>AI Reasoning Logs</h2>
      <div className="logs-container card">
        <div className="log-group">
          <h3>Financial Health Analysis</h3>
          <p>{analysisData?.financialHealth || 'N/A'}</p>
        </div>
        <div className="log-group">
          <h3>Market Sentiment</h3>
          <p>{analysisData?.marketSentiment || 'N/A'}</p>
        </div>
      </div>
    </div>
  );

  const renderFinalDecision = () => (
    <div className="section-content fade-in">
      <div className="card result-card">
        <h2>
          Final Decision
          <span className={`badge ${finalDecision.decision.toLowerCase()}`}>
            {finalDecision.decision}
          </span>
        </h2>
        
        <div className="score">
          {finalDecision.confidence}%
          <span>Confidence</span>
        </div>

        <div className="section-title">Strategic Reasoning</div>
        <p className="reasoning">{finalDecision.reasoning}</p>

        <div className="section-title">Key Deciding Factors</div>
        <ul className="factors-list">
          {finalDecision.keyFactors.map((factor, idx) => (
            <li key={idx}>{factor}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'financialHealth', label: 'Financial Health' },
    { id: 'stockPerformance', label: 'Stock Performance' },
    { id: 'swot', label: 'SWOT Analysis' },
    { id: 'risk', label: 'Risk Assessment' },
    { id: 'logs', label: 'AI Reasoning Logs' },
    { id: 'decision', label: 'Final Decision' }
  ];

  return (
    <>
      <div className="header">
        <h1>AI Investment Research Agent</h1>
        <p>Enter a company name for an instant, AI-driven investment analysis.</p>
      </div>

      <form className="search-box" onSubmit={handleSearch}>
        <input 
          type="text" 
          placeholder="e.g. Tesla, Apple, OpenAI" 
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !company.trim()}>
          {loading ? 'Analyzing...' : 'Research'}
        </button>
      </form>

      {finalDecision && (
        <div className="status-badge-container fade-in">
          {isCached ? (
            <span className="status-badge cached">⚡ Instant result (cached)</span>
          ) : (
            <span className="status-badge live">🔴 Live analysis</span>
          )}
        </div>
      )}

      {error && (
        <div className="error-message fade-in card">
          <h3>Analysis Failed</h3>
          <p>{error}</p>
          <button 
            className="try-again-btn"
            onClick={() => {
              setError(null);
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {(loading || completedNodes.length > 0) && !finalDecision && !error && (
        <div className="card">
          <ul className="progress-list">
            {allNodes.map(node => {
              const isDone = completedNodes.includes(node);
              const isActive = currentNode === node;
              
              if (!isDone && !isActive && !loading) return null;

              return (
                <li key={node} className={`progress-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                  {isDone ? (
                    <span className="check-icon">✓</span>
                  ) : isActive ? (
                    <div className="spinner"></div>
                  ) : (
                    <span style={{ color: '#475569' }}>○</span>
                  )}
                  <span style={{ opacity: isDone ? 1 : isActive ? 0.9 : 0.5 }}>
                    {getStatusText(node)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {finalDecision && (
        <div className="report-container fade-in">
          <div className="sidebar">
            <nav className="sidebar-nav">
              {TABS.map(tab => (
                <button 
                  key={tab.id}
                  className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="main-content">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'financialHealth' && renderFinancialHealth()}
            {activeTab === 'stockPerformance' && renderStockPerformance()}
            {activeTab === 'swot' && renderSWOT()}
            {activeTab === 'risk' && renderRiskAssessment()}
            {activeTab === 'logs' && renderReasoningLogs()}
            {activeTab === 'decision' && renderFinalDecision()}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
