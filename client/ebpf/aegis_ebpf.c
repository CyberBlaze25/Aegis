#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_core_read.h>

struct event_t {
    u32 pid;
    u32 ppid;
    u32 uid;
    u32 dest_ip;
    u16 dest_port;
    char comm[16];
} __attribute__((packed));

struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 16);
} events SEC(".maps");

SEC("tp/syscalls/sys_enter_connect")
int handle_connect(struct trace_event_raw_sys_enter *ctx) {
    struct event_t *e;
    struct sockaddr_in *addr = (struct sockaddr_in *)ctx->args[1];

    e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e) return 0;

    // 1. Get current PID and UID
    u64 pid_tgid = bpf_get_current_pid_tgid();
    u64 uid_gid = bpf_get_current_uid_gid();
    
    e->pid = pid_tgid >> 32;
    e->uid = (u32)uid_gid; // Lower 32 bits is the UID

    // 2. Get the PPID (Parent PID)
    // We get the current task_struct, then follow the pointer to 'real_parent'
    struct task_struct *task = (struct task_struct *)bpf_get_current_task();
    struct task_struct *parent_task;
    
    // Use BPF_CORE_READ to safely navigate the kernel pointers
    parent_task = BPF_CORE_READ(task, real_parent);
    e->ppid = BPF_CORE_READ(parent_task, tgid);

    // 3. Get Command Name
    bpf_get_current_comm(&e->comm, sizeof(e->comm));
    
    // 4. Read IP and Port (User-space memory)
    bpf_probe_read_user(&e->dest_ip, sizeof(e->dest_ip), &addr->sin_addr.s_addr);
    bpf_probe_read_user(&e->dest_port, sizeof(e->dest_port), &addr->sin_port);

    bpf_ringbuf_submit(e, 0);
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
