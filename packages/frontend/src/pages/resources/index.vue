<route lang="yaml">
meta:
  layout: app
</route>

<template>
  <v-container fluid>
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
          <router-link to="/resources/tracks">Tracks</router-link>
        </li>
        <li>
          <router-link to="/resources/albums">Albums</router-link>
        </li>
        <li>
          <router-link to="/resources/artists">Artists</router-link>
        </li>
        <li>
          <router-link to="/resources/playlists">Playlists</router-link>
        </li>
        <li>
          <router-link to="/resources/sources">Sources</router-link>
        </li>
      </ul>
    </div>
  </v-container>
</template>
