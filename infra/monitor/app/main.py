import yaml
import time
import os
import sys
from app.alerter import Alerter
from app.monitors import SystemMonitor, DockerMonitor, FunctionalMonitor

def load_config():
    config_path = os.getenv('CONFIG_PATH', 'config.yaml')
    try:
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        print("Config file not found.")
        sys.exit(1)

def main():
    print("Starting Server Monitor V6...")
    config = load_config()
    alerter = Alerter(config)
    
    monitors = [
        SystemMonitor(config, alerter),
        DockerMonitor(config, alerter),
        FunctionalMonitor(config, alerter)
    ]

    interval = config['general']['check_interval_seconds']

    while True:
        print(f"Running checks... {time.ctime()}")
        for monitor in monitors:
            try:
                monitor.check()
            except Exception as e:
                print(f"Error in monitor loop: {e}")
        
        sys.stdout.flush()
        time.sleep(interval)

if __name__ == "__main__":
    main()
