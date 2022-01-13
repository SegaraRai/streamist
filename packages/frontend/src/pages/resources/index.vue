<template>
  <v-container fluid>
    <header class="mb-6 flex items-baseline gap-x-4">
      <div class="text-h5">Resources</div>
    </header>
    <div>
      <div>This is a debug page.</div>
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
