package brazil

import (
	"fmt"
	"log/slog"
	"os/exec"

	"gentools/genapi/internal/core/logger"
)

type BrazilProtocol struct {
	HoneypodIP   string
	HoneypodPort string
}

func NewBrazilProtocol(honeypodIP, honeypodPort string) *BrazilProtocol {
	// Initialize the Aegis cgroup on boot
	setupCgroup()
	return &BrazilProtocol{
		HoneypodIP:   honeypodIP,
		HoneypodPort: honeypodPort,
	}
}

func setupCgroup() {
	commands := [][]string{
		{"mkdir", "-p", "/sys/fs/cgroup/net_cls/aegis_jail"},
		// Assign class ID 0x100001 (1048577) to this cgroup
		{"sh", "-c", "echo 0x100001 > /sys/fs/cgroup/net_cls/aegis_jail/net_cls.classid"},
	}

	for _, cmd := range commands {
		exec.Command(cmd[0], cmd[1:]...).Run() // Ignore errors if it already exists
	}
	logger.Log.Info("🛡️ Brazil Protocol: cgroup 'aegis_jail' initialized")
}

func (bp *BrazilProtocol) IsolatePID(pid int) error {
	// 1. Move PID into the Aegis cgroup
	jailCmd := fmt.Sprintf("echo %d > /sys/fs/cgroup/net_cls/aegis_jail/tasks", pid)
	if err := exec.Command("sh", "-c", jailCmd).Run(); err != nil {
		return fmt.Errorf("failed to jail PID %d: %w", pid, err)
	}

	// 2. Apply iptables rule to DROP outgoing internet traffic from this cgroup
	// (Assumes local network is 192.168.0.0/16 or 172.16.0.0/12, adjust as needed)
	dropCmd := []string{"iptables", "-I", "OUTPUT", "-m", "cgroup", "--cgroup", "0x100001", "!", "-d", "172.16.0.0/12", "-j", "DROP"}
	if err := exec.Command(dropCmd[0], dropCmd[1:]...).Run(); err != nil {
		return fmt.Errorf("failed to apply iptables DROP rule: %w", err)
	}

	logger.Log.Warn("🟡 DEFCON 2: Process Microsegmented", slog.Int("PID", pid))
	return nil
}

func (bp *BrazilProtocol) RedirectToHoneypod(pid int, destPort int) error {
	// 1. Move PID into the Aegis cgroup
	jailCmd := fmt.Sprintf("echo %d > /sys/fs/cgroup/net_cls/aegis_jail/tasks", pid)
	if err := exec.Command("sh", "-c", jailCmd).Run(); err != nil {
		return fmt.Errorf("failed to jail PID %d: %w", pid, err)
	}

	// 2. Apply iptables DNAT (Transparent Proxy) to route its traffic to the Honeypod
	// We route traffic attempting to hit the target port (e.g., 4444) to our Honeypod
	dnatStr := fmt.Sprintf("%s:%s", bp.HoneypodIP, bp.HoneypodPort)

	dnatCmd := []string{
		"iptables", "-t", "nat", "-I", "OUTPUT",
		"-m", "cgroup", "--cgroup", "0x100001",
		"-p", "tcp", "--dport", fmt.Sprintf("%d", destPort),
		"-j", "DNAT", "--to-destination", dnatStr,
	}

	if err := exec.Command(dnatCmd[0], dnatCmd[1:]...).Run(); err != nil {
		return fmt.Errorf("failed to apply iptables DNAT rule: %w", err)
	}

	logger.Log.Error("🔴 DEFCON 1: Mirage Protocol Activated. Traffic redirected to Honeypod.", slog.Int("PID", pid))
	return nil
}
