use aya::Ebpf;
use aya::maps::RingBuf;
use aya::programs::TracePoint;
use tokio::sync::mpsc;
use std::ptr;

mod dta;

use dta::tracker::*;
use crate::dta::Event;

// 1. Force the compiler to align this memory block to 8 bytes
#[repr(C, align(8))]
struct AlignedBpfBytes<const N: usize>([u8; N]);

// 2. Embed the bytes directly into the aligned struct
static BPF_OBJ: AlignedBpfBytes<{ include_bytes!(concat!(env!("OUT_DIR"), "/aegis_ebpf.o")).len() }> = 
    AlignedBpfBytes(*include_bytes!(concat!(env!("OUT_DIR"), "/aegis_ebpf.o")));

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 3. Pass a reference to the inner aligned array (.0) to Aya
    let mut bpf = Ebpf::load(&BPF_OBJ.0)?;

    // ==========================================
    // 🔴 1. ATTACH THE NETWORK SENSOR
    // ==========================================
    let connect_program: &mut TracePoint = bpf.program_mut("handle_connect").unwrap().try_into()?;
    connect_program.load()?;
    connect_program.attach("syscalls", "sys_enter_connect")?;

    // ==========================================
    // 🔴 2. ATTACH THE EXECUTION SENSOR (NEW!)
    // ==========================================
    let execve_program: &mut TracePoint = bpf.program_mut("handle_execve").unwrap().try_into()?;
    execve_program.load()?;
    execve_program.attach("syscalls", "sys_enter_execve")?;

    println!("🛡️ Aegis Sentinel is active. Monitoring Network AND Execution intent...");

    // mpsc sender
    let (tx, mut rx) = tokio::sync::mpsc::channel(100); 
    let mut tracker = NewTracker(tx);

     tokio::spawn(async move {
         let client = reqwest::Client::new();
         let api_url = "http://127.0.0.1:8080/api/v1/telemetry";
         while let Some(payload) = rx.recv().await {
             match client.post(api_url).header("API-KEY", "ASS").json(&payload).send().await {
                 Ok(_) => println!("Telemetry pushed to GenAPI!"),
                 Err(e) => eprintln!("GenAPI connection failed: {}", e),
             }
         }
     });

    let mut ring_buf = RingBuf::try_from(bpf.map_mut("events").unwrap())?;
    
    // 5. Poll the buffer continuously
    loop {
        if let Some(item) = ring_buf.next() {
            let event_ptr = item.as_ptr() as *const Event;
            // Best practice for reading from a packed struct in Rust:
            let event = unsafe { ptr::read_unaligned(event_ptr) }; 
            
            // Pass the event to the Sieve Algorithm
            Evaluate(&mut tracker, &event);
        }
        
        tokio::task::yield_now().await;
    }
    
    Ok(())
}
