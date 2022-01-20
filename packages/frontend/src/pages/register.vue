<route lang="yaml">
meta:
  layout: auth
</route>

<script lang="ts">
import {
  ACCOUNT_PASSWORD_MAX_LENGTH,
  ACCOUNT_PASSWORD_MIN_LENGTH,
  ACCOUNT_PASSWORD_REGEX,
  ACCOUNT_PREFERENCE_DEFAULT_REGION,
  ACCOUNT_USERNAME_MAX_LENGTH,
  ACCOUNT_USERNAME_MIN_LENGTH,
  ACCOUNT_USERNAME_REGEX,
} from '$shared/config';
import { OSRegion, getOSRegions } from '$shared/objectStorage';
import logoSVG from '~/assets/logo_colored.svg';
import { authenticate } from '~/logic/tokens';
import { unAuthAPI } from '~/logic/unAuthAPI';

function checkUsername(username: string): boolean {
  return (
    username.length >= ACCOUNT_USERNAME_MIN_LENGTH &&
    username.length <= ACCOUNT_USERNAME_MAX_LENGTH &&
    ACCOUNT_USERNAME_REGEX.test(username)
  );
}

function checkPassword(password: string): boolean {
  return (
    password.length >= ACCOUNT_PASSWORD_MIN_LENGTH &&
    password.length <= ACCOUNT_PASSWORD_MAX_LENGTH &&
    ACCOUNT_PASSWORD_REGEX.test(password)
  );
}

export default defineComponent({
  setup() {
    const router = useRouter();
    const { t } = useI18n();

    useHead({
      title: t('title.Register'),
    });

    const regionOptions$$q = eagerComputed(() =>
      getOSRegions().map((region) => ({
        value: region.region,
        label: t(`regions.${region.region}`),
      }))
    );

    const requestInProgress$$q = ref(false);

    const username$$q = ref('');
    const password$$q = ref('');
    const displayName$$q = ref('');
    const region$$q = ref<OSRegion>(ACCOUNT_PREFERENCE_DEFAULT_REGION);
    const hCaptchaResponse$$q = ref<string | null>(null);

    const isUsernameAvailableInternal = ref<true | false | undefined>();
    const checkedUsername = ref<string | undefined>();
    debouncedWatch(
      username$$q,
      (username: string) => {
        isUsernameAvailableInternal.value = undefined;
        checkedUsername.value = undefined;

        if (!checkUsername(username$$q.value)) {
          return;
        }

        unAuthAPI.accounts
          .$get({
            query: {
              username,
            },
          })
          .then((response) => {
            isUsernameAvailableInternal.value = !response.exists;
            checkedUsername.value = username;
          });
      },
      {
        debounce: 500,
      }
    );

    const usernameAvailability$$q = computed<
      true | false | 'checking' | undefined
    >(() => {
      if (!checkUsername(username$$q.value)) {
        return undefined;
      }
      return checkedUsername.value === username$$q.value
        ? isUsernameAvailableInternal.value
        : 'checking';
    });

    const isValid$$q = computed<boolean>(
      (): boolean =>
        checkUsername(username$$q.value) &&
        checkPassword(password$$q.value) &&
        !!displayName$$q.value &&
        !!region$$q.value &&
        hCaptchaResponse$$q.value != null &&
        usernameAvailability$$q.value === true
    );

    if (import.meta.env.DEV) {
      useIntervalFn((): void => {
        hCaptchaResponse$$q.value = 'dummy';
      }, 500);
    }

    return {
      t,
      logoSVG$$q: logoSVG,
      requestInProgress$$q,
      username$$q,
      password$$q,
      displayName$$q,
      region$$q,
      isValid$$q,
      usernameAvailability$$q,
      regionOptions$$q,
      ACCOUNT_PASSWORD_MAX_LENGTH$$q: ACCOUNT_PASSWORD_MAX_LENGTH,
      ACCOUNT_PASSWORD_MIN_LENGTH$$q: ACCOUNT_PASSWORD_MIN_LENGTH,
      ACCOUNT_USERNAME_MAX_LENGTH$$q: ACCOUNT_USERNAME_MAX_LENGTH,
      ACCOUNT_USERNAME_MIN_LENGTH$$q: ACCOUNT_USERNAME_MIN_LENGTH,
      passwordRules$$q: computed(() => [
        (value: string): string | true =>
          value.length >= ACCOUNT_PASSWORD_MIN_LENGTH ||
          t('validation.password.minLength', [ACCOUNT_PASSWORD_MIN_LENGTH]),
        (value: string): string | true =>
          value.length <= ACCOUNT_PASSWORD_MAX_LENGTH ||
          t('validation.password.maxLength', [ACCOUNT_PASSWORD_MAX_LENGTH]),
        (value: string): string | true =>
          ACCOUNT_PASSWORD_REGEX.test(value) || t('validation.password.regex'),
      ]),
      usernameRules$$q: computed(() => [
        (value: string): string | true =>
          value.length >= ACCOUNT_USERNAME_MIN_LENGTH ||
          t('validation.username.minLength', [ACCOUNT_USERNAME_MIN_LENGTH]),
        (value: string): string | true =>
          value.length <= ACCOUNT_USERNAME_MAX_LENGTH ||
          t('validation.username.maxLength', [ACCOUNT_USERNAME_MAX_LENGTH]),
        (value: string): string | true =>
          ACCOUNT_USERNAME_REGEX.test(value) || t('validation.username.regex'),
      ]),
      updateHCaptchaResponse$$q: (response: string | null): void => {
        hCaptchaResponse$$q.value = response;
      },
      register$$q() {
        if (
          requestInProgress$$q.value ||
          !hCaptchaResponse$$q.value ||
          !isValid$$q.value
        ) {
          return;
        }

        const username = username$$q.value;
        const password = password$$q.value;

        requestInProgress$$q.value = true;
        unAuthAPI.accounts
          .$post({
            body: {
              username,
              password,
              displayName: displayName$$q.value,
              region: region$$q.value,
            },
            query: {
              captchaResponse: hCaptchaResponse$$q.value,
            },
          })
          .then(() => authenticate(username$$q.value, password$$q.value))
          .then(() => {
            router.push('/');
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
  <div class="flex items-center justify-center h-full">
    <v-card class="elevation-4 max-w-xl flex-1">
      <v-card-header>
        <v-card-header-text class="flex items-center gap-x-2 text-2xl">
          <img
            :src="logoSVG$$q"
            width="128"
            height="128"
            class="block w-7 h-7 pointer-events-none select-none"
            alt="Streamist Logo"
          />
          <span>{{ t('register.title') }}</span>
        </v-card-header-text>
      </v-card-header>
      <v-card-text>
        <v-form style="--s-autofill-bg: #0003; --s-autofill-text: inherit">
          <v-text-field
            v-model="username$$q"
            name="username"
            type="text"
            autocomplete="off"
            required
            prepend-inner-icon="mdi-account"
            :label="t('register.label.Username')"
            :hint="t('register.description.Username')"
            :minlength="ACCOUNT_USERNAME_MIN_LENGTH$$q"
            :maxlength="ACCOUNT_USERNAME_MAX_LENGTH$$q"
            :rules="usernameRules$$q"
            :error="usernameAvailability$$q === false"
            counter
          >
            <template #appendInner>
              <template v-if="usernameAvailability$$q != null">
                <div class="w-4 h-4 flex items-center justify-center">
                  <template v-if="usernameAvailability$$q === 'checking'">
                    <v-progress-circular
                      class="absolute"
                      indeterminate
                      size="16"
                      color="primary"
                    />
                  </template>
                  <template v-else-if="usernameAvailability$$q">
                    <n-popover placement="top" trigger="hover">
                      <template #trigger>
                        <i-mdi-check class="w-4 h-4 text-st-success" />
                      </template>
                      <div>
                        {{ t('register.tooltip.UsernameAvailable') }}
                      </div>
                    </n-popover>
                  </template>
                  <template v-else>
                    <n-popover placement="top" trigger="hover">
                      <template #trigger>
                        <i-mdi-close class="w-4 h-4 text-st-error" />
                      </template>
                      <div>
                        {{ t('register.tooltip.UsernameAlreadyTaken') }}
                      </div>
                    </n-popover>
                  </template>
                </div>
              </template>
            </template>
          </v-text-field>
          <v-text-field
            v-model="password$$q"
            name="password"
            type="password"
            autocomplete="off"
            required
            prepend-inner-icon="mdi-lock"
            :label="t('register.label.Password')"
            :minlength="ACCOUNT_PASSWORD_MIN_LENGTH$$q"
            :maxlength="ACCOUNT_PASSWORD_MAX_LENGTH$$q"
            :rules="passwordRules$$q"
            counter
          />
          <v-text-field
            v-model="displayName$$q"
            type="text"
            autocomplete="off"
            required
            prepend-inner-icon="mdi-account-box"
            hide-details
            :label="t('register.label.DisplayName')"
          />
          <!-- TODO: migrate to v-select -->
          <div class="mb-8">
            <n-select v-model:value="region$$q" :options="regionOptions$$q" />
          </div>
          <s-h-captcha site-key="x" @update="updateHCaptchaResponse$$q" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          flat
          text
          color="primary"
          :disabled="!isValid$$q"
          @click="register$$q"
        >
          <span :class="requestInProgress$$q && 'invisible'">
            {{ t('register.button.Register') }}
          </span>
          <template v-if="requestInProgress$$q">
            <v-progress-circular
              class="absolute left-0 top-0 right-0 bottom-0 m-auto"
              indeterminate
              size="20"
            />
          </template>
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
