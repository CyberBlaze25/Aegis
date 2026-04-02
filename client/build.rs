use std::env;
use std::path::PathBuf;
use std::process::Command;

fn main() {
    let bpf_src = "ebpf/aegis_ebpf.c";
    println!("cargo:rerun-if-changed={}", bpf_src);

    // 1. Grab Cargo's designated output directory
    let out_dir = env::var("OUT_DIR").unwrap();
    let bpf_obj = PathBuf::from(out_dir).join("aegis_ebpf.o");

    let status = Command::new("clang")
        .args(&[
            "-O2",
            "-g",
            "-target", "bpfel",
            "-mcpu=v3",
            "-c", bpf_src,
            // 2. Output to the out_dir instead of the source tree
            "-o", bpf_obj.to_str().unwrap(), 
        ])
        .status()
        .expect("Failed to execute clang for eBPF compilation");

    if !status.success() {
        panic!("eBPF compilation failed! Check your clang version and vmlinux.h");
    }
}
