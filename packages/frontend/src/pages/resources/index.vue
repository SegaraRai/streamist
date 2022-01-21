<route lang="yaml">
meta:
  layout: conditional
  requiresAuth: true
</route>

<template>
  <VContainer fluid>
    <header class="s-title mb-4">
      <div class="text-h5">Resources</div>
    </header>
    <div class="flex flex-col gap-y-4">
      <p>
        Whoa! You find it!<br />
        This is just a debugging page. Nothing more, nothing less.
      </p>
      <ul class="text-st-info">
        <li>
          <RouterLink to="/resources/tracks">Tracks</RouterLink>
        </li>
        <li>
          <RouterLink to="/resources/albums">Albums</RouterLink>
        </li>
        <li>
          <RouterLink to="/resources/artists">Artists</RouterLink>
        </li>
        <li>
          <RouterLink to="/resources/playlists">Playlists</RouterLink>
        </li>
        <li>
          <RouterLink to="/resources/sources">Sources</RouterLink>
        </li>
      </ul>
    </div>
  </VContainer>
</template>
