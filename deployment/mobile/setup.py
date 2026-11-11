#!/usr/bin/env python3
"""Focused acceptance notification setup; all actions are explicit and scoped."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
from contextlib import contextmanager

ROOT = Path('/opt/salve-mundi-v7')
ACTIONS = {'check', 'configure', 'migrate', 'start', 'test'}
WORKER_NAME = 'v7-acc-mobile-notifications'


def database_name(path):
    # Only extract DB_NAME. Never execute environment files or expose other values.
    with path.open() as stream:
        for line in stream:
            match = re.match(r'^DB_NAME=(.*)$', line.rstrip('\n'))
            if match:
                value = match[1].strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                    value = value[1:-1]
                if not re.fullmatch(r'[A-Za-z0-9_-]{1,100}', value):
                    raise ValueError('Unsupported database identifier')
                return value
    raise ValueError('Required database identifier missing')


def validate(payload):
    if payload.get('action') not in ACTIONS:
        raise ValueError('Invalid setup action')
    if not re.fullmatch(r'[0-9a-f]{40}', payload.get('commit', '')):
        raise ValueError('Invalid source revision')
    if payload['action'] == 'configure':
        if not all(re.fullmatch(r'[A-Z0-9]{10}', payload.get(key, '')) for key in ['key_id', 'team_id']):
            raise ValueError('Apple identifiers missing or invalid')
        if not payload.get('private_key', '').startswith('-----BEGIN PRIVATE KEY-----'):
            raise ValueError('APNs private key missing')
        email = payload.get('test_user_email', '')
        if email and (not re.fullmatch(r'[^\s@]{1,100}@[^\s@]{1,150}', email) or payload.get('test_user_ids', '').strip()):
            raise ValueError('Use one explicit member email or a UUID list')
        users = [u for u in payload.get('test_user_ids', '').split(',') if u.strip()]
        if not all(re.fullmatch(r'[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}', u.strip()) for u in users):
            raise ValueError('Explicit test-member UUIDs required')
    if payload['action'] in {'migrate', 'start', 'test'} and payload.get('confirm_isolation') is not True:
        raise ValueError('Explicit database-isolation confirmation required')


def run(command, **kwargs):
    # Never emit subprocess stderr: drivers may include connection details.
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, **kwargs)
    if result.returncode:
        raise RuntimeError('Focused setup operation failed; no diagnostic output exposed')
    return result.stdout


DATABASE_KEYS = {'DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'}
MOBILE_KEYS = {'ENV_NAME', 'MOBILE_API_ENABLED', 'MOBILE_NOTIFICATIONS_ENABLED', 'MOBILE_NOTIFICATION_ALLOWED_USER_IDS', 'MOBILE_APNS_ALLOW_PRODUCTION', 'APNS_KEY_ID', 'APNS_TEAM_ID', 'APNS_TOPIC', 'APNS_PRIVATE_KEY'}


def read_selected_environment(path, allowed):
    values = {}
    if not path.is_file():
        return values
    with path.open() as stream:
        for line in stream:
            key, separator, value = line.rstrip('\n').partition('=')
            if not separator or key not in allowed:
                continue
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            # Do not shell-expand $, backticks, escapes or command substitutions.
            if '\r' in value or '\n' in value or '\0' in value:
                raise ValueError('Unsupported environment value')
            values[key] = value
    return values


@contextmanager
def normalized_environment(root):
    values = read_selected_environment(root / '.env.acc', DATABASE_KEYS | {'MOBILE_API_ENABLED'})
    values.update(read_selected_environment(root / '.env.mobile-acc', MOBILE_KEYS))
    values['ENV_NAME'] = 'acc'
    # Docker --env-file treats quotes literally; remove only the enclosing dotenv
    # quotes, preserve credential characters, and destroy this 0600 file afterward.
    fd, filename = tempfile.mkstemp(prefix='mobile-acc-env-')
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, 'w') as stream:
            stream.write(''.join(f'{key}={value}\n' for key, value in values.items()))
        yield filename
    finally:
        Path(filename).unlink(missing_ok=True)


def docker_command(image, environment_file, production=None, isolation=False):
    command = ['docker', 'run', '--rm', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges',
               '--network=salve-mundi-v7-shared', '--env-file', environment_file, '--env', 'ENV_NAME=acc']
    if production:
        command += ['--env', f'PRODUCTION_DB_NAME={production}']
    if isolation:
        command += ['--env', 'MOBILE_ACCEPTANCE_DB_ISOLATION_CONFIRMED=true']
    return command + [image]


def configure(payload):
    # A persistent file distinct from the normal stack's regenerated .env.acc.
    key = payload['private_key'].replace('\\n', '\n').strip()
    if '\r' in key:
        key = key.replace('\r', '')
    if not key.endswith('-----END PRIVATE KEY-----'):
        raise ValueError('Invalid private-key envelope')
    values = {'ENV_NAME': 'acc', 'MOBILE_API_ENABLED': 'true', 'MOBILE_NOTIFICATIONS_ENABLED': 'false',
              'MOBILE_NOTIFICATION_ALLOWED_USER_IDS': ','.join(u.strip() for u in payload['test_user_ids'].split(',')),
              'MOBILE_APNS_ALLOW_PRODUCTION': 'false', 'APNS_KEY_ID': payload['key_id'],
              'APNS_TEAM_ID': payload['team_id'], 'APNS_TOPIC': 'nl.salvemundi.ios',
              'APNS_PRIVATE_KEY': key.replace('\n', '\\n')}
    content = ''.join(f'{key}={value}\n' for key, value in values.items())
    temporary = ROOT / '.env.mobile-acc.setup-tmp'
    fd = os.open(temporary, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    try:
        with os.fdopen(fd, 'w') as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, ROOT / '.env.mobile-acc')
    finally:
        temporary.unlink(missing_ok=True)


def main(payload):
    validate(payload)
    action = payload['action']
    scope = ROOT / 'mobile-setup' / payload['commit']
    if not scope.is_dir():
        raise ValueError('Staged source missing')
    image = 'salvemundi-mobile-acceptance-setup:' + payload['commit']
    # No registry publishing or existing service changes.
    run(['docker', 'build', '--quiet', '--file', str(scope / 'apps/services/mobile-notification-service/Dockerfile'), '--tag', image, str(scope)])
    print('PASS reviewed acceptance worker image built')
    with normalized_environment(ROOT) as environment_file:
        execute(payload, scope, image, environment_file)


def execute(payload, scope, image, environment_file):
    action = payload['action']
    production = database_name(ROOT / '.env.prod')
    acceptance = database_name(ROOT / '.env.acc')
    if production == acceptance:
        raise ValueError('Acceptance and production database are shared; migration and startup refused')
    isolated = payload.get('confirm_isolation') is True
    command = docker_command(image, environment_file, production, isolated)
    # Compare actual connected DB with BOTH existing environment identifiers.
    verify = "import pg from 'pg';const c=new pg.Client({connectionString:process.env.DATABASE_URL,host:process.env.DB_HOST,port:Number(process.env.DB_PORT||5432),database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD,connectionTimeoutMillis:5000});try{await c.connect();const r=await c.query('SELECT current_database() AS name');if(r.rows[0]?.name!==process.env.EXPECTED_ACC_DB||r.rows[0]?.name===process.env.PRODUCTION_DB_NAME)process.exitCode=1}finally{await c.end()}"
    verify_command = command[:-1] + ['--env', f'EXPECTED_ACC_DB={acceptance}', image, 'node', '--input-type=module', '-e', verify]
    run(verify_command)
    print('PASS actual acceptance database differs from production')
    if action == 'configure' and payload.get('test_user_email'):
        lookup = "import pg from 'pg';let s='';for await(const c of process.stdin)s+=c;const email=JSON.parse(s).email;const c=new pg.Client({connectionString:process.env.DATABASE_URL,host:process.env.DB_HOST,port:Number(process.env.DB_PORT||5432),database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});try{await c.connect();await c.query('BEGIN READ ONLY');const r=await c.query(\"SELECT id::text AS id FROM directus_users WHERE lower(email)=lower($1) AND status='active' LIMIT 2\",[email]);if(r.rows.length!==1)process.exitCode=1;else process.stdout.write(JSON.stringify({id:r.rows[0].id}));await c.query('ROLLBACK')}finally{await c.end()}"
        result = run(command[:-1] + ['-i', image, 'node', '--input-type=module', '-e', lookup], input=json.dumps({'email': payload['test_user_email']}).encode())
        resolved = json.loads(result)['id']
        if not re.fullmatch(r'[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}', resolved):
            raise ValueError('Test member could not be resolved')
        payload = dict(payload, test_user_ids=resolved)
    if action == 'configure':
        # Validate the key cryptographically before persisting secrets.
        run(['docker', 'run', '--rm', '--network=none', '-i', image, 'node', '--input-type=module', '-e',
             "import{createPrivateKey}from'node:crypto';let s='';for await(const c of process.stdin)s+=c;const k=createPrivateKey(s.replace(/\\\\n/g,'\\n'));if(k.asymmetricKeyType!=='ec'||k.asymmetricKeyDetails?.namedCurve!=='prime256v1')process.exit(1)"], input=payload['private_key'].encode())
        configure(payload)
        print('PASS acceptance-only APNs configuration stored with mode 600; worker not started')
        return
    if action == 'migrate':
        # Source is fixed to the checked-out commit, never supplied as arbitrary SQL.
        migration = (scope / 'packages/db/drizzle/mobile_notifications.sql').read_bytes()
        apply = "import pg from 'pg';let s='';for await(const c of process.stdin)s+=c;const c=new pg.Client({connectionString:process.env.DATABASE_URL,host:process.env.DB_HOST,port:Number(process.env.DB_PORT||5432),database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});try{await c.connect();await c.query(s)}finally{await c.end()}"
        run(command[:-1] + ['-i', image, 'node', '--input-type=module', '-e', apply], input=migration)
        print('PASS reviewed acceptance notification migration applied; worker not started')
        return
    if action in {'start', 'test'}:
        command = command[:-1] + ['--env', 'MOBILE_NOTIFICATIONS_ENABLED=true', image]
    # This doctor never prints secrets; still filter output to known status labels.
    result = subprocess.run(command + ['node', 'src/readiness.mjs', '--database'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    for line in result.stdout.decode(errors='replace').splitlines():
        if line.startswith(('PASS ', 'FAIL ', 'No notifications sent.')):
            print(line)
    if result.returncode:
        raise RuntimeError('Readiness incomplete; worker not started')
    if action == 'check':
        print('PASS read-only check complete; no settings, schema, registrations or delivery changed')
        return
    if action == 'test':
        output = run(command + ['node', 'src/test-delivery.mjs'])
        # Entrypoint owns fixed status-only output; don't expose driver responses.
        print('PASS controlled sandbox test request completed; check the approved iPhone for receipt')
        return
    # Explicit start touches only the isolated acceptance worker container.
    subprocess.run(['docker', 'rm', '-f', WORKER_NAME], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    launch = command[:-1]
    launch.remove('--rm')
    launch += ['--detach', '--name', WORKER_NAME, '--restart=no', image]
    run(launch)
    time.sleep(2)
    running = run(['docker', 'inspect', '--format={{.State.Running}}', WORKER_NAME]).decode().strip()
    if running != 'true':
        raise RuntimeError('Acceptance worker exited during startup')
    print('PASS acceptance worker started for explicit allowlisted members only')


if __name__ == '__main__':
    try:
        main(json.load(sys.stdin))
    except ValueError as error:
        safe = {'Acceptance and production database are shared; migration and startup refused', 'Explicit database-isolation confirmation required', 'Required database identifier missing', 'Test member could not be resolved'}
        print('FAIL ' + (str(error) if str(error) in safe else 'Setup configuration is invalid or incomplete'))
        sys.exit(1)
    except Exception:
        print('FAIL focused notification setup could not complete; secret-bearing error details suppressed')
        sys.exit(1)
