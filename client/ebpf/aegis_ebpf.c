#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_core_read.h>

struct event_t {
    u32 pid;
    u32 dest_ip;
    u16 dest_port;
    u8 _pad[2];
    char comm[16];
} __attribute__((packed));

struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 16);
} events SEC(".maps");

// We use the tracepoint for the 'connect' system call entry
SEC("tp/syscalls/sys_enter_connect")
int handle_connect(struct trace_event_raw_sys_enter *ctx) {
    struct event_t *e;
    
    // In a tracepoint, the arguments are stored in the 'args' array.
    // For sys_connect: args[0]=fd, args[1]=sockaddr, args[2]=addrlen
    struct sockaddr_in *addr = (struct sockaddr_in *)ctx->args[1];

    e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e) return 0;

    e->pid = bpf_get_current_pid_tgid() >> 32;
    bpf_get_current_comm(&e->comm, sizeof(e->comm));
    
    // Safely read the IP and Port from the user-space address
    // We use bpf_probe_read_user because the address is in user-space memory
    bpf_probe_read_user(&e->dest_ip, sizeof(e->dest_ip), &addr->sin_addr.s_addr);
    bpf_probe_read_user(&e->dest_port, sizeof(e->dest_port), &addr->sin_port);

    bpf_ringbuf_submit(e, 0);
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
