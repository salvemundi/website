import json
import time
import requests
from datetime import datetime, timedelta

class Alerter:
    def __init__(self, config):
        self.webhook_url = config['discord']['webhook_url']
        self.repeat_interval = config['discord']['repeat_alert_after_minutes']
        self.state_file = '/tmp/alert_state.json'
        self.state = self._load_state()

    def _load_state(self):
        try:
            with open(self.state_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _save_state(self):
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f)

    def should_alert(self, check_id):
        last_alert = self.state.get(check_id)
        if not last_alert:
            return True
        
        last_time = datetime.fromisoformat(last_alert)
        if datetime.now() - last_time > timedelta(minutes=self.repeat_interval):
            return True
        return False

    def send_alert(self, title, message, level="error", check_id=None):
        if check_id and not self.should_alert(check_id):
            return

        # Red for error, Yellow for warning
        color = 15158332 if level == "error" else 16776960

        payload = {
            "embeds": [{
                "title": f"[{level.upper()}] {title}",
                "description": message,
                "color": color,
                "timestamp": datetime.now().astimezone().isoformat()
            }]
        }

        try:
            response = requests.post(self.webhook_url, json=payload, timeout=5)
            response.raise_for_status()
            
            if check_id:
                self.state[check_id] = datetime.now().isoformat()
                self._save_state()
                
        except requests.RequestException as e:
            print(f"Failed to send Discord alert: {e}")

    def clear_state(self, check_id):
        if check_id in self.state:
            del self.state[check_id]
            self._save_state()
