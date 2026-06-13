import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class SetCorporateStatusDto {
  @IsIn(["approved", "rejected", "pending"])
  status!: "approved" | "rejected" | "pending";

  @IsString() @IsOptional() @MaxLength(1000)
  reviewNote?: string;
}
