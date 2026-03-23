import os
path = '/opt/salve-mundi-v7/.env'
with open(path, 'r') as f:
    lines = f.readlines()
# Filter out ANY internal service token lines or stray quote lines
new_lines = [l for l in lines if 'INTERNAL_SERVICE_TOKEN' not in l and l.strip() != '"']
# Add the clean token
token = 'FZiv2qnlsnHIxr9OWLJyVzgLVU9AOhvxVDSKTPQkPCK059XfUXD4OKXFqLilMbuh7TAAC1Py/BCGuD3DlwGPvw=='
new_lines.append(f'\nINTERNAL_SERVICE_TOKEN="{token}"\n')
# Filter out empty lines if they were added accidentally
final_lines = [l for l in new_lines if l.strip()]
with open(path, 'w') as f:
    f.writelines('\n'.join(final_lines) + '\n')
print("Fixed .env")
