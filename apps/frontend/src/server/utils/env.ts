import 'server-only';

export function getExpandedEnv(key: string, defaultValue?: string): string {
    // eslint-disable-next-line security/detect-object-injection
    const value = process.env[key];

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
