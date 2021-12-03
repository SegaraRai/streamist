# 楽曲アップロード時のフロー

1. [CLIENT] 依存関係を整理して、最小のファイル構成に分割する
   - 複数ファイルになるのは CUE+WAV 等の場合のみで、画像等は依存関係の存在する異なるファイル構成として扱う
   - 例えば Cover.jpg + CDImage.cue + CDImage.wav のような構成の場合、「CDImage.cue + CDImage.wav」を先にアップロードし、次に「Cover.jpg」を対象のアルバム ID を指定してアップロードする
     - このような面倒くさい依存関係は全てクライアント側で処理させる（処理する必要があるのは画像のみのはず）
   - ただし音声に画像が埋め込まれている場合のため、トランスコーダ側でも一部の依存関係を処理する必要がある
2. サーバーにファイル構成を送り、ファイル数分のアップロード URL をリクエストする
   - サーバーはトラック数が上限に達していた場合これを拒否する
3. [CLIENT] アップロードを行い、全て完了したらサーバーに伝える
   - 完了通知については S3 から受け取っても良いかもしれない
   - 完了通知がされないまま長時間経過したものや、アップロードが不完全なまま長時間経過したものについては後で別途削除する必要がある
4. [SERVER] Lambda を呼び出して、アップロードされたファイルを処理させる
   - Lambda へのリクエストと Lambda からのレスポンスは同じコネクションでなくても問題ないが、Lambda の仕様上同じコネクションのリクエストとレスポンスで行う
5. [SERVER] 結果を受け取り、DB に登録する
   - まあなんとかなるやろ

## DB スキーマ

Source File Table

- userId
- sourceId
- sourceFileId
- region
- status: 'Registered' | 'Uploaded' | 'Transcoding' | 'Completed'

## Transcoder

### Input

```ts
// 可能な限りシンプルに、性能は後で考える
// トランスコーダ側で新規にファイルが現れる可能性があるため、formatはトランスコーダ側で決定できる必要がある

interface TranscoderRequestAudio {
  type: 'audio';
  userId: string;
  sourceId: string;
  sourceFileId: string;
  cueSheetSourceFileId?: string;
  region: string;
}

interface TranscoderRequestImage {
  type: 'image';
  userId: string;
  sourceId: string;
  sourceFileId: string;
  albumId: string;
  region: string;
}

type TranscoderRequest = TranscoderRequestAudio | TranscoderRequestImage;
```

### Output

同じリクエストで処理する必要はない、が、Lambda を直接呼び出す場合はそうなるであろう

```ts
interface TranscoderResponseArtifactImageFile {
  fileId: string;
  name: string; // e.g. 'v1-jpeg-600'
  extension: string;
  fileSize: number;
  width: number;
  height: number;
  sha256: string;
}

interface TranscoderResponseArtifactAudioFile {
  fileId: string;
  name: string; // e.g. 'v1-opus-256k'
  extension: string;
  fileSize: number;
  duration: number;
  bitrate: number;
  sha256: string;
}

interface TranscoderResponseArtifactAudio {
  type: 'audio';
  main: true;
  files: TranscoderResponseArtifactAudioFile[];
  probe: TranscoderResponseArtifactAudioProbe;
  sha256: string;
}

interface TranscoderResponseArtifactImage {
  type: 'image';
  main: boolean; // `false` for extracted images
  files: TranscoderResponseArtifactImageFile[];
  probe: TranscoderResponseArtifactImageProbe;
  sha256: string;
}

interface TranscoderResponse {
  request: TranscoderRequest;
  artifacts: TranscoderResponseArtifact;
}
```
