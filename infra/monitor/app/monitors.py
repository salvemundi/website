import psutil
import docker
import socket
import requests
import shutil
import time

class SystemMonitor:
    def __init__(self, config, alerter):
        self.config = config['system']
        self.host_mount = config['general'].get('host_disk_mount_path', '/')
        self.alerter = alerter

    def get_top_cpu_processes(self, limit=5):
        """Haalt de processen op die de meeste CPU gebruiken."""
        procs = []
        try:
            # We itereren over alle processen
            for p in psutil.process_iter(['pid', 'name', 'cpu_percent']):
                try:
                    # cpu_percent kan 0 zijn bij de eerste aanroep, 
                    # maar we pakken wat we kunnen krijgen zonder vertraging.
                    # 'interval=None' is non-blocking.
                    p.info['cpu_percent'] = p.cpu_percent(interval=None)
                    procs.append(p.info)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            
            # Sorteer op CPU percentage (hoogste eerst)
            top_procs = sorted(procs, key=lambda p: p['cpu_percent'] or 0, reverse=True)[:limit]
            
            # Formatteer als string
            result = "\n**Top Consumers:**"
            for i, p in enumerate(top_procs, 1):
                cpu = p['cpu_percent']
                # Filter idle processes of zeer laag gebruik
                if cpu and cpu > 0.1:
                    result += f"\n{i}. {p['name']} ({cpu}%)"
            
            return result
        except Exception as e:
            return f"\nCould not fetch process details: {str(e)}"

    def check(self):
        # Disk Usage
        try:
            total, used, free = shutil.disk_usage(self.host_mount)
            percent = (used / total) * 100
            if percent > self.config['disk_usage_threshold_percent']:
                self.alerter.send_alert(
                    "Disk Usage High",
                    f"Disk usage at {percent:.1f}% on host.",
                    check_id="sys_disk"
                )
            else:
                self.alerter.clear_state("sys_disk")
        except FileNotFoundError:
            print(f"Warning: Host mount {self.host_mount} not found.")

        # RAM
        mem = psutil.virtual_memory()
        if mem.percent > self.config['memory_usage_threshold_percent']:
            self.alerter.send_alert(
                "Memory Usage High",
                f"RAM usage at {mem.percent}%",
                check_id="sys_mem"
            )
        else:
            self.alerter.clear_state("sys_mem")

        # CPU
        # We meten over 1 seconde voor een accuraat gemiddelde
        cpu = psutil.cpu_percent(interval=1)
        if cpu > self.config['cpu_load_threshold_percent']:
            
            # DIAGNOSE TOEVOEGEN
            diagnosis = self.get_top_cpu_processes()
            
            self.alerter.send_alert(
                "CPU Load High",
                f"CPU usage at {cpu}%{diagnosis}",
                check_id="sys_cpu"
            )
        else:
            self.alerter.clear_state("sys_cpu")

class DockerMonitor:
    def __init__(self, config, alerter):
        self.target_containers = config['docker']['containers']
        self.grace_period_seconds = config['docker'].get('grace_period_seconds', 60)
        self.alerter = alerter
        self.down_since = {}  # Track when containers first went down
        try:
            self.client = docker.from_env()
        except docker.errors.DockerException as e:
            self.client = None
            print(f"Critical: Could not connect to Docker socket. {e}")

    def check(self):
        if not self.client:
            return

        running_containers = {c.name: c for c in self.client.containers.list()}
        current_time = time.time()

        for name in self.target_containers:
            check_id = f"docker_{name}"
            
            if name not in running_containers:
                # Container is not running
                if name not in self.down_since:
                    # First time we noticed it's down, start tracking
                    self.down_since[name] = current_time
                    print(f"Container '{name}' is down. Grace period started ({self.grace_period_seconds}s).")
                else:
                    # Check if grace period has expired
                    down_duration = current_time - self.down_since[name]
                    if down_duration > self.grace_period_seconds:
                        # Grace period expired, send alert
                        self.alerter.send_alert(
                            "Container Down",
                            f"Container '{name}' has been down for {int(down_duration)}s.",
                            check_id=check_id
                        )
                    else:
                        # Still within grace period
                        remaining = self.grace_period_seconds - down_duration
                        print(f"Container '{name}' still down. Grace period: {int(remaining)}s remaining.")
                continue

            # Container exists, check status
            container = running_containers[name]
            if container.status != 'running':
                # Container exists but not running (e.g., paused, restarting)
                if name not in self.down_since:
                    self.down_since[name] = current_time
                    print(f"Container '{name}' status is '{container.status}'. Grace period started.")
                else:
                    down_duration = current_time - self.down_since[name]
                    if down_duration > self.grace_period_seconds:
                        self.alerter.send_alert(
                            "Container Unhealthy",
                            f"Container '{name}' status is '{container.status}' for {int(down_duration)}s.",
                            check_id=check_id
                        )
            else:
                # Container is running fine
                if name in self.down_since:
                    down_duration = current_time - self.down_since[name]
                    print(f"Container '{name}' recovered after {int(down_duration)}s downtime.")
                    del self.down_since[name]
                self.alerter.clear_state(check_id)

class FunctionalMonitor:
    def __init__(self, config, alerter):
        self.http_checks = config['functional'].get('http_checks', [])
        self.tcp_checks = config['functional'].get('tcp_checks', [])
        self.alerter = alerter

    def check(self):
        for check in self.http_checks:
            c_id = f"http_{check['name']}"
            try:
                r = requests.get(check['url'], timeout=check.get('timeout_seconds', 5))
                if r.status_code >= 400:
                    self.alerter.send_alert(
                        "HTTP Check Failed",
                        f"{check['name']} returned {r.status_code}",
                        check_id=c_id
                    )
                else:
                    self.alerter.clear_state(c_id)
            except requests.RequestException as e:
                self.alerter.send_alert(
                    "HTTP Check Unreachable",
                    f"{check['name']} unreachable: {str(e)}",
                    check_id=c_id
                )

        # TCP checks zijn verwijderd maar we laten de class intact voor future use
        for check in self.tcp_checks:
            pass 
