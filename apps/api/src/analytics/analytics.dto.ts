import { IsString, IsOptional, IsObject, IsIn } from "class-validator";
import { ALL_EVENT_NAMES, type EventName } from "./event-taxonomy";

export class TrackEventDto {
  @IsIn(ALL_EVENT_NAMES)
  eventName: EventName;

  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;
}

export class FunnelQueryDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
