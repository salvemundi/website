/**
 * Semafoor met begrensde wachtrij. Verzoeken boven de limiet wachten kort op een vrije plek in plaats van direct een
 * 503 te krijgen: clients als Claude doen gewoon meerdere toolcalls tegelijk.
 */
export class Slots {
    private used = 0;
    private readonly queue: (() => void)[] = [];

    constructor(private readonly max: number, private readonly maxQueue: number) {}

    get idle(): boolean {
        return this.used === 0 && this.queue.length === 0;
    }

    /** true = plek verkregen (later precies één keer `release()`), false = vol of time-out. */
    acquire(timeoutMs: number): Promise<boolean> {
        if (this.used < this.max) {
            this.used++;
            return Promise.resolve(true);
        }
        if (timeoutMs <= 0 || this.queue.length >= this.maxQueue) return Promise.resolve(false);
        return new Promise((resolve) => {
            const grant = () => {
                clearTimeout(timer);
                resolve(true);
            };
            const timer = setTimeout(() => {
                const i = this.queue.indexOf(grant);
                if (i >= 0) this.queue.splice(i, 1);
                resolve(false);
            }, timeoutMs);
            this.queue.push(grant);
        });
    }

    release(): void {
        const next = this.queue.shift();
        // Plek gaat direct over naar de volgende wachtende; anders komt hij vrij.
        if (next) next();
        else this.used--;
    }
}
