use std::collections::HashMap;
use serde::Serialize;
use tokio::sync::mpsc;
pub(crate) mod tracker;

#[repr(C, packed)]
#[derive(Clone, Copy, Debug)]
pub(crate) struct Event {
    pub event_type: u8,
    pub pid: u32,
    pub ppid: u32,
    pub uid: u32,
    pub dest_ip: u32,
    pub dest_port: u16,
    pub pad: [u8; 2],
    pub comm: [u8; 16],
    pub filename: [u8; 64],
}

pub(crate) struct Tracker {
    pub scores: HashMap<u32, f32>, // Keeping this if you want local caching later
    pub tx: mpsc::Sender<TelemetryPayload>,
}

#[derive(Serialize, Debug, Clone)]
pub(crate) struct TelemetryPayload {
    pub event_type: u8,
    pub pid: u32,
    pub ppid: u32,
    pub uid: u32,
    pub comm: String,
    pub filename: String,
    pub dest_ip: String,
    pub dest_port: u16,
}
