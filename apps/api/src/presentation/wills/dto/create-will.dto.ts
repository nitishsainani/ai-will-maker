import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateWillDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  testatorName?: string;
}
