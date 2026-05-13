import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { CreateAddressDto, UpdateAddressDto, UpdateProfileDto } from "./users.dto";
import type { Request } from "express";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users/me")
export class UsersController {
  constructor(private service: UsersService) {}

  @Patch()
  updateProfile(@Req() req: Request & { user: { sub: string } }, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(req.user.sub, dto);
  }

  @Get("addresses")
  listAddresses(@Req() req: Request & { user: { sub: string } }) {
    return this.service.listAddresses(req.user.sub);
  }

  @Post("addresses")
  createAddress(@Req() req: Request & { user: { sub: string } }, @Body() dto: CreateAddressDto) {
    return this.service.createAddress(req.user.sub, dto);
  }

  @Patch("addresses/:id")
  updateAddress(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.service.updateAddress(req.user.sub, id, dto);
  }

  @Delete("addresses/:id")
  deleteAddress(@Req() req: Request & { user: { sub: string } }, @Param("id") id: string) {
    return this.service.deleteAddress(req.user.sub, id);
  }
}
