import { Module } from "@nestjs/common";
import { CorporateLedgerService } from "./corporate-ledger.service";
import {
  CorporateLedgerAdminController,
  CorporateLedgerMeController,
} from "./corporate-ledger.controller";

@Module({
  controllers: [CorporateLedgerAdminController, CorporateLedgerMeController],
  providers: [CorporateLedgerService],
  exports: [CorporateLedgerService],
})
export class CorporateLedgerModule {}
