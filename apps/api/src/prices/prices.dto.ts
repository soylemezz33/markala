// Faz B DTO placeholder — Faz B5+ tasks append to this file
import { IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class OptionInputDto {
  @IsString() @MaxLength(60) groupKey!: string;
  @IsString() @MaxLength(120) groupLabel!: string;
  @IsIn(["dimension", "priced"]) groupRole!: "dimension" | "priced";
  @IsInt() @Min(0) groupSort!: number;
  @IsString() @MaxLength(80) optionKey!: string;
  @IsString() @MaxLength(200) optionLabel!: string;
  @IsString() @IsOptional() @MaxLength(400) optionSublabel?: string;
  @IsInt() @Min(0) optionSort!: number;
}
export class SetOptionsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => OptionInputDto)
  options!: OptionInputDto[];
}
