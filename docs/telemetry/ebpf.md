# eBPF 
We will use the following for gathering telemetry data:
- Rust + Aya => userspace daemons.
- C => eBPF bytecode.

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
