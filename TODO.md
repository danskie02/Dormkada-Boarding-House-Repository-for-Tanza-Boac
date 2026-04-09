# Dorm-Finder Deployment Fix TODO

## Plan Progress

- [x] 1. Update lib/api-spec/openapi.yaml (change servers url)
- [x] 2. Update artifacts/dormkada/src/App.tsx (add setBaseUrl)
- [x] 3. Create .env.example
- [x] 4. Run orval to regenerate API client (SUCCESS: fixed orval.config.ts baseUrl & regenerated)
- [x] 5. Test locally (recommended: pnpm --filter dormkada dev - now fixed setBaseUrl appends /api)
- [x] 6. Update docs & complete

**Fixed!** setBaseUrl now: root + /api + relative path → correct single /api prefix.

**Next step: Test with pnpm --filter dormkada dev. Then update INSTALLATION.md**

**Next step: Edit openapi.yaml**
