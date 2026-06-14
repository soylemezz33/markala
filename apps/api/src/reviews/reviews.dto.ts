import { IsBoolean } from "class-validator";

export class SetApprovalDto {
  @IsBoolean()
  isApproved!: boolean;
}
