import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  Equals,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { is } from '$shared/is';
import type { Region } from '$shared/regions';
import type { SourceFileAttachToType, SourceFileState } from '$shared/types/db';
import {
  CreateSourceRequestAudio,
  CreateSourceRequestFileAudio,
  CreateSourceRequestFileCueSheet,
  CreateSourceRequestFileImage,
  CreateSourceRequestImage,
} from '$/types';
import { IsId, IsNullable, IsRegion, IsUndefinable } from './utils';

class VSourceCreateBodyAudioFile implements CreateSourceRequestFileAudio {
  @Equals('audio')
  type!: 'audio';

  @IsString()
  filename!: string;

  @IsInt()
  @Min(1)
  fileSize!: number;
}

class VSourceCreateBodyCueSheetFile implements CreateSourceRequestFileCueSheet {
  @Equals('cueSheet')
  type!: 'cueSheet';

  @IsString()
  filename!: string;

  @IsInt()
  @Min(1)
  fileSize!: number;
}

class VSourceCreateBodyImageFile implements CreateSourceRequestFileImage {
  @Equals('image')
  type!: 'image';

  @IsString()
  filename!: string;

  @IsInt()
  @Min(1)
  fileSize!: number;
}

class VSourceCreateBodyAudio implements CreateSourceRequestAudio {
  @Equals('audio')
  type!: 'audio';

  @IsRegion()
  region!: Region;

  @ValidateNested()
  @Type(() => VSourceCreateBodyAudioFile)
  audioFile!: VSourceCreateBodyAudioFile;

  @IsNullable()
  @ValidateNested()
  @Type(() => VSourceCreateBodyCueSheetFile)
  cueSheetFile!: VSourceCreateBodyCueSheetFile | null;
}

class VSourceCreateBodyImage implements CreateSourceRequestImage {
  @Equals('image')
  type!: 'image';

  @IsRegion()
  region!: Region;

  @IsIn(is<SourceFileAttachToType[]>(['album', 'artist', 'playlist']))
  attachToType!: SourceFileAttachToType;

  @IsId()
  attachToId!: string;

  @IsBoolean()
  attachPrepend!: boolean;

  @ValidateNested()
  @Type(() => VSourceCreateBodyImageFile)
  imageFile!: VSourceCreateBodyImageFile;
}

export class VSourceCreateBodyWrapper {
  @ValidateNested()
  @IsObject({
    message: 'type must be either "audio" or "image"',
  })
  @Type(() => Boolean, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: VSourceCreateBodyAudio, name: 'audio' },
        { value: VSourceCreateBodyImage, name: 'image' },
      ],
    },
  })
  '!payload'!: VSourceCreateBodyAudio | VSourceCreateBodyImage;
}

export class VSourceFinishUploadBody {
  @IsString()
  @Equals('uploaded')
  state!: SourceFileState & 'uploaded';

  @IsUndefinable()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  parts?: string[];
}
