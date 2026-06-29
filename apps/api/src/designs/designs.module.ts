import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { DesignsController } from "./designs.controller";
import { DesignsService } from "./designs.service";
import { RenderService } from "./render.service";

@Module({
  imports: [StorageModule],
  controllers: [DesignsController],
  providers: [DesignsService, RenderService],
  exports: [DesignsService],
})
export class DesignsModule {}
