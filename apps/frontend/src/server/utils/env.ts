import 'server-only';

export function getExpandedEnv(key: string, defaultValue?: string): string {
    const value = Reflect.get(process.env, key) as string | undefined;

    if (!value) {
        if (defaultValue !== undefined) return defaultValue;
        return '';
    }

    const expansionPattern = /\${([^}]+)}/g;

    if (expansionPattern.test(value)) {
        expansionPattern.lastIndex = 0;

        return value.replace(expansionPattern, (_, varName) => {
            const expanded = Reflect.get(process.env, varName) as unknown;
            return typeof expanded === 'string' ? expanded : '';
        });
    }

    return value;
}
