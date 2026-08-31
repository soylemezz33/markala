import { Module } from "@nestjs/common";
import { CspController } from "./csp.controller";
import { CspService } from "./csp.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CspController],
  providers: [CspService],
})
export class CspModule {}
