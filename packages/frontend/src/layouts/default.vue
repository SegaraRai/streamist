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
    const etags: string[] = [];
    const queue = new PQueue({ concurrency: 4 });
    let offset = 0;
    for (const part of uploadURL.parts) {
      const etag = await queue.add(async (): Promise<string> => {
        const response = await fetch(part.url, {
          method: 'PUT',
          headers: {
            'Cache-Control': SOURCE_FILE_CACHE_CONTROL,
            'Content-Encoding': SOURCE_FILE_CONTENT_ENCODING,
            'Content-Length': `${part.size}`,
            'Content-Type': SOURCE_FILE_CONTENT_TYPE,
          },
          body: file.slice(offset, offset + part.size),
        });
        return response.headers.get('ETag')!;
      });
      offset += part.size;
      etags.push(etag);
    }
    return etags;
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
        uploaded: true,
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
            <v-list-item-title>{{ t('client/Home') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item link to="/albums">
          <v-list-item-action>
            <v-icon>mdi-album</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ t('client/Albums') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/artists">
          <v-list-item-action>
            <v-icon>mdi-account-music</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ t('client/Artists') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/tracks">
          <v-list-item-action>
            <v-icon>mdi-music</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ t('client/Tracks') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/playlists">
          <v-list-item-action>
            <v-icon>mdi-playlist-music</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ t('client/Playlists') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/tags">
          <v-list-item-action>
            <v-icon>mdi-pound</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ t('client/Tags') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item link to="/queue">
          <v-list-item-action>
            <v-icon>mdi-playlist-play</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ t('client/Queue') }}</v-list-item-title>
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
            <v-list-item-title>{{ t('client/Downloads') }}</v-list-item-title>
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
            <v-list-item-title>{{ t('client/Uploads') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item link to="/settings">
          <v-list-item-action>
            <v-icon>mdi-settings</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ t('client/Settings') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <template v-if="display.mdAndUp">
      <v-navigation-drawer
        app
        permanent
        clipped
        position="right"
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
        :label="t('client/Search')"
        class="textfield"
      />
      <v-spacer></v-spacer>
      <v-btn icon @click="syncDB">
        <v-icon>mdi-sync</v-icon>
      </v-btn>
      <v-btn icon @click="uploadDialog = true">
        <v-icon>mdi-cloud-upload</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main :class="theme.bgClass">
      <v-sheet tile :theme="theme.contentTheme" :class="theme.bgClass">
        <router-view></router-view>
      </v-sheet>

      <v-sheet tile class="playback-sheet position-fixed bottom-0">
        <v-divider></v-divider>
        <div class="pa-1">
          <playback-control />
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
              <v-subheader class="uppercase">In progress</v-subheader>
              <v-list-item-group color="primary">
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>example1.mp3</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>example2.mp3</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>example3.wav</v-list-item-title>
                    <v-list-item-subtitle>example3.cue</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" text @click="uploadDialog = false"
            >Close</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>
