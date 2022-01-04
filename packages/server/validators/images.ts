import { IsId, IsNullable } from './utils';

export class VImageOrderUpdateBody {
  @IsNullable()
  @IsId()
  nextImageId!: string | null;
}
