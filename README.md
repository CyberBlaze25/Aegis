# Aegis

Aegis is an advanced, eBPF-powered Intrusion Detection and Prevention System (IDPS) designed for real-time kernel-level monitoring and automated threat response. By combining the speed of eBPF with Rust's safety and Go's scalability, Aegis provides a comprehensive security layer for modern infrastructure.

## Key Features

- **Kernel-Level Monitoring**: Utilizes eBPF (via Aya) to intercept syscalls (e.g., `connect`, `execve`) directly in the Linux kernel.
- **Real-Time Suspicion Scoring**: Implements the **Sieve Algorithm** to evaluate process behavior and network intent in real-time.
- **Automated Mitigation**: Supports **Micro-Segmentation** and a "Network Kill-Switch" to isolate or block high-risk threats (Suspicion Score ≥ 0.7).
- **AI-Powered Threat Intel**: Integrates with **Qdrant Vector Database** and MITRE ATT&CK data for advanced behavioral analysis and threat mapping.
- **Unified Dashboard**: Provides a high-fidelity React-based interface for visualizing attack logs, telemetry streams, and honeypot activity.

## Architecture

Aegis consists of three primary components:

### 1. Aegis Sentinel (Client)
The core agent running on protected nodes.
- **Tech**: Rust, eBPF (C), Aya.
- **Function**: Loads eBPF bytecode into the kernel, processes events in userspace, calculates suspicion scores, and pushes telemetry to the central API.
- **Location**: `/client`

### 2. GenAPI (Backend)
The central intelligence and data ingestion hub.
- **Tech**: Go (Gin), PostgreSQL (pgx), Qdrant, WebSockets.
- **Function**: Ingests telemetry from Sentinels, manages threat intelligence (MITRE), and provides real-time data streams to the dashboard.
- **Location**: `/GenAPI`

### 3. Aegis Dashboard (Frontend)
The management and visualization interface.
- **Tech**: React, Vite, Tailwind CSS, Socket.io.
- **Function**: Visualizes live telemetry, system status, blocked attacks, and provides interactive threat analysis tools.
- **Location**: `/aegis-dashboard`

## Getting Started

### Prerequisites
- **Linux Kernel**: 5.15+ (required for eBPF features).
- **Rust**: Latest stable with `bpf-linker`.
- **Go**: 1.25.0+.
- **Node.js**: 18.0+.
- **Docker**: For running Qdrant and PostgreSQL.

### Installation & Running

#### 1. Start Infrastructure
Use Docker Compose to start the database and vector store:
```bash
cd GenAPI
docker-compose up -d
```

#### 2. Run GenAPI
```bash
cd GenAPI
go run cmd/api/main.go
```

#### 3. Run Aegis Sentinel (Requires Root)
```bash
cd client
cargo build --release
sudo ./target/release/client
```

#### 4. Run Dashboard
```bash
cd aegis-dashboard
npm install
npm run dev
```
