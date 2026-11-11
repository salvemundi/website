import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('mobile_setup', Path(__file__).with_name('setup.py'))
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class SetupTests(unittest.TestCase):
    def test_only_fixed_actions_and_commits(self):
        for action in setup.ACTIONS:
            value = {'action': action, 'commit': 'a' * 40, 'confirm_isolation': True}
            if action == 'configure':
                value.update(key_id='ABCDEFGHIJ', team_id='ABCDEFGHIJ', private_key='-----BEGIN PRIVATE KEY-----fixture-----END PRIVATE KEY-----')
            setup.validate(value)
        for value in [{'action': 'shell', 'commit': 'a' * 40}, {'action': 'check', 'commit': 'x;id'}, {'action': 'migrate', 'commit': 'a' * 40}, {'action': 'start', 'commit': 'a' * 40}, {'action': 'test', 'commit': 'a' * 40}]:
            with self.assertRaises(ValueError):
                setup.validate(value)

    def test_configure_stays_disabled_and_restricts_file(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(setup, 'ROOT', Path('/unused')):
            setup.ROOT = Path(directory)
            payload = {'action': 'configure', 'commit': 'a' * 40, 'key_id': 'ABCDEFGHIJ', 'team_id': 'ABCDEFGHIJ', 'private_key': '-----BEGIN PRIVATE KEY-----\nfixture\n-----END PRIVATE KEY-----', 'test_user_ids': ''}
            setup.validate(payload)
            setup.configure(payload)
            target = setup.ROOT / '.env.mobile-acc'
            content = target.read_text()
            self.assertEqual(target.stat().st_mode & 0o777, 0o600)
            self.assertIn('MOBILE_NOTIFICATIONS_ENABLED=false\n', content)
            self.assertIn('MOBILE_APNS_ALLOW_PRODUCTION=false\n', content)
            self.assertIn('MOBILE_NOTIFICATION_ALLOWED_USER_IDS=\n', content)
            self.assertFalse((setup.ROOT / '.env.mobile-acc.setup-tmp').exists())
            for users in ['*', 'a;id', '00000000-0000-0000-0000-000000000001,not-a-user']:
                with self.assertRaises(ValueError):
                    setup.validate(dict(payload, test_user_ids=users))

    def test_quoted_database_configuration_is_private_and_removed(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            root.joinpath('.env.acc').write_text('DB_NAME="acceptance"\nDB_USER="worker"\nDB_PASSWORD="literal$and`characters`\\keep"\nUNRELATED_SECRET=not-copied\n')
            root.joinpath('.env.mobile-acc').write_text('APNS_PRIVATE_KEY=escaped\\nkey\nDB_PASSWORD=must-not-override\n')
            temporary = None
            with self.assertRaises(RuntimeError):
                with setup.normalized_environment(root) as filename:
                    temporary = Path(filename)
                    content = temporary.read_text()
                    self.assertEqual(temporary.stat().st_mode & 0o777, 0o600)
                    self.assertIn('DB_NAME=acceptance\nDB_USER=worker\n', content)
                    self.assertIn('DB_PASSWORD=literal$and`characters`\\keep\n', content)
                    self.assertNotIn('not-copied', content)
                    self.assertNotIn('must-not-override', content)
                    self.assertIn('APNS_PRIVATE_KEY=escaped\\nkey\n', content)
                    raise RuntimeError('fixture')
            self.assertFalse(temporary.exists())

    def test_database_name_parser_never_executes_environment(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / '.env.prod'
            target.write_text('PASSWORD=secret-never-used\nDB_NAME="production"\nOTHER=$(touch /tmp/never-run)\n')
            self.assertEqual(setup.database_name(target), 'production')
            target.write_text('DB_NAME=$(touch /tmp/never-run)\n')
            with self.assertRaises(ValueError):
                setup.database_name(target)

    def test_shared_database_blocks_migration_and_worker_start(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(setup, 'ROOT', Path(directory)), patch.object(setup, 'run') as run:
            (setup.ROOT / 'mobile-setup' / ('a' * 40)).mkdir(parents=True)
            for filename in ['.env.acc', '.env.prod']:
                (setup.ROOT / filename).write_text('DB_NAME=shared\n')
            for action in ['migrate', 'start', 'test']:
                with self.assertRaises(ValueError):
                    setup.main({'action': action, 'commit': 'a' * 40, 'confirm_isolation': True})
            # Only building the isolated image was allowed; no query, migration or run.
            self.assertTrue(all(call.args[0][:2] == ['docker', 'build'] for call in run.call_args_list))

    def test_shared_check_only_runs_read_only_doctor(self):
        import subprocess
        with tempfile.TemporaryDirectory() as directory, patch.object(setup, 'ROOT', Path(directory)), patch.object(setup, 'run') as run, patch.object(setup.subprocess, 'run') as process:
            (setup.ROOT / 'mobile-setup' / ('a' * 40)).mkdir(parents=True)
            for filename in ['.env.acc', '.env.prod']:
                (setup.ROOT / filename).write_text('DB_NAME=shared\n')
            process.return_value = subprocess.CompletedProcess([], 1, b'FAIL database is shared\nPASS required table mobile_devices\n', b'')
            with self.assertRaisesRegex(RuntimeError, 'Shared schema inspected'):
                setup.main({'action': 'check', 'commit': 'a' * 40})
            self.assertEqual(run.call_count, 1)
            self.assertEqual(run.call_args.args[0][:2], ['docker', 'build'])
            self.assertEqual(process.call_count, 1)
            self.assertEqual(process.call_args.args[0][-3:], ['node', 'src/readiness.mjs', '--database'])

    def test_only_one_exact_email_is_resolved_with_bound_query(self):
        source = Path(__file__).with_name('setup.py').read_text()
        self.assertIn("WHERE lower(email)=lower($1) AND status='active' LIMIT 2", source)
        self.assertIn('BEGIN READ ONLY', source)
        self.assertIn("payload = dict(payload, test_user_ids=resolved)", source)
        payload = {'action':'configure','commit':'a'*40,'key_id':'ABCDEFGHIJ','team_id':'ABCDEFGHIJ','private_key':'-----BEGIN PRIVATE KEY-----fixture-----END PRIVATE KEY-----','test_user_ids':'','test_user_email':'member@example.test'}
        setup.validate(payload)
        for patch in [{'test_user_email':'x@example.test; echo bad'}, {'test_user_ids':'00000000-0000-0000-0000-000000000001'}]:
            with self.assertRaises(ValueError): setup.validate(dict(payload,**patch))

    def test_setup_workflow_has_acceptance_and_dispatch_guards(self):
        repository = Path(__file__).resolve().parents[2]
        workflow = (repository / '.github/workflows/mobile-notifications-setup.yml').read_text()
        parent = (repository / '.github/workflows/v7-stack.yml').read_text()
        self.assertIn("github.ref == 'refs/heads/acceptance' && github.event_name == 'workflow_dispatch'", workflow)
        self.assertIn('environment: Acceptance', workflow)
        self.assertNotIn('StrictHostKeyChecking=no', workflow)
        self.assertIn('StrictHostKeyChecking=yes', workflow)
        self.assertIn("inputs.mobile_setup_action == 'none'", parent)
        self.assertIn('uses: ./.github/workflows/mobile-notifications-setup.yml', parent)
        self.assertNotIn('pull_request_target', workflow)


if __name__ == '__main__':
    unittest.main()
