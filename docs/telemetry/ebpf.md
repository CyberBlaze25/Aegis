# eBPF (Extended Berkeley Packer Filter)
eBPF allows us to run small programs inside the kernel without changing it.
We will use the following for gathering telemetry data:
- Rust + Aya => userspace daemons.
- C => eBPF bytecode(AKA inside the kernel).

This setup will increase the speed at which we can monitor the kernel of each and every cpu connected to the network.

## What hooks to check
- Since we need to intercept the syscalls before the CPU executes them
- we will hook into the "execve" and the "connect" syscalls.

## Where to put C and Rust
### C
    - We want our packet filter to run inside the kernel.
    - It will capture the PID, UID and the arguments for every new process.
### Rust
    - This will run in the userspace.
    - It will recive the data from the kernel
    - We will use the Aya lib


## Run Cycle
- We hook specific events (like syscalls)
- Every time a process tries to us that event the eBPF code runs first.
- Our eBPF code(written in C) will send the data to the userspace Rust app via Ring Buffer
- Rust app runs the deterministic algorithm and calculate the Suspicion Score, if S >=7 then Micro Segmentation

# One package
Since we want to have a single client app, we have to embed the compiled
C bytecode into the Rust binary and make the Rust app load it into the kernel.
