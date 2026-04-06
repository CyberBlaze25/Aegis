use std::collections::HashMap;
use std::net::Ipv4Addr;
use aya::util::online_cpus;
use tokio::sync::mpsc;

use crate::dta::{Event, TelemetryPayload, Tracker};


pub(crate) fn NewTracker(tx: mpsc::Sender<TelemetryPayload>) -> Tracker {
    Tracker {
        scores: HashMap::new(),
        tx,
    }
}

pub(crate) fn Evaluate (tracker: &mut Tracker, event: &Event) {
    let pid = event.pid;
    let ppid = event.ppid;
    let uid = event.uid;
    let dest_ip = event.dest_ip;
    let dest_port = event.dest_port;

    let is_system_user = uid <  1000;

    let score = tracker.scores.entry(pid).or_insert(0.5);

    let port = u16::from_be(dest_port);
    let ip = Ipv4Addr::from(u32::from_be(dest_ip));

    let comm_bytes: Vec<u8> = event.comm.iter().take_while(|&&c| c != 0).copied().collect();
    let comm_string = String::from_utf8_lossy(&comm_bytes);

    let mut is_anomalous = false;
    let mut reason = String::new();

    let suspicious_ports = [4444, 1337, 31337, 6667, 4445];
    if suspicious_ports.contains(&port) {
        is_anomalous = true;
        reason = format!("High-Risk Port ({})", port);

        if is_system_user {
            *score += 0.20;
            reason.push_str(" | System-User Context")
        }
    }

    if is_anomalous && ppid < 2 {
        *score += 0.10;
        reason.push_str(" | Orphaned/Root Process Lineage");
    }

    let suspicious_binaries = ["bash", "sh", "nc", "python3", "perl"];
    if suspicious_binaries.contains(&comm_string.as_ref()) && !ip.is_loopback() && !ip.is_private() {
        is_anomalous = true;
        reason = format!("Suspicious Binary ({}) routing externally", comm_string);
    }

    if is_anomalous {
        *score += 0.05; // Trigger the increment 
        
        println!(
            "⚠️ [ANOMALY DETECTED] PID: {} ({}) -> {}:{} | Reason: {} | S-Score: {:.2}",
            pid, comm_string, ip, port, reason, score
        );

        let payload = TelemetryPayload {
            pid,
            ppid,
            uid,
            comm: comm_string.to_string(),
            dest_ip: ip.to_string(),
            dest_port: port,
            is_anomalous,
            reason,
            score: *score as f64,
        };

        if let Err(e) = tracker.tx.try_send(payload) {
            eprintln!("Rate limit hit or channel full: {}", e);
        }

        // 5. The Kill-Switch Threshold [cite: 50]
        if *score >= 0.7 {
            println!("🚨 [KILL-SWITCH] PID {} exceeded S=0.7! Isolating to Honey-Pod...", pid);
            // Here is where you will trigger the Docker SDK to isolate the PID [cite: 50, 64]
        }
    } else {
        // Optional: Log safe traffic silently for the Vector DB handoff
         println!("[Safe] PID {} connected to {}:{}", pid, ip, port);
    }
}
