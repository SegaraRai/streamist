<route lang="yaml">
meta:
  layout: app
</route>

<script lang="ts">
import { useMessage } from 'naive-ui';
import { ACCOUNT_PREFERENCE_DEFAULT_REGION } from '$shared/config';
import { OSRegion, getOSRegions } from '$shared/objectStorage';
import type { ResourceUser } from '$/types';
import { useLocalStorageDB, useSyncDB } from '~/db';
import { api } from '~/logic/api';
import { convertReqStr } from '~/logic/editUtils';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const message = useMessage();
    const syncDB = useSyncDB();
    const { dbUser$$q } = useLocalStorageDB();

    const regionOptions$$q = eagerComputed(() =>
      getOSRegions().map((region) => ({
        value: region.region,
        label: t(`regions.${region.region}`),
      }))
    );

    const requestInProgress$$q = ref(false);

    const itemDisplayName$$q = ref('');
    const itemRegion$$q = ref<OSRegion>(ACCOUNT_PREFERENCE_DEFAULT_REGION);

    const reloadData = (newUser: ResourceUser): void => {
      console.log('reloadData', newUser);
      requestInProgress$$q.value = false;
      itemDisplayName$$q.value = newUser.displayName;
      itemRegion$$q.value = newUser.region;
    };

    onBeforeMount(() => {
      if (dbUser$$q.value) {
        reloadData(dbUser$$q.value);
      }
    });

    const modified$$q = eagerComputed(
      () =>
        dbUser$$q.value &&
        ((itemDisplayName$$q.value &&
          itemDisplayName$$q.value !== dbUser$$q.value.displayName) ||
          itemRegion$$q.value !== dbUser$$q.value.region)
    );

    return {
      t,
      regionOptions$$q,
      requestInProgress$$q,
      itemDisplayName$$q,
      itemRegion$$q,
      modified$$q,
      apply$$q: () => {
        if (requestInProgress$$q.value) {
          return;
        }

        const user = dbUser$$q.value;
        if (!user) {
          return;
        }

        requestInProgress$$q.value = true;

        api.my.account
          .$patch({
            body: {
              displayName: convertReqStr(
                itemDisplayName$$q.value,
                user.displayName
              ),
              region: convertReqStr(itemRegion$$q.value, user.region) as
                | OSRegion
                | undefined,
            },
          })
          .then(() => {
            message.success(t('message.ModifiedAccountSettings'));
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToModifyAccountSettings', [String(error)])
            );
          })
          .finally(() => {
            requestInProgress$$q.value = false;
          });
      },
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-0">
    <div class="flex flex-col gap-y-4">
      <header class="s-title">
        <h1 class="text-h5">
          {{ t('settings.account.title') }}
        </h1>
      </header>
      <div class="flex flex-col gap-y-8">
        <div class="flex flex-col gap-y-4">
          <h2 class="text-xl">
            {{ t('settings.account.header.DisplayName') }}
          </h2>
          <div class="w-64">
            <n-input
              v-model:value="itemDisplayName$$q"
              type="text"
              autocomplete="off"
              required
            />
          </div>
        </div>
        <div class="flex flex-col gap-y-4">
          <h2 class="text-xl">
            {{ t('settings.account.header.Region') }}
          </h2>
          <div class="w-64">
            <!-- TODO: migrate to v-select -->
            <n-select
              v-model:value="itemRegion$$q"
              :options="regionOptions$$q"
            />
          </div>
        </div>
      </div>
      <div class="mt-8">
        <v-btn
          class="relative"
          color="primary"
          :disabled="requestInProgress$$q || !modified$$q"
          @click="apply$$q"
        >
          <span :class="requestInProgress$$q && 'invisible'">
            {{ t('settings.account.button.Save') }}
          </span>
          <template v-if="requestInProgress$$q">
            <v-progress-circular
              class="absolute left-0 top-0 right-0 bottom-0 m-auto"
              indeterminate
              size="20"
            />
          </template>
        </v-btn>
      </div>
    </div>
  </v-container>
</template>
