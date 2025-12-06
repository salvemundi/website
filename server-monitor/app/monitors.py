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
        self.alerter = alerter
        try:
            self.client = docker.from_env()
        except docker.errors.DockerException as e:
            self.client = None
            print(f"Critical: Could not connect to Docker socket. {e}")

    def check(self):
        if not self.client:
            return

        running_containers = {c.name: c for c in self.client.containers.list()}

        for name in self.target_containers:
            check_id = f"docker_{name}"
            
            if name not in running_containers:
                self.alerter.send_alert(
                    "Container Down",
                    f"Container '{name}' is not running.",
                    check_id=check_id
                )
                continue

            container = running_containers[name]
            if container.status != 'running':
                 self.alerter.send_alert(
                    "Container Unhealthy",
                    f"Container '{name}' status is '{container.status}'.",
                    check_id=check_id
                )
            else:
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
