import { stat, unlink } from 'node:fs/promises';
import { generateTranscodedImageFileId } from '$shared-server/generateId.js';
import { osGetFile, osPutFile } from '$shared-server/objectStorage.js';
import {
  getSourceFileKey,
  getSourceFileOS,
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
} from '$shared-server/objectStorages.js';
import { calcImageDHash, probeImage, transcodeImage } from '../mediaTools.js';
import { getTempFilepath } from '../tempFile.js';
import { TRANSCODED_FILE_CACHE_CONTROL } from '../transcodedFileConfig.js';
import type {
  TranscoderRequestFileImage,
  TranscoderRequestFileImageExtracted,
  TranscoderResponseArtifactImage,
  TranscoderResponseArtifactImageFile,
} from '../types/transcoder.js';
import { TranscodeError } from './error.js';
import { getTranscodeImageFormats } from './imageFormats.js';

export async function processImageRequest(
  file: TranscoderRequestFileImage | TranscoderRequestFileImageExtracted
): Promise<TranscoderResponseArtifactImage> {
  const createdFiles: string[] = [];

  try {
    const { extracted, region, sourceFileId, sourceId, userId } = file;

    const transcodedFiles: TranscoderResponseArtifactImageFile[] = [];

    const sourceImageFilepath = extracted
      ? file.filePath
      : getTempFilepath(sourceFileId);

    createdFiles.push(sourceImageFilepath);

    // ユーザーがアップロードした画像ファイルをローカルにダウンロード
    let sourceFileSHA256: string;
    if (extracted) {
      sourceFileSHA256 = file.sha256;
    } else {
      sourceFileSHA256 = (
        await osGetFile(
          getSourceFileOS(region),
          getSourceFileKey(userId, sourceFileId),
          sourceImageFilepath,
          'sha256'
        )
      )[1];
    }

    const imageInfoList = await probeImage(
      userId,
      sourceFileId,
      sourceImageFilepath
    );
    if (imageInfoList.length < 1) {
      throw new TranscodeError(
        'invalid image file. failed to retrieve image information. [1]'
      );
    }

    const imageInfo = imageInfoList[0].image;
    if (!imageInfo) {
      throw new TranscodeError(
        'invalid image file. failed to retrieve image information. [2]'
      );
    }

    const sourceWidth = imageInfo.geometry.width;
    const sourceHeight = imageInfo.geometry.height;

    // トランスコード
    // TODO(pref)?: 並列化
    for (const imageFormat of getTranscodeImageFormats(
      imageInfoList,
      imageInfo
    )) {
      const transcodedImageFileId = await generateTranscodedImageFileId();
      const transcodedImageFilepath = getTempFilepath(
        transcodedImageFileId + imageFormat.extension
      );

      const scale = Math.min(
        1,
        imageFormat.maxWidth / sourceWidth,
        imageFormat.maxHeight / sourceHeight
      );
      const width = Math.round(sourceWidth * scale);
      const height = Math.round(sourceHeight * scale);

      const comment: string = [
        userId,
        sourceId,
        sourceFileId,
        transcodedImageFileId,
        imageFormat.name,
      ].join('\n');

      await transcodeImage(
        userId,
        sourceFileId,
        sourceImageFilepath,
        transcodedImageFilepath,
        comment,
        width,
        height,
        imageFormat.quality
      );
      createdFiles.push(transcodedImageFilepath);

      const fileStat = await stat(transcodedImageFilepath);

      const [, sha256] = await osPutFile(
        getTranscodedImageFileOS(region),
        getTranscodedImageFileKey(
          userId,
          transcodedImageFileId,
          imageFormat.extension
        ),
        transcodedImageFilepath,
        {
          cacheControl: TRANSCODED_FILE_CACHE_CONTROL,
          contentType: imageFormat.mimeType,
        },
        'sha256'
      );

      await unlink(transcodedImageFilepath);

      transcodedFiles.push({
        fileId: transcodedImageFileId,
        formatName: imageFormat.name,
        mimeType: imageFormat.mimeType,
        extension: imageFormat.extension,
        fileSize: fileStat.size,
        sha256,
        width,
        height,
      });
    }

    // dHash計算
    // アップロード待機前に行うことで効率化を図る
    const dHash = await calcImageDHash(
      userId,
      sourceFileId,
      sourceImageFilepath
    );

    await unlink(sourceImageFilepath);

    return {
      type: 'image',
      source: file,
      files: transcodedFiles,
      dHash,
      sha256: sourceFileSHA256,
      probe: {
        allMetadata: imageInfoList,
        width: sourceWidth,
        height: sourceHeight,
        metadata: imageInfo,
      },
    };
  } catch (error: unknown) {
    try {
      await Promise.all(createdFiles.map(unlink));
    } catch (_error: unknown) {
      // エラーになっても良い
    }

    throw error;
  }
}
