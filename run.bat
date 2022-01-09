wt nt cmd /k pnpm run dev:client ; ^
sp -V cmd /k pnpm run dev:server ; ^
mf left ; ^
sp -H cmd /k pnpm run dev:cdn ; ^
mf right ; ^
sp -H cmd /k pnpm run dev:transcoder
