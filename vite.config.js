import { defineConfig } from 'vite';

const githubPages = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
    base: githubPages ? '/kho-kho-game/' : '/',
    server: {
        port: 5173,
        open: true,
    },
});
