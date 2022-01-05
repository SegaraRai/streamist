// ffprobe型定義

// タグは一部のフォーマットで大文字なことがあるので注意
// ノーマライズの際にハイフンとかアンダースコアとかを削除する
export interface FFprobeTags extends Record<string, string | undefined> {
  album?: string; // アルバム
  artist?: string; // アーティスト
  albumartist?: string; // アルバムアーティスト
  comment?: string; // コメント
  composer?: string; // 作曲家
  copyright?: string; // コピーライト
  encoder?: string; // エンコードに使用したソフトウェア等
  disc?: string; // ディスク番号、"N/M"形式も"N"形式もある
  date?: string; // 日付、年だけとか年月日とかに対応すると良さそう
  genre?: string; // ジャンル、形式は不明
  title?: string; // タイトル
  track?: string; // 曲番号、"N/M"形式も"N"形式もある、もしかしたらここにディスク番号がある場合もあるかも？

  // CUEシート
  cuesheet?: string;

  // 以下mora

  genrenumber?: string; // 空値
  mood?: string; // 空値
  organization?: string; // なんか入ってた
  performer?: string; // 空値、artistを優先し、artistがない場合これを用いてみることにする

  // 以下独自

  arranger?: string; // 編曲
  lyricist?: string; // 作詞

  // 歌詞

  lyric?: string;
  lyrics?: string;

  // sort

  albumsort?: string;
  albumartistsort?: string; // album_artist_sortを優先すること
  arrangersort?: string;
  artistsort?: string;
  composersort?: string;
  lyricistsort?: string;
  performersort?: string; // artist_sortを優先すること
  titlesort?: string;
}

export interface FFprobeDisposition {
  default: number;
  dub: number;
  original: number;
  comment: number;
  lyrics: number;
  karaoke: number;
  forced: number;
  hearing_impaired: number;
  visual_impaired: number;
  clean_effects: number;
  attached_pic: number;
  timed_thumbnails: number;
}

export interface FFprobeStreamBase {
  index: number;
  codec_name: string;
  codec_long_name: string;
  codec_type: string;
  codec_time_base: string;
  codec_tag_string: string;
  codec_tag: string;
  r_frame_rate: string;
  avg_frame_rate: string;
  time_base: string;
  start_pts: number;
  start_time: string;
  duration_ts: number;
  duration: string;
  nb_frames?: string;
  disposition: FFprobeDisposition;
  tags?: FFprobeTags;

  // with -count_frames enabled
  // nb_read_frames: string;
}

export interface FFprobeStreamAudio extends FFprobeStreamBase {
  codec_type: 'audio';
  sample_fmt: string;
  sample_rate: string;
  channels: number;
  channel_layout: string;
  bits_per_sample: number;
}

export interface FFprobeStreamVideo extends FFprobeStreamBase {
  codec_type: 'video';
  width: number;
  height: number;
  coded_width: number;
  coded_height: number;
  has_b_frames: number;
  sample_aspect_ratio: string;
  display_aspect_ratio: string;
  pix_fmt: string;
  level: number;
  refs: number;
}

export type FFprobeStream = FFprobeStreamAudio | FFprobeStreamVideo;

export interface FFprobeFormat {
  filename: string;
  nb_streams: number;
  nb_programs: number;
  format_name: string;
  format_long_name: string;
  start_time: string;
  duration: string;
  size: string;
  bit_rate: string;
  probe_score: number;
  tags?: FFprobeTags;
}

export interface FFprobeResult {
  streams: FFprobeStream[];
  format: FFprobeFormat;
}
