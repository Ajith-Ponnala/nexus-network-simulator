# NEXUS — Network Systems Lab
### Interactive Computer Networks Protocol Simulator & Pedagogical Workbench

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Tests-45%20Passed-10B981?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> An educational, full-stack network simulation platform designed to demonstrate the mathematical and programmatic fundamentals of Computer Networking: **Layer 3 Dijkstra Routing**, **Layer 2 Framing**, **CRC Error Detection**, and **End-to-End Multi-Hop Packet Transmission**.

---

## 📌 Table of Contents
1. [Product Overview](#-product-overview)
2. [Key Modules & Features](#-key-modules--features)
   - [1. Physical Topology Editor & Dijkstra Routing](#1-physical-topology-editor--dijkstra-routing)
   - [2. Protocol Sandbox (Framing & CRC Workbenches)](#2-protocol-sandbox-framing--crc-workbenches)
   - [3. Transmission Simulator (End-to-End Orchestrator)](#3-transmission-simulator-end-to-end-orchestrator)
3. [Mathematical & Algorithmic Foundations](#-mathematical--algorithmic-foundations)
4. [Technology Stack](#-technology-stack)
5. [Getting Started (Run Locally)](#-getting-started-run-locally)
6. [Automated Testing Suite](#-automated-testing-suite)
7. [Repository File Structure](#-repository-file-structure)
8. [Demonstration Guide for Teams](#-demonstration-guide-for-teams)

---

## 🚀 Product Overview

**NEXUS** transforms abstract textbook networking concepts into hands-on, verifiable simulations. Rather than presenting generic visual animations, the simulator executes true mathematical algorithms:

- **Network Layer**: Computes Dijkstra shortest paths on weighted graphs and fragments large messages into network packets based on Max Payload Size.
- **Data Link Layer**: Encapsulates packets hop-by-hop using Character Count, Byte Stuffing, or Bit Stuffing (HDLC).
- **Physical Channel / CRC**: Performs modulo-2 binary polynomial long-division over bitstreams, injects controlled channel bit errors, and demonstrates receiver frame rejection.
- **Reassembly Engine**: Reconstructs payloads at the destination router and validates end-to-end message integrity.

---

## ⚡ Key Modules & Features

### 1. Physical Topology Editor & Dijkstra Routing
- **Freely Draggable Routers**: Move routers (`R1`–`R6` + custom nodes) anywhere on the canvas with smooth coordinate persistence.
- **Auto-Fitting Responsive ViewBox**: SVG canvas dynamically scales (`preserveAspectRatio="xMidYMid meet"`) so every router and edge is 100% visible across any screen resolution.
- **Interactive Link Failure (1-Click On/Off)**: Click any link weight badge to sever or reconnect a link. The routing engine recalculates alternate paths in real time.
- **Visual Router Roles**:
  - **Source Router**: Highlighted in emerald green with `SRC` badge and dashed pulse ring.
  - **Destination Router**: Highlighted in vibrant tangerine with `DEST` badge and concentric radar pulse animation.
- **Dijkstra Calculation**: Instantly computes optimal route, cumulative metric cost, and illuminates the path in glowing electric blue.

### 2. Protocol Sandbox (Framing & CRC Workbenches)
An isolated lab environment for inspecting Link and Physical layer algorithms independently:
- **Framing Playground**:
  - **Character Count**: Appends total frame byte count.
  - **Byte Stuffing**: Inserts flag bytes (`0x7E`) and escape bytes (`0x7D`) with automatic escape sequences for colliding payload bytes.
  - **Bit Stuffing (HDLC)**: Performs zero-bit insertion after any sequence of five consecutive `1`s (`0111110`).
  - Side-by-side encoded frame vs. decoded reconstructed payload comparison.
- **CRC Division Workbench**:
  - **Modulo-2 Binary Division**: Step-by-step polynomial division with bitwise XOR subtractions.
  - **Standard Generator Presets**: CRC-3 (`1011`), CRC-4 (`10011`), CRC-8 (`100000111`), CRC-16-CCITT, CRC-32, or custom binary polynomials.
  - **Controlled Bit Corruption**: Flip any bit in the codeword to prove that the remainder becomes non-zero ($R(x) \ne 0$).
  - **Step-by-Step XOR Trace Table**: Detailed view of each shift and XOR operation.

### 3. Transmission Simulator (End-to-End Orchestrator)
Orchestrates multi-hop transmissions across the network topology:
- **Live In-Flight Transmission HUD**: Heads-up display positioned directly above the canvas showing:
  - Active hop route (`[R1] ➔ [R2]`)
  - Packet index tracker (`Packet 1 of 3`)
  - Physical wire status (`✓ Clean Link` vs `⚠ Inverted Bit`)
  - Educational explanation of the active link action.
- **1-Click Guided Scenarios (Educational Presets)**:
  1. *Clean Transmission (`R1 → R6`)*: Multi-hop delivery with CRC validation at every router.
  2. *CRC Catches Noise (Drop at `R2`)*: Inverts 1 bit on wire; Router `R2` detects non-zero remainder and drops the frame.
  3. *Multi-Packet Chunking*: Breaks a long payload into sequential packets and reassembles them at the destination.
  4. *Flag Collision Escaping*: Demonstrates byte stuffing when payload bytes collide with framing delimiters.
- **Full Playback Controls**:
  - Play / Pause / Replay toggle.
  - Step Forward and Step Backward buttons.
  - Interactive Timeline Scrubber (jump to any simulation event).
  - Speed Selector (`0.5x`, `1.0x`, `2.0x`).
- **Canvas Alert Badges**:
  - `⚠ CRC FAIL · DROPPED` (crimson badge on receiving router upon non-zero CRC remainder).
  - `✓ CRC VALIDATED` (emerald badge on verified checksum).
  - `🎉 PKT DELIVERED` (purple badge upon reaching destination).
- **Categorized Event Log**:
  - Filter tabs: **`All`**, **`Hops`**, **`Drops & Errors`**, **`Verified`**.
  - Codeword display with glowing red chip highlighting the exact flipped bit.
  - Auto-scrolls to the newest event with a **"Jump to Latest"** button.
- **Outcome Summary Card**: Displays final reassembled payload string and delivery verification status.

---

## 🧮 Mathematical & Algorithmic Foundations

### 1. Dijkstra's Shortest Path Algorithm
Given graph $G = (V, E)$ with non-negative edge costs $w(u, v)$:
$$\text{dist}[v] = \min(\text{dist}[v], \text{dist}[u] + w(u, v))$$
Implemented with priority traversal, path reconstruction, and cycle prevention.

### 2. Modulo-2 Binary Polynomial Division (CRC)
Let $D(x)$ be the data bitstream of length $k$ and $G(x)$ be a generator polynomial of degree $r$:
1. Multiply $D(x)$ by $x^r$ (append $r$ zeros to data bits).
2. Divide $D(x) \cdot x^r$ by $G(x)$ using modulo-2 arithmetic (bitwise XOR without borrow/carry).
3. The resulting remainder $R(x)$ of length $r$ is the Frame Check Sequence (FCS).
4. Transmitted codeword:
$$C(x) = D(x) \cdot x^r \oplus R(x)$$
5. The receiver divides received codeword $C'(x)$ by $G(x)$. If remainder is $0$, the frame is accepted; otherwise, it is dropped.

### 3. Framing Algorithms
- **Byte Stuffing**: Delimited by `FLAG` (`0x7E`). Any occurrence of `FLAG` or `ESC` (`0x7D`) in the data stream is preceded by `ESC` and XORed with `0x20`.
- **Bit Stuffing**: Delimited by flag `01111110`. The sender automatically inserts a `0` after any sequence of five consecutive `1`s. The receiver strips any `0` that immediately follows five consecutive `1`s.

---

## 🛠 Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** | Modern functional components, hooks, high responsiveness |
| **Build Tool & Bundler** | **Vite 8** | Sub-second HMR, optimized production chunks |
| **Styling & CSS** | **Vanilla CSS (Tokens)** | High-performance custom design tokens, dark glassmorphic UI |
| **Icons** | **Lucide React** | Consistent, lightweight technical iconography |
| **Testing** | **Vitest** | Fast automated testing of core algorithmic models |
| **Graphics** | **SVG & SVG DOM API** | Scalable vector graphics with coordinate mapping (`getScreenCTM`) |

---

## 💻 Getting Started (Run Locally)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/Ajith-Ponnala/nexus-network-simulator.git
cd nexus-network-simulator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```

---

## 🧪 Automated Testing Suite

The project includes automated unit test suites covering every algorithmic module.

```bash
npm run test
```

### Test Coverage Summary:
- `tests/crc.test.js`: Modulo-2 division, codeword verification, error detection, invalid generator validation.
- `tests/framing.test.js`: Character count, byte stuffing escape sequences, bit stuffing HDLC patterns.
- `tests/dijkstra.test.js`: Shortest-path routing, unreachable destinations, dynamic weight updates.
- `tests/graph.test.js`: TopologyModel node additions, deletions, edge disabling, adjacency matrices.
- `tests/transmission.test.js`: Multi-hop transmission, packet fragmentation, controlled noise drops, and payload reassembly.

```text
✓ tests/crc.test.js (13 tests)
✓ tests/framing.test.js (11 tests)
✓ tests/graph.test.js (7 tests)
✓ tests/dijkstra.test.js (7 tests)
✓ tests/transmission.test.js (7 tests)

Test Files  5 passed (5)
     Tests  45 passed (45)
```

---

## 📁 Repository File Structure

```text
nexus-network-simulator/
├── src/
│   ├── core/
│   │   ├── algorithms/
│   │   │   ├── dijkstra.js        # Dijkstra routing implementation
│   │   │   ├── framing.js         # Byte stuffing, Bit stuffing, Char count
│   │   │   └── crc.js             # Modulo-2 division & bit error injection
│   │   └── models/
│   │       └── graph.js           # TopologyModel (nodes, edges, weights)
│   ├── simulation/
│   │   └── transmission.js        # Multi-hop orchestration engine
│   ├── hooks/
│   │   └── useTopology.js         # React topology management hook
│   ├── components/
│   │   ├── NetworkGraph/          # Drag-and-drop SVG graph with auto-fitting viewBox
│   │   ├── TopologyEditor/        # Physical network editor & route calculator
│   │   ├── ProtocolSandbox/       # Unified framing & CRC workbench
│   │   └── SimulationPanel/       # Transmission controls, presets, HUD, and logs
│   ├── App.jsx                    # Root component with tab navigation
│   ├── index.css                  # Design system tokens and styles
│   └── main.jsx
├── tests/                         # Automated unit tests
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🎯 Demonstration Guide for Teams

### Demonstration 1: Topology & Link Failure Rerouting
1. Open the **Network Topology** tab.
2. Select **Source: R1** and **Destination: R6**; click **Calculate Shortest Path**.
3. Path `R1 ➔ R2 ➔ R4 ➔ R6` (Cost: 10) illuminates in electric blue.
4. Click the weight badge between **R2 and R4** to turn the link **OFF**.
5. Recalculate; observe Dijkstra dynamically finding the backup path via **R1 ➔ R3 ➔ R5 ➔ R6**.
6. Drag routers on the canvas to demonstrate freely adjustable layout.

### Demonstration 2: Bit-Level CRC Error Detection
1. Open the **Protocol Sandbox** tab and select **CRC Playground**.
2. Enter data `11010011101100` with Generator `1011` (CRC-3).
3. Generate codeword; expand the **Bitwise XOR Trace Table** to walk through the binary long division.
4. Click **Corrupt Codeword** to flip a bit; verify receiver verification flags **CRC FAILED**.

### Demonstration 3: Multi-Hop Transmission & Noise Injection
1. Open the **Transmission Simulator** tab.
2. Under **Guided Scenarios**, click **▶ Run** on **CRC Catches Noise (Drop at R2)**.
3. Observe:
   - Packet animates from `R1` to `R2`.
   - Live In-Flight HUD flags `⚠ Noise: Bit #3 Inverted`.
   - Router `R2` flags `⚠ CRC FAIL · DROPPED`.
   - Event log pinpoints the flipped bit in a glowing red chip.
4. Click **▶ Run** on **Clean Transmission (R1 → R6)** to demonstrate flawless multi-hop delivery and payload reassembly.
5. Use the **Timeline Progress Scrubber** to jump to any step in the multi-hop transmission.

---

## 👥 Authors & Acknowledgments

- **Lead Developer**: Ajith Reddy Ponnala ([@Ajith-Ponnala](https://github.com/Ajith-Ponnala))
- **Course**: Computer Networks Systems & Laboratory (CBP)
- **Institution**: Computer Science & Engineering
