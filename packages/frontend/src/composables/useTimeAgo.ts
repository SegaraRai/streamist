import type { UseTimeAgoOptions } from '@vueuse/core';
import type { Ref } from 'vue';

export function useTranslatedTimeAgo(
  timestamp: Readonly<Ref<number>>,
  options?: UseTimeAgoOptions<false>
): Readonly<Ref<string>> {
  const { t, locale } = useI18n();

  const timeAgoRefRef = controlledComputed(locale, () => {
    return useTimeAgo(timestamp, {
      ...options,
      messages: {
        justNow: t('timeAgo.justNow'),
        past: (value: string) => t('timeAgo.past', [value]),
        future: (value: string) => t('timeAgo.future', [value]),
        year: (value: number) => t('timeAgo.year', value),
        month: (value: number) => t('timeAgo.month', value),
        day: (value: number) => t('timeAgo.day', value),
        week: (value: number) => t('timeAgo.week', value),
        hour: (value: number) => t('timeAgo.hour', value),
        minute: (value: number) => t('timeAgo.minute', value),
        second: (value: number) => t('timeAgo.second', value),
      },
    });
  });

  return eagerComputed((): string => timeAgoRefRef.value.value);
}
