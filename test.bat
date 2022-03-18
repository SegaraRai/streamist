wt nt cmd /k pnpm run test_dev:server ; ^
sp -V cmd /k pnpm run typecheck:server -- -- -w ; ^
mf left ; ^
mf up   ; sp -H cmd /k pnpm run test_dev:shared ; ^
mf down ; sp -H cmd /k pnpm run test_dev:shared-server ; ^
mf right ; ^
sp -H cmd /k pnpm run typecheck:client -- -- -w ; ^
mf up   ; sp -H cmd /k pnpm run typecheck:transcoder -- -- -w ; ^
mf down ; sp -H cmd /k pnpm run typecheck:cdn -- -- -w ; ^
mf up   ; sp -H cmd /k pnpm run typecheck:ws -- -- -w
