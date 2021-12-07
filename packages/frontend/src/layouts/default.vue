<script lang="ts" setup>
import { useDisplay } from 'vuetify';
import { useThemeStore } from '@/stores/theme';

const theme = useThemeStore();
const display = useDisplay();
</script>

<template>
  <v-app>
    <v-navigation-drawer app permanent clipped mini-variant>
      <v-list dense>
        <v-list-item link to="/home">
          <v-list-item-action>
            <v-icon>mdi-home</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ $t('client/Home') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item link to="/albums">
          <v-list-item-action>
            <v-icon>mdi-album</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ $t('client/Albums') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/artists">
          <v-list-item-action>
            <v-icon>mdi-account-music</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ $t('client/Artists') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/tracks">
          <v-list-item-action>
            <v-icon>mdi-music</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ $t('client/Tracks') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/playlists">
          <v-list-item-action>
            <v-icon>mdi-playlist-music</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ $t('client/Playlists') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/tags">
          <v-list-item-action>
            <v-icon>mdi-pound</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ $t('client/Tags') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item link to="/queue">
          <v-list-item-action>
            <v-icon>mdi-playlist-play</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ $t('client/Queue') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/downloads">
          <v-list-item-action>
            <v-icon>mdi-cloud-download</v-icon>
            <v-progress-linear
              rounded
              class="download-progress"
              :value="20"
            ></v-progress-linear>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ $t('client/Downloads') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/uploads">
          <v-list-item-action>
            <v-icon>mdi-cloud-upload</v-icon>
            <v-progress-linear
              rounded
              class="upload-progress"
              :value="30"
            ></v-progress-linear>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ $t('client/Uploads') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item link to="/settings">
          <v-list-item-action>
            <v-icon>mdi-settings</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ $t('client/Settings') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <template v-if="display.mdAndUp">
      <v-navigation-drawer
        app
        permanent
        clipped
        right
        :theme="theme.rightSidebarTheme"
        :hidden="!display.mdAndUp"
      >
        <Queue />
      </v-navigation-drawer>
    </template>

    <v-app-bar
      app
      dense
      flat
      clipped-left
      clipped-right
      :theme="theme.headerTheme"
    >
      <v-app-bar-nav-icon></v-app-bar-nav-icon>
      <v-toolbar-title class="ml-0 pl-4 pr-12 hidden-xs-only">
        <span class="app-title">
          streamist<span class="subtitle-2">.app</span>
        </span>
      </v-toolbar-title>
      <v-text-field
        dense
        flat
        solo-inverted
        hide-details
        prepend-inner-icon="mdi-magnify"
        :label="$t('client/Search')"
        class="textfield"
      />
      <v-spacer></v-spacer>
    </v-app-bar>

    <v-main :class="theme.bgClass">
      <v-sheet tile :theme="theme.contentTheme" :class="theme.bgClass">
        <router-view></router-view>
      </v-sheet>
    </v-main>

    <v-footer app flat inset class="pa-0 ma-0" :dark="theme.footerTheme">
      <v-sheet tile class="playback-sheet">
        <v-divider></v-divider>
        <div class="pa-1">
          <playback-control></playback-control>
        </div>
        <v-progress-linear
          class="upload-progress"
          color="orange"
          value="15"
          height="2"
          :active="true"
          bottom
        ></v-progress-linear>
        <v-progress-linear
          class="download-progress"
          color="green"
          value="15"
          height="2"
          :active="true"
          bottom
        ></v-progress-linear>
      </v-sheet>
    </v-footer>
  </v-app>
</template>
