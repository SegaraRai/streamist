export interface HCaptchaRenderParams {
  theme?: 'light' | 'dark';
  size?: 'compact' | 'normal';
  sitekey: string;
  callback: (response: string) => void;
  'expired-callback': (response: string) => void;
  'open-callback': () => void;
  'close-callback': () => void;
}

export interface HCaptcha {
  render(container: HTMLElement, params: HCaptchaRenderParams): string;
  reset(widgetID: string): void;
  // undocumented method
  remove(widgetID: string): void;
  execute(widgetID: string): void;
  getResponse(widgetID: string): string;
}
