import { useState } from 'react';
import './App.css';
import { UploadPanel } from './components/UploadPanel';
import { QueryPanel } from './components/QueryPanel';
import { MapViewer } from './components/MapViewer';
import { ResultPanel } from './components/ResultPanel';
import { EvidencePanel } from './components/EvidencePanel';
import { AuditModal } from './components/AuditModal';
import { GodsEyeExplorer } from './components/GodsEyeExplorer';
import { ChatBot } from './components/ChatBot';


function App() {
  const [image1Id, setImage1Id] = useState<string | null>('demo-optical');
  const [image2Id, setImage2Id] = useState<string | null>('demo-sar');
  const [activeRoi, setActiveRoi] = useState<any | null>(null);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [showGlobe, setShowGlobe] = useState(false);

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__brand">
          <h1 className="app-header__logo">
            Sat<span className="app-header__logo-accent">Query</span> AI
          </h1>
          <span className="app-header__tag">SIH26167 • ISRO</span>
        </div>
        <div className="app-header__actions flex gap-2">
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => setShowGlobe(true)}
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
          >
            🌍 3D Earth Explorer (TEE)
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setShowAudit(true)}
          >
            Audit Trail
          </button>
        </div>
      </header>


      {/* Left Sidebar */}
      <aside className="app-layout__sidebar-left">
        <UploadPanel
          image1Id={image1Id}
          image2Id={image2Id}
          onUpload1={(id) => {
            setImage1Id(id);
            setActiveRoi(null);
            setQueryResult(null);
          }}
          onUpload2={(id) => {
            setImage2Id(id);
            setQueryResult(null);
          }}
        />
        <QueryPanel
          image1Id={image1Id}
          image2Id={image2Id}
          activeRoi={activeRoi}
          onClearRoi={() => setActiveRoi(null)}
          onQueryResult={setQueryResult}
        />
      </aside>

      {/* Main View */}
      <main className="app-layout__main">
        <MapViewer
          image1Id={image1Id}
          image2Id={image2Id}
          queryResult={queryResult}
          activeRoi={activeRoi}
          onRoiChange={setActiveRoi}
        />
      </main>

      {/* Right Sidebar */}
      <aside className="app-layout__sidebar-right">
        <ResultPanel result={queryResult} />
      </aside>

      {/* Bottom View */}
      <section className="app-layout__bottom">
        <EvidencePanel queryResult={queryResult} />
      </section>

      {/* Modals & Overlays */}
      {showAudit && <AuditModal onClose={() => setShowAudit(false)} />}
      {showGlobe && (
        <GodsEyeExplorer
          isOpen={showGlobe}
          onClose={() => setShowGlobe(false)}
          onSelectImagery={(id) => {
            setImage1Id(id);
            setActiveRoi(null);
            setQueryResult(null);
          }}
          onCompareImagery={(id1, id2) => {
            setImage1Id(id1);
            setImage2Id(id2);
            setActiveRoi(null);
            setQueryResult(null);
          }}
        />
      )}
      <ChatBot activeImageId={image1Id} />
    </div>
  );
}


export default App;
