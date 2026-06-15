import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

export class CreateLegalPageDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug yalnızca küçük harf, rakam ve tire içerebilir",
  })
  slug!: string;

  @IsString() @MinLength(2)
  title!: string;

  @IsString()
  content!: string;

  @IsString() @IsOptional()
  version?: string;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}

export class UpdateLegalPageDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug yalnızca küçük harf, rakam ve tire içerebilir",
  })
  @IsOptional()
  slug?: string;

  @IsString() @MinLength(2) @IsOptional()
  title?: string;

  @IsString() @IsOptional()
  content?: string;

  @IsString() @IsOptional()
  version?: string;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}
