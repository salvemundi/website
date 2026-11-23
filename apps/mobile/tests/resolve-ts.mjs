// Workspace packages export extensionless TS source (bundler resolution); let Node resolve './x' to './x.ts'.
import { registerHooks } from 'node:module';

registerHooks({
    resolve(specifier, context, nextResolve) {
        try {
            return nextResolve(specifier, context);
        } catch (error) {
            if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !/^\.\.?\//.test(specifier)) throw error;
            return nextResolve(`${specifier}.ts`, context);
        }
    },
});
