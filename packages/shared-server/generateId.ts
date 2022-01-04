import { encodeBase32 } from './base32.js';
import { randomBytesAsync } from './randomBytesAsync.js';

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

export const idLength = 32;

async function generateRandomPart(): Promise<string> {
  return encodeBase32(await randomBytesAsync(10)).slice(-16);
}

let gCounter = 0;
function generateTimestampPart(): string {
  gCounter = (gCounter + 1) % 1000;
  return (Date.now() * 1000 + gCounter)
    .toString(32)
    .padStart(12, '0')
    .slice(-12);
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
