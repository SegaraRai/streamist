<script lang="ts" setup>
import PQueue from 'p-queue';
import { useDisplay } from 'vuetify';
import {
  SOURCE_FILE_CACHE_CONTROL,
  SOURCE_FILE_CONTENT_ENCODING,
  SOURCE_FILE_CONTENT_TYPE,
} from '$shared/sourceFileConfig';
import { useThemeStore } from '@/stores/theme';
import { syncDB } from '~/db/sync';
import api from '~/logic/api';
import { UploadURL } from '$/types';

/*
type UploadFileState =
  | 'pending'
  | 'invalid'
  | 'uploading'
  | 'transcoding'
  | 'finished'
  | 'failed';

interface UploadFile {
  state: UploadFileState;
  name: string;
  size: number;
  file: File;
}
//*/

async function upload(
  uploadURL: UploadURL,
  file: File
): Promise<string[] | undefined> {
  if (uploadURL.url != null) {
    // normal upload
    await fetch(uploadURL.url, {
      method: 'PUT',
      headers: {
        'Cache-Control': SOURCE_FILE_CACHE_CONTROL,
        'Content-Encoding': SOURCE_FILE_CONTENT_ENCODING,
        'Content-Length': `${file.size}`,
        'Content-Type': SOURCE_FILE_CONTENT_TYPE,
      },
      body: file,
    });
  } else {
    // multipart upload
    const eTagPromises: Promise<string>[] = [];
    const queue = new PQueue({ concurrency: 4 });
    let offset = 0;
    for (const part of uploadURL.parts) {
      const currentOffset = offset;
      const eTagPromise = queue.add(async (): Promise<string> => {
        const response = await fetch(part.url, {
          method: 'PUT',
          headers: {
            'Cache-Control': SOURCE_FILE_CACHE_CONTROL,
            'Content-Encoding': SOURCE_FILE_CONTENT_ENCODING,
            'Content-Length': `${part.size}`,
            'Content-Type': SOURCE_FILE_CONTENT_TYPE,
          },
          body: file.slice(currentOffset, currentOffset + part.size),
        });
        return response.headers.get('ETag')!;
      });
      offset += part.size;
      eTagPromises.push(eTagPromise);
    }
    return Promise.all(eTagPromises);
  }
}

async function uploadFile(file: File) {
  const result = await api.my.sources.$post({
    body: {
      type: 'audio',
      region: 'ap-northeast-1',
      audioFile: {
        type: 'audio',
        filename: file.name,
        fileSize: file.size,
      },
      cueSheetFile: null,
    },
  });

  const { sourceId } = result;
  const audioFile = result.files.find((f) => f.requestFile.type === 'audio')!;

  const etags = await upload(audioFile.uploadURL, file);

  await api.my.sources
    ._sourceId(sourceId)
    .files._sourceFileId(audioFile.sourceFileId)
    .$patch({
      body: {
        state: 'uploaded',
        parts: etags,
      },
    });
}

const { t } = useI18n();
const theme = useThemeStore();
const display = useDisplay();

const uploadDialog = ref(false);

const files = ref<File[] | undefined>();

watchEffect(() => {
  if (files.value && files.value.length > 0) {
    const file = files.value[0];
    uploadFile(file);
  }
});

interface NavItemLink {
  type: 'link';
  path: string;
  icon: string;
  text: string;
}

interface NavItemDivider {
  type: 'divider';
}

type NavItem = NavItemLink | NavItemDivider;

const navItems = computed<readonly NavItem[]>(() => [
  {
    type: 'link',
    icon: 'mdi-home',
    path: '/',
    text: t('sidebar.Home'),
  },
  {
    type: 'divider',
  },
  {
    type: 'link',
    icon: 'mdi-album',
    path: '/albums',
    text: t('sidebar.Albums'),
  },
  {
    type: 'link',
    icon: 'mdi-account-music',
    path: '/artists',
    text: t('sidebar.Artists'),
  },
  {
    type: 'link',
    icon: 'mdi-music',
    path: '/tracks',
    text: t('sidebar.Tracks'),
  },
  {
    type: 'link',
    icon: 'mdi-playlist-music',
    path: '/playlists',
    text: t('sidebar.Playlists'),
  },
  {
    type: 'link',
    icon: 'mdi-pound',
    path: '/tags',
    text: t('sidebar.Tags'),
  },
  {
    type: 'divider',
  },
  {
    type: 'link',
    icon: 'mdi-playlist-play',
    path: '/queue',
    text: t('sidebar.Queue'),
  },
  {
    type: 'link',
    icon: 'mdi-cloud-download',
    path: '/downloads',
    text: t('sidebar.Downloads'),
  },
  {
    type: 'link',
    icon: 'mdi-cloud-upload',
    path: '/uploads',
    text: t('sidebar.Uploads'),
  },
]);

const railedNavigation = computed(() => display.xs.value);

const rightSidebar = ref(false);

const devSync = (event: MouseEvent) => {
  syncDB(event.shiftKey);
};
</script>

<template>
  <v-app>
    <div
      class="bg-black z-30 fixed top-0 left-0 w-full h-full transition-all"
      :class="rightSidebar ? 'opacity-25' : 'opacity-0 invisible'"
      @click="rightSidebar = false"
    ></div>

    <v-footer class="playback-sheet fixed bottom-0 z-50 w-full m-0 p-0 h-24">
      <v-sheet class="m-0 p-0 w-full h-full flex flex-col">
        <v-divider />
        <div class="px-1 flex-1 flex items-center">
          <playback-control />
        </div>
      </v-sheet>
    </v-footer>

    <v-navigation-drawer
      :model-value="rightSidebar"
      temporary
      position="right"
      :theme="theme.rightSidebarTheme"
      :width="400"
      hide-overlay
      class="!z-40"
    >
      <div class="flex flex-col h-full">
        <v-sheet tile>
          <div class="title flex items-center py-1">
            <v-icon class="mx-4">mdi-playlist-play</v-icon>
            <span class="flex-1">{{ t('queue.PlayQueue') }}</span>
            <v-btn flat icon size="small" @click="rightSidebar = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          <v-divider />
        </v-sheet>
        <div class="flex-1 overflow-y-auto overflow-x-hidden">
          <Queue />
        </div>
        <div class="h-24"></div>
      </div>
    </v-navigation-drawer>

    <v-app-bar flat :border="1" density="compact" :theme="theme.headerTheme">
      <div class="ml-0 pl-4 pr-12 hidden-xs-only leading-tight">
        <span class="text-xl">streamist</span>
        <span class="text-sm">.app</span>
      </div>
      <v-text-field
        density="compact"
        prepend-inner-icon="mdi-magnify"
        hide-details
        :label="t('header.Search')"
      />
      <v-spacer />
      <div class="flex gap-x-2">
        <v-btn icon size="small" @click="devSync">
          <v-icon>mdi-sync</v-icon>
        </v-btn>
        <v-btn icon size="small" @click="uploadDialog = true">
          <v-icon>mdi-cloud-upload</v-icon>
        </v-btn>
        <v-btn icon size="small" @click="rightSidebar = true">
          <v-icon>mdi-playlist-play</v-icon>
        </v-btn>
      </div>
    </v-app-bar>

    <v-navigation-drawer
      permanent
      position="left"
      :rail="railedNavigation"
      rail-width="56"
    >
      <v-list dense class="overflow-x-hidden">
        <template v-for="(item, index) in navItems" :key="index">
          <template v-if="item.type === 'link'">
            <v-list-item link :to="item.path">
              <v-list-item-avatar icon class="flex items-center justify-center">
                <v-icon>{{ item.icon }}</v-icon>
              </v-list-item-avatar>
              <v-list-item-header v-show="!railedNavigation" class="px-4">
                {{ item.text }}
              </v-list-item-header>
            </v-list-item>
          </template>
          <template v-else-if="item.type === 'divider'">
            <v-divider />
          </template>
        </template>
      </v-list>
      <div class="h-24"></div>
    </v-navigation-drawer>

    <v-main :class="theme.bgClass">
      <v-sheet tile :theme="theme.contentTheme" :class="theme.bgClass">
        <router-view />
      </v-sheet>
      <div class="h-24"></div>
    </v-main>

    <v-dialog v-model="uploadDialog">
      <v-card class="min-w-xl">
        <v-card-title>Upload</v-card-title>
        <v-card-text class="opacity-100">
          <div>
            <h3>Add file</h3>
            <v-file-input v-model="files" />
          </div>
          <div>
            <h3>Files</h3>
            <v-list dense>
              <v-list-subheader class="uppercase">In progress</v-list-subheader>
              <v-list-item>
                <v-list-item-header>
                  <v-list-item-title>example1.mp3</v-list-item-title>
                </v-list-item-header>
              </v-list-item>
              <v-list-item>
                <v-list-item-header>
                  <v-list-item-title>example2.mp3</v-list-item-title>
                </v-list-item-header>
              </v-list-item>
              <v-list-item>
                <v-list-item-header>
                  <v-list-item-title>example3.wav</v-list-item-title>
                  <v-list-item-subtitle>example3.cue</v-list-item-subtitle>
                </v-list-item-header>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" text @click="uploadDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>
