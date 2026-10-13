import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Network, 
  Route, 
  Layers, 
  ShieldAlert, 
  Play,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Radio,
  Sparkles
} from 'lucide-react';
import NetworkGraph from './components/NetworkGraph/NetworkGraph';
import TopologyEditor from './components/TopologyEditor/TopologyEditor';
import ProtocolSandbox from './components/ProtocolSandbox/ProtocolSandbox';
import TransmissionPanel from './components/SimulationPanel/TransmissionPanel';
import TransmissionLog from './components/SimulationPanel/TransmissionLog';
import { useTopology } from './hooks/useTopology';
import { findShortestPath } from './core/algorithms/dijkstra';

export default function App() {
  const topology = useTopology();
  const { nodes, edges, sourceNode, destNode, getGraph } = topology;

  const [activeView, setActiveView] = useState('overview');
  const [routeResult, setRouteResult] = useState(null);
  
  // Simulation State
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);

  // Hash topology state to prevent coordinate drags from clearing routes
  const topologyHash = Object.keys(nodes).join(',') + '|' + 
                       Object.values(edges).map(e => `${e.id}:${e.cost}:${e.enabled}`).join(',');

  useEffect(() => {
    setRouteResult(null);
  }, [topologyHash, sourceNode, destNode]);

  const calculateRoute = () => {
    if (sourceNode && destNode) {
      const graph = getGraph();
      const result = findShortestPath(graph, sourceNode, destNode);
      setRouteResult(result);
    }
  };
  
  const handleSimulationUpdate = (events, current) => {
    setDisplayedEvents(events);
    setCurrentEvent(current);
  };
  
  const simActiveHop = (currentEvent?.from && currentEvent?.to) 
    ? [`${[currentEvent.from, currentEvent.to].sort().join('-')}`] 
    : [];

  const activeEdges = activeView === 'simulation' 
    ? (simActiveHop.length > 0 ? simActiveHop : (routeResult?.edges || []))
    : (routeResult?.edges || []);

  // View components
  const renderOverview = () => (
    <div className="fade-in">
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--surface-elevated)', borderRadius: '24px', marginBottom: '2rem' }}>
          <Activity size={48} color="var(--accent-primary)" />
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Network Simulation Lab</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '3rem' }}>
          Explore the core mathematical foundations of computer networking. Design physical topologies, trace Shortest-Path routing, and simulate actual Data Link Layer framing and CRC error detection on the wire.
        </p>
        <div className="grid-3" style={{ textAlign: 'left', marginBottom: '3rem' }}>
          <div className="surface surface-body">
            <h3 className="surface-title" style={{ marginBottom: '0.5rem' }}><Route size={20} color="var(--accent-primary)"/> Routing</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Network Layer shortest-path calculations using Dijkstra's Algorithm.</p>
          </div>
          <div className="surface surface-body">
            <h3 className="surface-title" style={{ marginBottom: '0.5rem' }}><Layers size={20} color="var(--accent-secondary)"/> Framing</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Data Link Layer encapsulation techniques including Bit Stuffing.</p>
          </div>
          <div className="surface surface-body">
            <h3 className="surface-title" style={{ marginBottom: '0.5rem' }}><ShieldAlert size={20} color="var(--status-warning)"/> CRC</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Modulo-2 binary polynomial division for error detection.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveView('topology')} style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
          Start Interactive Lab <Play size={18} />
        </button>
      </div>
    </div>
  );

  const renderTopology = () => (
    <div className="fade-in split-layout">
      <div className="split-main surface">
        <div className="surface-header">
          <span className="surface-title"><Network size={18}/> Network Map</span>
        </div>
        <div className="surface-body" style={{ padding: 0, flex: 1, position: 'relative' }}>
          <NetworkGraph 
            nodes={nodes} 
            edges={edges} 
            highlightedEdges={activeEdges} 
            sourceNode={sourceNode}
            destNode={destNode}
            currentEvent={currentEvent}
            onNodePositionChange={topology.updateNodePosition}
            onToggleEdge={topology.toggleEdge}
          />
        </div>
      </div>
      <div className="split-sidebar">
        <div className="edu-notice">
          <h4>Physical Topology</h4>
          <p>Construct the physical network graph. The topology serves as the single source of truth for all routing and transmission simulations.</p>
        </div>
        <div className="surface" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="surface-body">
            <TopologyEditor 
              topology={topology} 
              routeResult={routeResult} 
              onCalculateRoute={calculateRoute} 
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSimulation = () => {
    let actionDesc = "Simulation idle. Select an educational preset or configure parameters on the right and click Generate Simulation.";
    let statusTheme = "idle";

    if (currentEvent) {
      if (currentEvent.type === 'TRANSMIT') {
        actionDesc = `Transmitting Packet #${currentEvent.packetIndex + 1} across physical link ${currentEvent.from} ➔ ${currentEvent.to}`;
        statusTheme = currentEvent.wasCorrupted ? "corrupted" : "transmitting";
      } else if (currentEvent.type === 'DROP') {
        actionDesc = `Frame rejected and dropped at Router ${currentEvent.at} due to CRC checksum mismatch!`;
        statusTheme = "dropped";
      } else if (currentEvent.type === 'HOP_SUCCESS') {
        actionDesc = `CRC verified with zero remainder at Router ${currentEvent.at}. Frame accepted for next hop.`;
        statusTheme = "success";
      } else if (currentEvent.type === 'PACKET_DELIVERED') {
        actionDesc = `Packet #${currentEvent.packetIndex + 1} reached Destination Router ${currentEvent.at}!`;
        statusTheme = "delivered";
      } else if (currentEvent.type === 'PACKET_START') {
        actionDesc = `Beginning transmission of Packet #${currentEvent.packetIndex + 1}.`;
        statusTheme = "info";
      } else if (currentEvent.type === 'HOP_START') {
        actionDesc = `Preparing Link Layer hop ${currentEvent.from} ➔ ${currentEvent.to}.`;
        statusTheme = "info";
      } else if (currentEvent.type === 'SIMULATION_END') {
        actionDesc = currentEvent.message;
        statusTheme = currentEvent.success ? "success" : "dropped";
      } else if (currentEvent.message) {
        actionDesc = currentEvent.message;
        statusTheme = "info";
      }
    }

    return (
      <div className="fade-in split-layout">
        <div className="split-main" style={{ gap: '1.25rem' }}>
          <div className="surface" style={{ flex: 1.6, minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
            <div className="surface-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="surface-title"><Network size={18}/> Active Network Transmission</span>
              {currentEvent && (
                <span className={`sim-badge-tag tag-${statusTheme}`}>
                  {currentEvent.type}
                </span>
              )}
            </div>

            {/* In-Flight HUD Banner */}
            <div className={`transmission-hud-banner theme-${statusTheme}`}>
              <div className="hud-banner-main">
                <div className="hud-status-icon">
                  {statusTheme === 'corrupted' && <ShieldAlert size={20} color="#ef4444" />}
                  {statusTheme === 'dropped' && <XCircle size={20} color="#ef4444" />}
                  {statusTheme === 'transmitting' && <Radio size={20} color="#0ea5e9" className="pulse-icon" />}
                  {statusTheme === 'success' && <CheckCircle2 size={20} color="#10b981" />}
                  {statusTheme === 'delivered' && <Sparkles size={20} color="#8b5cf6" />}
                  {(statusTheme === 'idle' || statusTheme === 'info') && <Activity size={20} color="var(--accent-primary)" />}
                </div>
                <div className="hud-status-info">
                  <div className="hud-status-title">
                    {actionDesc}
                  </div>
                  {currentEvent?.from && currentEvent?.to && (
                    <div className="hud-hop-route">
                      <span className="hop-router src">{currentEvent.from}</span>
                      <ArrowRight size={14} className="hop-arrow" />
                      <span className="hop-router dst">{currentEvent.to}</span>
                      {currentEvent.wasCorrupted ? (
                        <span className="hud-pill noise">⚠ Noise: Bit #{currentEvent.corruptedIndex} Inverted</span>
                      ) : (
                        <span className="hud-pill clean">✓ Physical Link Clean</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="surface-body" style={{ padding: 0, flex: 1, minHeight: '260px', position: 'relative' }}>
              <NetworkGraph 
                nodes={nodes} 
                edges={edges} 
                highlightedEdges={activeEdges} 
                sourceNode={sourceNode}
                destNode={destNode}
                currentEvent={currentEvent}
                onNodePositionChange={topology.updateNodePosition}
                onToggleEdge={topology.toggleEdge}
              />
            </div>
          </div>

          <div className="surface" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="surface-header">
              <span className="surface-title"><Activity size={18}/> Simulation Event Log</span>
            </div>
            <div className="surface-body" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
              <TransmissionLog events={displayedEvents} />
            </div>
          </div>
        </div>

        <div className="split-sidebar">
          <div className="edu-notice">
            <h4>End-to-End Orchestration</h4>
            <p>The network layer chunks the payload into packets. The data link layer frames and protects each packet hop-by-hop.</p>
          </div>
          <div className="surface" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="surface-body">
              <TransmissionPanel topology={topology} onSimulationUpdate={handleSimulationUpdate} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSandbox = () => (
    <div className="fade-in sandbox-container">
      <ProtocolSandbox />
    </div>
  );

  // Navigation Items
  const navItems = [
    { id: 'overview', icon: BookOpen, label: 'Overview' },
    { id: 'topology', icon: Network, label: 'Network Topology' },
    { id: 'sandbox', icon: Layers, label: 'Protocol Sandbox' },
    { id: 'simulation', icon: Play, label: 'Transmission Simulator' }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-text">
            <Activity size={24} color="var(--accent-primary)"/>
            NEXUS<span>LAB</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div 
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <item.icon size={18} />
              {item.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          NEXUS Network Systems Simulator v2.0
        </div>
      </aside>
      
      <main className="main-wrapper">
        <header className="topbar">
          <div className="topbar-title">
            <span style={{ color: 'var(--text-muted)' }}>Workspace /</span> 
            {navItems.find(i => i.id === activeView)?.label || 'Overview'}
          </div>
          <div className="topbar-status">
            <div className="status-dot"></div>
            Simulation Engine Ready
          </div>
        </header>
        
        <div className="content-area">
          {activeView === 'overview' && renderOverview()}
          {activeView === 'topology' && renderTopology()}
          {activeView === 'sandbox' && renderSandbox()}
          {activeView === 'simulation' && renderSimulation()}
        </div>
      </main>
    </div>
  );
}
