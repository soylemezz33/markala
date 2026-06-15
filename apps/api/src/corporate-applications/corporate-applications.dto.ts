import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewCorporateDto {
  @IsIn(["approved", "rejected"])
  status!: "approved" | "rejected";

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}
