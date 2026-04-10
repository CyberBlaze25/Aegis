#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_core_read.h>

// Define Event Types so the Go backend can differentiate
#define EVENT_CONNECT 1
#define EVENT_EXECVE  2

struct event_t {
    u8  event_type;
    u32 pid;
    u32 ppid;
    u32 uid;
    u32 dest_ip;
    u16 dest_port;
    u8  padding[2];
    char comm[16];
    char filename[64];
} __attribute__((packed));

struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 16);
} events SEC(".maps");

SEC("tp/syscalls/sys_enter_connect")
int handle_connect(struct trace_event_raw_sys_enter *ctx) {
    struct event_t *e;
    struct sockaddr_in *addr = (struct sockaddr_in *)ctx->args[1];

    // Short-circuit: We only care about AF_INET (IPv4) connections for now
    short family;
    bpf_probe_read_user(&family, sizeof(family), &addr->sin_family);
    if (family != 2) return 0; // AF_INET is 2

    e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e) return 0;

    e->event_type = EVENT_CONNECT;
    
    u64 pid_tgid = bpf_get_current_pid_tgid();
    e->pid = pid_tgid >> 32;
    e->uid = (u32)bpf_get_current_uid_gid();

    struct task_struct *task = (struct task_struct *)bpf_get_current_task();
    struct task_struct *parent_task = BPF_CORE_READ(task, real_parent);
    e->ppid = BPF_CORE_READ(parent_task, tgid);

    bpf_get_current_comm(&e->comm, sizeof(e->comm));
    
    // Read IP and Port
    bpf_probe_read_user(&e->dest_ip, sizeof(e->dest_ip), &addr->sin_addr.s_addr);
    bpf_probe_read_user(&e->dest_port, sizeof(e->dest_port), &addr->sin_port);

    // Zero out unused fields
    __builtin_memset(&e->filename, 0, sizeof(e->filename));

    bpf_ringbuf_submit(e, 0);
    return 0;
}

// ==========================================
// 2. THE EXECUTION SENSOR (Process Spawning)
// ==========================================
SEC("tp/syscalls/sys_enter_execve")
int handle_execve(struct trace_event_raw_sys_enter *ctx) {
    struct event_t *e;
    const char *filename_ptr = (const char *)ctx->args[0];

    e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e) return 0;

    e->event_type = EVENT_EXECVE;
    
    u64 pid_tgid = bpf_get_current_pid_tgid();
    e->pid = pid_tgid >> 32;
    e->uid = (u32)bpf_get_current_uid_gid();

    struct task_struct *task = (struct task_struct *)bpf_get_current_task();
    struct task_struct *parent_task = BPF_CORE_READ(task, real_parent);
    e->ppid = BPF_CORE_READ(parent_task, tgid);

    bpf_get_current_comm(&e->comm, sizeof(e->comm));
    
    // Capture what binary they are trying to run (e.g., /bin/bash, /usr/bin/wget)
    bpf_probe_read_user_str(&e->filename, sizeof(e->filename), filename_ptr);

    // Zero out network fields since this isn't a network event
    e->dest_ip = 0;
    e->dest_port = 0;

    bpf_ringbuf_submit(e, 0);
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
