import { IsId, IsNullable } from './utils';

export class VTrackOrderUpdateBody {
  @IsNullable()
  @IsId()
  nextTrackId!: string | null;
}
