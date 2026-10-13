# NEXUS — Network Systems Lab
### Interactive Computer Networks Protocol Simulator & Pedagogical Workbench

> **Repository**: [https://github.com/Ajith-Ponnala/nexus-network-simulator.git](https://github.com/Ajith-Ponnala/nexus-network-simulator.git)  
> **Course Domain**: Computer Networks (CBP / Systems Lab)  
> **Core Focus**: Layer 2 (Data Link), Layer 3 (Network), and Layer 1 (Physical/CRC) Protocol Mechanics

---

## 1. Project Overview & Objective

**NEXUS** is an interactive, browser-based network simulation platform designed to bridge the gap between abstract computer networking theory and hands-on execution. 

Instead of showing high-level animations, NEXUS computes the real binary mathematics at every network layer:
1. **Physical & Link Layer Framing**: Encapsulating raw payloads via Character Count, Byte Stuffing, and Bit Stuffing.
2. **Error Detection**: Modulo-2 binary polynomial division (CRC) over frame bits on every link.
3. **Routing**: Real-time Shortest-Path calculation via Dijkstra’s Algorithm across dynamic, editable network topologies.
4. **End-to-End Multi-Hop Transmission**: Network-layer payload fragmentation/chunking, hop-by-hop frame transmission, wire noise simulation, receiver verification, and message reassembly.

---

## 2. Technology Stack & Architecture

| Layer / Concern | Technology | Purpose |
| :--- | :--- | :--- |
| **UI Framework** | **React 19** | Functional components with hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, `useLayoutEffect`) |
| **Bundler & Dev Server** | **Vite 8** | Sub-millisecond HMR and optimized production bundling |
| **Styling & Design System** | **Vanilla CSS (Design Tokens)** | Custom dark technical aesthetic, glassmorphism, responsive grid layouts, custom SVG filter glows (`#glow`, `#destGlow`) |
| **Iconography** | **Lucide React** | Consistent, modern developer-tool icon library |
| **Testing Suite** | **Vitest** | Automated unit test runner validating all core mathematical algorithms (45 tests passing) |
| **Graphics Engine** | **SVG & SVG DOM API** | Vector rendering for routers, weighted edges, packet markers, and coordinate translation (`getScreenCTM`) |

### Source Directory Architecture

```text
cn-cbp/
├── src/
│   ├── core/
│   │   ├── algorithms/
│   │   │   ├── dijkstra.js        # Dijkstra's shortest path routing implementation
│   │   │   ├── framing.js         # Char count, Byte stuffing (0x7E/0x7D), Bit stuffing (HDLC)
│   │   │   └── crc.js             # Modulo-2 polynomial division, codeword generation & verification
│   │   └── models/
│   │       └── graph.js           # TopologyModel: nodes, weighted edges, adjacency list
│   ├── simulation/
│   │   └── transmission.js        # Multi-hop orchestration engine (chunking, framing, CRC, noise, reassembly)
│   ├── hooks/
│   │   └── useTopology.js         # Centralized state hook for network topology
│   ├── components/
│   │   ├── NetworkGraph/          # Drag-and-drop SVG canvas with auto-fitting viewBox
│   │   ├── TopologyEditor/        # Node/edge creation, cost updating, Dijkstra path execution
│   │   ├── ProtocolSandbox/       # Unified sandbox for isolated Framing and CRC experimentation
│   │   └── SimulationPanel/       # Transmission controls, presets, HUD, and categorized event logs
│   ├── App.jsx                    # Main application shell and tab-based routing
│   └── index.css                  # Complete design system tokens and responsive stylesheet
├── tests/                         # 45 automated unit tests for all mathematical modules
├── package.json
└── vite.config.js
```

---

## 3. Core Modules & Features

### Module 1: Network Topology Editor
- **Freely Draggable Router Canvas**: Routers are fully draggable across the SVG canvas without snapping constraints. Router coordinates persist in state.
- **Dynamic Auto-Fitting ViewBox**: The SVG canvas automatically calculates its bounding box (`preserveAspectRatio="xMidYMid meet"`), ensuring all nodes (**R1 through R6**) and their badges remain 100% visible on any screen size.
- **Interactive Link Failure (ON / OFF Toggle)**: Click any link weight badge on the canvas to toggle that link between **ON** (active) and **OFF** (severed). Dijkstra’s algorithm immediately recalculates alternate paths.
- **Visual Router Badging**:
  - **Source Router**: Highlighted in vibrant emerald green with `SRC` badge and dashed pulse ring.
  - **Destination Router**: Highlighted in bright tangerine orange with `DEST` badge and concentric radar pulse animation.
- **Dijkstra Shortest Path Computation**: Calculates the optimal path and total cumulative cost, highlighting the routed path in glowing electric blue.

---

### Module 2: Protocol Sandbox (Framing & CRC Workbenches)
A dedicated lab tab for isolated algorithmic inspection without needing a full network graph:
- **Framing Playground**:
  - **Character Count**: Appends total frame length byte to the payload.
  - **Byte Stuffing**: Inserts Flag byte `0x7E` and Escape byte `0x7D` when payload data contains reserved characters.
  - **Bit Stuffing (HDLC)**: Performs zero-bit insertion after any sequence of five consecutive `1`s (`0111110`).
  - Displays side-by-side encoded frame vs. decoded reconstructed payload.
- **CRC Division Workbench**:
  - **Modulo-2 Binary Division**: Executes binary polynomial division with step-by-step bitwise XOR operations.
  - **Standard Polynomial Presets**: CRC-3 (`1011`), CRC-4 (`10011`), CRC-8 (`100000111`), CRC-16-CCITT, and CRC-32, or custom binary generators.
  - **Bit Error Injection**: Allows flipping any bit in the codeword to prove that the remainder becomes non-zero.
  - **Bitwise XOR Trace Table**: Collapsible step-by-step division trace showing each shift and XOR subtraction.

---

### Module 3: Transmission Simulator (End-to-End Multi-Hop)
Simulates how real networks transmit data across multiple intermediate routers:
- **Network Layer Packet Fragmentation (Chunking)**: Divides large message payloads into smaller packets according to the configured `Max Payload Size`.
- **Hop-by-Hop Link Framing & CRC Protection**: Every individual link encapsulates the packet in frames and appends a freshly calculated CRC checksum.
- **Live In-Flight HUD Banner**: Displays the exact physical link being traversed (`[R1] ➔ [R2]`), current packet index, and channel noise status (`✓ Clean Link` vs `⚠ Bit Inversion`).
- **Physical Channel Noise Simulation**: Inverts a designated bit on a specific hop to demonstrate real-time packet drops at receiving routers.
- **Router Event Alerts on Canvas**:
  - `⚠ CRC FAIL · DROPPED` (crimson badge on receiving router upon non-zero CRC remainder).
  - `✓ CRC VALIDATED` (emerald badge when remainder equals zero).
  - `🎉 PKT DELIVERED` (purple badge upon reaching the final destination).
- **1-Click Guided Scenarios (Presets)**:
  1. *Clean Transmission (`R1 → R6`)*: Multi-hop delivery with CRC validation at every hop.
  2. *CRC Catches Noise (Drop at `R2`)*: Bit flipped on wire; Router `R2` mathematically proves corruption and discards the frame.
  3. *Multi-Packet Chunking*: Long message broken into multiple packets and reconstructed at destination.
  4. *Flag Collision Escaping*: Payloads containing `0x7E` and `0x7D` trigger byte stuffing escapes across the wire.
- **Full Playback Controls**:
  - **Play / Pause / Replay** primary toggle.
  - **Step Forward** and **Step Backward** buttons.
  - **Timeline Progress Scrubber**: Range slider to jump directly to any step in the multi-hop transmission.
  - **Speed Selector**: Toggle between `0.5x` (slow motion), `1.0x` (normal), and `2.0x` (rapid replay).
- **Categorized Event Log**:
  - Filter tabs: **`All`**, **`Hops`**, **`Drops & Errors`**, **`Verified`**.
  - Codeword display with glowing red chip highlighting the exact flipped bit on the wire.
  - Auto-scrolls to the newest event with a **"Jump to Latest"** button.

---

## 4. How to Use & Run the Project

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **Git**

### Installation & Launch

```bash
# 1. Clone the repository
git clone https://github.com/Ajith-Ponnala/nexus-network-simulator.git

# 2. Navigate to project root
cd nexus-network-simulator

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

### Running Verification Tests

```bash
# Run all 45 automated unit tests
npm run test

# Run production build validation
npm run build
```

---

## 5. Walkthrough for Teammates & Presentations

### Demonstration Flow 1: Network Topology & Dynamic Routing
1. Click **Network Topology** in the sidebar.
2. Select **Source: R1** and **Destination: R6**.
3. Click **Calculate Shortest Path**. The path `R1 ➔ R2 ➔ R4 ➔ R6` (Cost: 10) lights up in blue.
4. Click on the link between **R2 and R4** on the canvas. The link turns **OFF** (red dashed line with `OFF` badge).
5. Click **Calculate Shortest Path** again. Dijkstra immediately finds the alternate path through **R1 ➔ R3 ➔ R5 ➔ R6**.
6. Click and drag router **R3** to a new position; notice the links and calculations update smoothly.

### Demonstration Flow 2: Framing & CRC in the Protocol Sandbox
1. Click **Protocol Sandbox** in the sidebar.
2. Under **Framing Playground**, enter a message containing `FLAG~DATA}TEST`.
3. Select **Byte Stuffing**; show teammates how `0x7D 0x5E` escape sequences are generated.
4. Switch to the **CRC Playground** tab.
5. Enter data bits `11010011101100` and CRC Generator `1011`.
6. Click **Generate CRC Codeword**; observe the 3 appended parity bits ($r = \text{poly length} - 1$).
7. Expand the **Bitwise XOR Trace Table** to walk through the binary long-division math step-by-step.
8. Click **Corrupt Codeword** to flip a bit; verify that the receiver flags a non-zero remainder and reports **CRC FAILED**.

### Demonstration Flow 3: End-to-End Transmission Simulator
1. Click **Transmission Simulator** in the sidebar.
2. Under **Guided Scenarios**, click **▶ Run** on **CRC Catches Noise (Drop at R2)**.
3. Watch the animated packet travel from `R1` to `R2`.
4. As the packet reaches `R2`, notice:
   - The live In-Flight HUD displays `⚠ Noise: Bit #3 Inverted`.
   - Router `R2` displays a crimson `⚠ CRC FAIL · DROPPED` tag.
   - The Event Log highlights bit `#3` in red.
   - The simulation concludes with the outcome: *"Packet Dropped (Integrity Check Failed)"*.
5. Click **▶ Run** on **Clean Transmission (R1 → R6)** to see a multi-hop transmission succeed across all hops with 100% payload reassembly.
6. Use the **Timeline Scrubber** or **Step Backward / Forward** buttons to inspect any intermediate state at your own pace.
