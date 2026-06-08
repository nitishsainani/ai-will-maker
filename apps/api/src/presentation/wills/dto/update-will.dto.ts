import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateWillDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  testatorName?: string;
}
