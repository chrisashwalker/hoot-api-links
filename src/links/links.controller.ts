import { Controller, Get, Post, Body, Patch, Param, Put, Delete } from '@nestjs/common';
import { LinksService } from './links.service';
import { Link, PartialLink } from "./schemas/link.schema";

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get()
  async findAll(): Promise<Link[]> {
    return await this.linksService.findAll();
  }

  @Get()
  async findByObject(@Body() linkToFind: PartialLink): Promise<Link[]> {
    return await this.linksService.findByObject(linkToFind);
  }

  @Post()
  async create(@Body() link: Link): Promise<Link> {
    return await this.linksService.create(link);
  }

  @Delete()
  async delete(@Body() linkToDelete: Link): Promise<Link> {
    return await this.linksService.delete(linkToDelete);
  }
}
