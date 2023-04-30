import { Controller, Get, Post, Body, Delete } from '@nestjs/common';
import { LinksService } from './links.service';
import { Link, PartialLink } from "./schemas/link.schema";

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get()
  get(@Body() linkToFind: PartialLink): Promise<Link[]> | void {
    if (linkToFind.objId > 0) {
      return this.linksService.findByObject(linkToFind);
    }
    return this.linksService.findAll();
  }

  @Post()
  create(@Body() link: Link): Promise<Link> | void {
    return this.linksService.create(link);
  }

  @Delete()
  delete(@Body() linkToDelete: Link): Promise<Link> | void {
    return this.linksService.delete(linkToDelete);
  }
}
