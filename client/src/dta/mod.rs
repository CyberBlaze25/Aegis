// C struct for event_t
// struct event_t {
//     u32 pid;
//     u32 dest_ip;
//     u16 dest_port;
//     u8 _pad[2];
//     char comm[16];
// };

use std::collections::HashMap;
pub(crate) mod tracker;


#[repr(C, packed)]
#[derive(Clone, Copy, Debug)]
pub(crate) struct Event {
    pub pid: u32,
    pub dest_ip: u32,
    pub dest_port: u16,
    pub pad: [u8; 2],
    pub comm: [u8; 16],
}

pub(crate) struct Tracker {
    scores: HashMap<u32, f32>,
}
