import { IsObject, IsString, MinLength } from "class-validator";

export class UpsertSettingsDto {
  @IsString() @MinLength(1)
  group!: string;

  /** { "general.siteName": "Markala", ... } — değerler JSON-serileştirilebilir */
  @IsObject()
  values!: Record<string, unknown>;
}
