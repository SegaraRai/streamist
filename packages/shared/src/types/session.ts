export type DeviceType = 'desktop' | 'mobile' | 'unknown';

export type ClientName =
  // web app
  | 'Streamist Web App'
  // installed (standalone) web app
  | 'Streamist PWA';

export interface SessionInfo {
  readonly client: ClientName;
  readonly type: DeviceType;
  /** 'Android', 'iPhone', 'macOS', 'Windows', etc. */
  readonly platform: string;
  /** model name, device name, etc. (if available) */
  readonly name: string;
}
