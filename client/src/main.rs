use aya::Ebpf;
use aya::maps::RingBuf;
use aya::programs::TracePoint;

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
    // Ebpf::load now sees an 8-byte aligned &[u8]
    let mut bpf = Ebpf::load(&BPF_OBJ.0)?;

    let program: &mut TracePoint = bpf.program_mut("handle_connect").unwrap().try_into()?;
    program.load()?;
    program.attach("syscalls", "sys_enter_connect")?;

    println!("Aegis Sentinel is active. Monitoring network intent...");

    let mut tracker = NewTracker();
    let mut ring_buf = RingBuf::try_from(bpf.map_mut("events").unwrap())?;
    
    // 5. Poll the buffer continuously
    loop {
        // Read available data from the ring buffer
        if let Some(item) = ring_buf.next() {
            // Unpack the raw bytes into our Event struct
            let event_ptr = item.as_ptr() as *const Event;
            let event = unsafe { *event_ptr };
            
            // Pass the event to the Sieve Algorithm
            Evaluate(&mut tracker, &event);
        }
        
        // Yield control back to Tokio to prevent 100% CPU usage
        tokio::task::yield_now().await;
    }
    // 4. Start the Sieve logic here...
    // If S >= 0.7, trigger the "Network Kill-Switch" 
    
    Ok(())
}
