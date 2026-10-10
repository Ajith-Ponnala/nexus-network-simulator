import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Network, 
  Route, 
  Layers, 
  ShieldAlert, 
  Play,
  BookOpen
} from 'lucide-react';
import NetworkGraph from './components/NetworkGraph/NetworkGraph';
import TopologyEditor from './components/TopologyEditor/TopologyEditor';
import FramingPanel from './components/SimulationPanel/FramingPanel';
import CRCPanel from './components/SimulationPanel/CRCPanel';
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
  
  const simEdges = currentEvent?.type === 'TRANSMIT' ? [`${[currentEvent.from, currentEvent.to].sort().join('-')}`] : [];
  const activeEdges = routeResult?.edges || simEdges;

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

  const renderSimulation = () => (
    <div className="fade-in split-layout">
      <div className="split-main" style={{ gap: '1.5rem' }}>
        <div className="surface" style={{ flex: 1.5 }}>
          <div className="surface-header">
            <span className="surface-title"><Network size={18}/> Active Transmission</span>
          </div>
          <div className="surface-body" style={{ padding: 0, height: '100%', minHeight: '300px' }}>
            <NetworkGraph 
              nodes={nodes} 
              edges={edges} 
              highlightedEdges={activeEdges} 
              sourceNode={sourceNode}
              destNode={destNode}
              currentEvent={currentEvent}
              onNodePositionChange={topology.updateNodePosition}
            />
          </div>
        </div>
        <div className="surface" style={{ flex: 1 }}>
          <div className="surface-header">
            <span className="surface-title"><Activity size={18}/> Simulation Event Log</span>
          </div>
          <div className="surface-body" style={{ height: '100%', overflowY: 'auto', padding: 0 }}>
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

  const renderSandbox = () => (
    <div className="fade-in split-layout">
      <div className="split-main" style={{ gap: '1.5rem', overflowY: 'auto', paddingRight: '1rem' }}>
        <div className="edu-notice">
          <h4>Protocol Sandbox</h4>
          <p>Explore the mathematical mechanics of Framing and CRC in isolation before they are applied to the physical wire.</p>
        </div>
        <FramingPanel />
        <CRCPanel />
      </div>
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
