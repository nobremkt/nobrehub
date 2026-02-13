import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        testTimeout: 30_000,
        hookTimeout: 15_000,
        sequence: { concurrent: false },
        fileParallelism: false,
        setupFiles: ['tests/setup.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
});
