import { describe, expect, it } from 'vitest';
import { Slots } from '../src/slots.js';

describe('Slots', () => {
    it('geeft plekken in volgorde door en lekt niet bij time-outs', async () => {
        const s = new Slots(1, 5);
        expect(await s.acquire(0)).toBe(true);
        expect(await s.acquire(0)).toBe(false);
        const waiting = s.acquire(1000);
        const timedOut = await s.acquire(10);
        expect(timedOut).toBe(false);
        s.release(); // gaat naar `waiting`
        expect(await waiting).toBe(true);
        expect(s.idle).toBe(false);
        s.release();
        expect(s.idle).toBe(true);
        expect(await s.acquire(0)).toBe(true);
    });
    it('begrenst de wachtrij', async () => {
        const s = new Slots(1, 1);
        await s.acquire(0);
        void s.acquire(1000);
        expect(await s.acquire(1000)).toBe(false);
    });
});
