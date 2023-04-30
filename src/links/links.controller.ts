import { Controller, Get, Post, Body, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { LinksService } from './links.service';
import { Link, PartialLink } from "./schemas/link.schema";

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get()
  get(@Body() linkToFind: PartialLink): Promise<Link> | Promise<Link[]> {
    try {
      if (linkToFind.objId > 0) {
        return this.linksService.findByObject(linkToFind);
      }
      return this.linksService.findAll();
    }
    catch {
      throw new HttpException('Link(s) not found.', HttpStatus.NOT_FOUND);
    }
  }

  @Post()
  create(@Body() link: Link) {
    try {
      this.linksService.create(link);
    }
    catch {
      throw new HttpException('Could not create link.', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete()
  delete(@Body() linkToDelete: Link) {
    try {
      this.linksService.delete(linkToDelete);
    }
    catch {
      throw new HttpException('Link not found.', HttpStatus.NOT_FOUND);
    }
  }
}
