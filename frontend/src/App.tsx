
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">L</span>
          <span>LinkLogic</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#workspace">Workspace</a>
          <a href="#about">About</a>
        </nav>

        <span className="status">
          <span className="status-dot" />
          Frontend online
        </span>
      </header>

      <main>
        <section className="hero" id="about">
          <div className="eyebrow">
            NETWORKING LEARNING LAB
          </div>

          <h1>
            Design networks.
            <br />
            <span>Diagnose smarter.</span>
          </h1>

          <p className="hero-copy">
            Build network topologies, test connectivity, and learn to
            troubleshoot common networking problems in an interactive lab.
          </p>

          <div className="hero-actions">
            <a className="primary-button" href="#workspace">
              Explore the workspace <span aria-hidden="true">→</span>
            </a>
            <a className="secondary-button" href="#features">
              Discover features
            </a>
          </div>

          <div className="hero-note">
            <span className="status-dot" />
            Your virtual networking lab starts here
          </div>
        </section>

        <section className="workspace" id="workspace">
          <div className="section-heading">
            <div>
              <p className="section-kicker">YOUR LAB</p>
              <h2>Network workspace</h2>
            </div>
            <span className="preview-label">INITIAL PREVIEW</span>
          </div>

          <div className="workspace-grid">
            <article className="panel topology-panel">
              <div className="panel-heading">
                <h3>Topology canvas</h3>
                <span className="small-label">Preview</span>
              </div>

              <div className="topology-canvas">
                <div className="network-line line-one" />
                <div className="network-line line-two" />
                <div className="network-line line-three" />

                <div className="device device-pc">
                  <span className="device-icon">PC</span>
                  <strong>PC-01</strong>
                  <small>192.168.1.10</small>
                </div>

                <div className="device device-switch">
                  <span className="device-icon">SW</span>
                  <strong>Switch-01</strong>
                  <small>Layer 2</small>
                </div>

                <div className="device device-router">
                  <span className="device-icon">R</span>
                  <strong>Router-01</strong>
                  <small>Gateway</small>
                </div>
              </div>

              <p className="panel-footnote">
                Static preview only — interactive topology editing comes later.
              </p>
            </article>

            <article className="panel diagnostics-panel" id="features">
              <div className="panel-heading">
                <h3>Diagnostic overview</h3>
                <span className="small-label">Demo data</span>
              </div>

              <div className="metric">
                <div>
                  <span className="metric-label">Network devices</span>
                  <strong>03</strong>
                </div>
                <span className="metric-icon">◇</span>
              </div>

              <div className="metric">
                <div>
                  <span className="metric-label">Connectivity tests</span>
                  <strong>00</strong>
                </div>
                <span className="metric-icon">↗</span>
              </div>

              <div className="metric">
                <div>
                  <span className="metric-label">Detected issues</span>
                  <strong>00</strong>
                </div>
                <span className="metric-icon">!</span>
              </div>

              <div className="info-banner">
                <strong>Ready to configure</strong>
                <p>
                  Add network devices and run connectivity checks when the
                  simulator is implemented.
                </p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>LinkLogic · Network Design &amp; Troubleshooting Simulator</span>
        <span>Day 02 · Frontend foundation</span>
      </footer>
    </div>
  );
}

export default App;
