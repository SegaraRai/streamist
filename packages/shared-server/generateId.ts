import { randomBytes } from 'node:crypto';
import { encodeBase32 } from './base32';
import { randomBytesAsync } from './randomBytesAsync';

const enum IdTypeCode {
  Album = 'al',
  Artist = 'ar',
  Track = 'tr',
  Image = 'im',
  Text = 'te',
  Playlist = 'pl',
  Source = 'so',
  SourceFile = 'sf',
  AlbumCoArtist = 'ca',
  TrackCoArtist = 'ct',
  TranscodedAudioFile = 'fa',
  TranscodedImageFile = 'fi',
  User = 'us',
}

export const ID_LENGTH = 32;

const ID_TIMESTAMP_COUNTER_MOD = 1000;

let gCounter = randomBytes(4).readUInt32LE(0) % ID_TIMESTAMP_COUNTER_MOD;
function generateTimestampPart(): string {
  gCounter = (gCounter + 1) % ID_TIMESTAMP_COUNTER_MOD;
  return (Date.now() * ID_TIMESTAMP_COUNTER_MOD + gCounter)
    .toString(32)
    .padStart(12, '0')
    .slice(-12);
}

async function generateRandomPart(): Promise<string> {
  return encodeBase32(await randomBytesAsync(10)).slice(-16);
}

async function generateId(type: IdTypeCode): Promise<string> {
  const timestampCode: string = generateTimestampPart();
  const randomCode: string = await generateRandomPart();

  return `${type}-${timestampCode}-${randomCode}`;
}

export function generateAlbumId(): Promise<string> {
  return generateId(IdTypeCode.Album);
}

export function generateAlbumCoArtistId(): Promise<string> {
  return generateId(IdTypeCode.AlbumCoArtist);
}

export function generateArtistId(): Promise<string> {
  return generateId(IdTypeCode.Artist);
}

export function generateImageId(): Promise<string> {
  return generateId(IdTypeCode.Image);
}

export function generatePlaylistId(): Promise<string> {
  return generateId(IdTypeCode.Playlist);
}

export function generateSourceId(): Promise<string> {
  return generateId(IdTypeCode.Source);
}

export function generateSourceFileId(): Promise<string> {
  return generateId(IdTypeCode.SourceFile);
}

export function generateTextId(): Promise<string> {
  return generateId(IdTypeCode.Text);
}

export function generateTrackId(): Promise<string> {
  return generateId(IdTypeCode.Track);
}

export function generateTrackCoArtistId(): Promise<string> {
  return generateId(IdTypeCode.TrackCoArtist);
}

export function generateTranscodedAudioFileId(): Promise<string> {
  return generateId(IdTypeCode.TranscodedAudioFile);
}

export function generateTranscodedImageFileId(): Promise<string> {
  return generateId(IdTypeCode.TranscodedImageFile);
}

export function generateUserId(): Promise<string> {
  return generateId(IdTypeCode.User);
}
