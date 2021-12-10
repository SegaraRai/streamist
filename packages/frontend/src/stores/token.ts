import { acceptHMRUpdate, defineStore } from 'pinia';
import api from '@/logic/api';

export const useTokenStore = defineStore('token', () => {
  // TODO: load from local storage
  let tokenPromiseResolve: (token: string) => void;
  let tokenPromiseReject: (error: unknown) => void;
  const tokenPromise = ref(
    new Promise<string>((resolve, reject) => {
      tokenPromiseResolve = resolve;
      tokenPromiseReject = reject;
    })
  );
  const token = ref<string | undefined>();
  const fetching = ref(false);

  const forceRenew = async () => {
    try {
      const res = await api.token.$post({
        body: {
          id: 'usc1',
          pass: 'password',
        },
      });
      fetching.value = false;
      token.value = res.token;
      tokenPromiseResolve(res.token);
      tokenPromise.value = Promise.resolve(res.token);
    } catch (error) {
      fetching.value = false;
      token.value = undefined;
      tokenPromiseReject(error);
      tokenPromise.value = Promise.reject(error);
    }
  };

  const renew = async () => {
    // TODO: check expiration
    await forceRenew();
  };

  forceRenew();

  return {
    fetching,
    token,
    tokenPromise,
    forceRenew() {
      forceRenew();
    },
    renew() {
      renew();
    },
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTokenStore, import.meta.hot));
}
