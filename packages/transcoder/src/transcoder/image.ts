import { unlink } from 'node:fs/promises';
import {
  generateImageId,
  generateTranscodedImageFileId,
} from '$shared-server/generateId';
import {
  osDeleteManaged,
  osGetFile,
  osPutFile,
} from '$shared-server/objectStorage';
import {
  getSourceFileKey,
  getSourceFileOS,
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
} from '$shared/objectStorage';
import { UploadJSONStorage, uploadJSON } from '../execAndLog';
import { calcImageDHash, probeImage, transcodeImage } from '../mediaTools';
import { getTempFilepath } from '../tempFile';
import { TRANSCODED_FILE_CACHE_CONTROL } from '../transcodedFileConfig';
import type {
  TranscoderRequestFileImage,
  TranscoderRequestFileImageExtracted,
  TranscoderResponseArtifactImage,
  TranscoderResponseArtifactImageFile,
} from '../types/transcoder';
import { TranscodeError } from './error';
import { getTranscodeImageFormats } from './imageFormats';

export async function processImageRequest(
  file: TranscoderRequestFileImage | TranscoderRequestFileImageExtracted
): Promise<TranscoderResponseArtifactImage> {
  const createdFiles: string[] = [];
  const uploadedTranscodedImageKeys: string[] = [];

  const { extracted, region, sourceFileId, sourceId, userId } = file;

  const logStorage: UploadJSONStorage = {
    userId,
    sourceId,
    sourceFileId,
    region,
  };

  await uploadJSON('image_request', logStorage, {
    userId,
    input: file,
  });

  const os = getTranscodedImageFileOS(region);

  try {
    const transcodedFiles: TranscoderResponseArtifactImageFile[] = [];

    const imageId = await generateImageId();

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
          getSourceFileKey(userId, sourceId, sourceFileId),
          sourceImageFilepath,
          'sha256'
        )
      )[1];
    }

    const imageInfoList = await probeImage(sourceImageFilepath, logStorage);
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
    // TODO(perf)?: 並列化
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

      createdFiles.push(transcodedImageFilepath);
      await transcodeImage(
        imageFormat.name,
        sourceImageFilepath,
        transcodedImageFilepath,
        comment,
        width,
        height,
        imageFormat.quality,
        logStorage
      );

      const key = getTranscodedImageFileKey(
        userId,
        imageId,
        transcodedImageFileId,
        imageFormat.extension
      );
      uploadedTranscodedImageKeys.push(key);
      const [fileSize, sha256] = await osPutFile(
        os,
        key,
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
        fileSize,
        sha256,
        width,
        height,
      });
    }

    // dHash計算
    // アップロード待機前に行うことで効率化を図る
    const dHash = await calcImageDHash(sourceImageFilepath, logStorage);

    await unlink(sourceImageFilepath);

    const artifact: TranscoderResponseArtifactImage = {
      type: 'image',
      source: file,
      id: imageId,
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

    await uploadJSON('image_result', logStorage, {
      userId,
      input: file,
      artifact,
    });

    return artifact;
  } catch (error: unknown) {
    try {
      await Promise.allSettled(createdFiles.map(unlink));
      await osDeleteManaged(os, uploadedTranscodedImageKeys, true);
    } catch (_error: unknown) {
      // エラーになっても良い
    }

    throw error;
  }
}
