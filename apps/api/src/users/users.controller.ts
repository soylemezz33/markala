import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import type { Request } from "express";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users/me")
export class UsersController {
  constructor(private service: UsersService) {}

  @Patch()
  updateProfile(@Req() req: Request & { user: { sub: string } }, @Body() body: any) {
    return this.service.updateProfile(req.user.sub, body);
  }

  @Get("addresses")
  listAddresses(@Req() req: Request & { user: { sub: string } }) {
    return this.service.listAddresses(req.user.sub);
  }

  @Post("addresses")
  createAddress(@Req() req: Request & { user: { sub: string } }, @Body() body: any) {
    return this.service.createAddress(req.user.sub, body);
  }

  @Patch("addresses/:id")
  updateAddress(@Req() req: Request & { user: { sub: string } }, @Param("id") id: string, @Body() body: any) {
    return this.service.updateAddress(req.user.sub, id, body);
  }

  @Delete("addresses/:id")
  deleteAddress(@Req() req: Request & { user: { sub: string } }, @Param("id") id: string) {
    return this.service.deleteAddress(req.user.sub, id);
  }
}
