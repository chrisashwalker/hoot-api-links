import { Body, Controller, Delete, Get, HttpException, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Link, PartialLink } from "./model.link";

@Controller('links')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getLinks(@Body() linkToFind : PartialLink): Link[] | HttpException {
    if (linkToFind.objId) {
      return this.appService.getLinksByObject(linkToFind);
    }
    return this.appService.getLinks();
  }

  @Post()
  createLink(@Body() linkToCreate : Link) {
    return this.appService.createLink(linkToCreate);
  }

  @Delete()
  deleteLink(@Body() linkToDelete : Link) : void | HttpException {
    return this.appService.deleteLink(linkToDelete);
  }

}
