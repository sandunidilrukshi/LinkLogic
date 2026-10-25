
import { useCallback, useState } from "react";

import "./App.css";
import Header from "./components/Header";
import StatCard from "./components/StatCard";
import TopologyCanvas from "./components/TopologyCanvas";

export type NetworkDiagnostics = {
  networkDevices: number;
  connectivityTests: number;
  detectedIssues: number;
  lastConnectivityResult: string;
};

function App() {
  const [diagnostics, setDiagnostics] = useState<NetworkDiagnostics>({
    networkDevices: 0,
    connectivityTests: 0,
    detectedIssues: 0,
    lastConnectivityResult: "",
  });

  const handleDiagnosticsChange = useCallback(
    (nextDiagnostics: NetworkDiagnostics) => {
      setDiagnostics(nextDiagnostics);
    },
    []
  );

  return (
    <div className="app">
      <Header />

      <main>
        <section className="hero" id="about">
          <div className="eyebrow">NETWORKING LEARNING LAB</div>

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

            <span className="preview-label">INTERACTIVE LAB</span>
          </div>

          <div className="workspace-grid">
            <article className="panel topology-panel">
              <div className="panel-heading">
                <h3>Topology canvas</h3>
                <span className="small-label">Live workspace</span>
              </div>

              <TopologyCanvas
                onDiagnosticsChange={handleDiagnosticsChange}
              />
            </article>

            <article
              className="panel diagnostics-panel"
              id="features"
            >
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">NETWORK INSIGHTS</p>
                  <h3>Diagnostic overview</h3>
                </div>

                <span className="small-label">Live overview</span>
              </div>

              <div className="diagnostic-cards">
                <StatCard
                  label="Network devices"
                  value={String(diagnostics.networkDevices).padStart(2, "0")}
                  icon="◇"
                />

                <StatCard
                  label="Connectivity tests"
                  value={String(diagnostics.connectivityTests).padStart(2, "0")}
                  icon="↗"
                />

                <StatCard
                  label="Detected issues"
                  value={String(diagnostics.detectedIssues).padStart(2, "0")}
                  icon="!"
                />
              </div>

              <div className="info-banner">
                <strong>
                  {diagnostics.networkDevices === 0
                    ? "Your network is empty"
                    : diagnostics.detectedIssues === 0
                      ? "No tracked issues detected"
                      : "Review your network configuration"}
                </strong>

                <p>
                  {diagnostics.networkDevices} device(s) currently exist in
                  your topology. {diagnostics.detectedIssues} issue finding(s)
                  were detected by the overview checks.
                </p>

                {diagnostics.lastConnectivityResult && (
                  <p role="status">
                    <strong>Last connectivity test:</strong>{" "}
                    {diagnostics.lastConnectivityResult}
                  </p>
                )}
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>
          LinkLogic · Network Design &amp; Troubleshooting Simulator
        </span>
        <span>Interactive networking lab</span>
      </footer>
    </div>
  );
}

export default App;
