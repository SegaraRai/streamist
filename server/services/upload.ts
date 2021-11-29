/*
楽曲アップロード時のフロー

1. [CLIENT] 依存関係を整理して、最小のファイル構成に分割する
   - 複数ファイルになるのはCUE+WAV等の場合のみで、画像等は依存関係の存在する異なるファイル構成として扱う
   - 例えばCover.jpg + CDImage.cue + CDImage.wavのような構成の場合、「CDImage.cue + CDImage.wav」を先にアップロードし、次に「Cover.jpg」を対象のアルバムIDを指定してアップロードする
    - このような面倒くさい依存関係は全てクライアント側で処理させる（処理する必要があるのは画像のみのはず）
  - ただし音声に画像が埋め込まれている場合のため、トランスコーダ側でも一部の依存関係を処理する必要がある
2. サーバーにファイル構成を贈り、ファイル数分のアップロードURLをリクエストする
   - サーバーはトラック数が上限に達していた場合これを拒否する
3. [CLIENT] アップロードを行い、全て完了したらサーバーに伝える
   - 完了通知についてはS3から受け取っても良いかもしれない
   - 完了通知がされないまま長時間経過したものや、アップロードが不完全なまま長時間経過したものについては後で別途削除する必要がある
4. [SERVER] Lambdaを呼び出して、アップロードされたファイルを処理させる
   - LambdaへのリクエストとLambdaからのレスポンスは同じコネクションでなくても問題ないが、Lambdaの仕様上同じコネクションのリクエストとレスポンスで行う
5. [SERVER] 結果を受け取り、DBに登録する
   - まあなんとかなるやろ
*/

// import { client } from '$/db/lib/client';
// import { dbTrackCount } from '$/db/track';
// import { HTTPError } from '$/utils/httpError';
// import { generateSourceFileId, generateSourceId } from '$/utils/id';

export type UploadFileType = 'image' | 'audio';

export interface UploadAudioFile {
  readonly fileName: string;
  readonly fileSize: number;
  readonly fileType: 'audio';
}

export interface UploadImageFile {
  readonly fileName: string;
  readonly fileSize: number;
  readonly fileType: 'image';
  readonly albumId: string;
}

export interface UploadResultFile {
  readonly presignedURL: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly sourceFileId: string;
}

export interface UploadResult {
  readonly sourceId: string;
  readonly files: readonly UploadResultFile[];
}

/*
export async function uploadAudio(
  userId: string,
  files: readonly UploadAudioFile[]
): Promise<UploadResult> {
  // TODO: check number of tracks
  if ((await dbTrackCount(userId)) >= 100) {
    throw new HTTPError(403, 'Too many tracks');
  }

  const sourceId = await generateSourceId();

  const resultFiles: UploadResultFile[] = [];
  for (const file of files) {
    resultFiles.push({
      presignedURL: '',
      fileName: file.fileName,
      fileSize: file.fileSize,
      sourceFileId: await generateSourceFileId(),
    });
  }

  // register to database

  client.

  return {
    sourceId,
    files: resultFiles,
  };
}

// */
