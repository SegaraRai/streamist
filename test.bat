wt nt cmd /k pnpm run test:server -- -- -u ; ^
sp -V cmd /k pnpm run typecheck:server -- -- -w ; ^
mf left ; ^
sp -H cmd /k pnpm run typecheck:cdn -- -- -w ; ^
mf right ; ^
sp -H cmd /k pnpm run typecheck:transcoder -- -- -w