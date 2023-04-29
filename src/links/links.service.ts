import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Link, LinkType, PartialLink } from "./schemas/link.schema";

@Injectable()
export class LinksService {

  constructor(@InjectModel('Link') private readonly linkModel: Model<Link>) {
    this.initDatabase();
  }

  async findAll(): Promise<Link[]> {
    return await this.linkModel.find().exec();
  }

  async findByObject(linkToFind: PartialLink): Promise<Link[]> {
    var results = await this.linkModel.find().exec();
    results.filter(l => linkToFind.type == l.type)
    .filter(l => (!(linkToFind.objIsSecondary) && (linkToFind.objId == l.objId1))
                  || (linkToFind.objIsSecondary && (linkToFind.objId == l.objId2)));
    if (results.length > 0) {
      return results;
    }
  }

  async create(link: Link): Promise<Link> {
    const newLink = new this.linkModel(link);
    return await newLink.save();
  }

  async delete(linkToDelete: Link): Promise<Link> {
    var deleteId = -1;
    var links = await this.linkModel.find({type: linkToDelete.type}).exec();
    links.forEach((l, idx) => 
      {
        if ((l.objId1 == linkToDelete.objId1) &&
            (l.objId2 == linkToDelete.objId2)) 
        {
          deleteId = l.id;
        }
      });
    if (deleteId > -1) {
      return await this.linkModel.findByIdAndRemove(deleteId);
    }
  }

  async initDatabase() {
    if ((await this.linkModel.estimatedDocumentCount()) < 1){
      const num = 5;
      [...Array(num).keys()]
        .slice(1)
        .map((i) => 
        {
          var l = new Link;
          l.type = LinkType.PERSONTOPOST;
          l.objId1 = i;
          l.objId2 = num - i;
          var newLink = new this.linkModel(l);
          newLink.save();
        });
      [...Array(num).keys()]
        .slice(1)
        .map((i) => 
        {
          var l = new Link;
          l.type = LinkType.PERSONTOPOST;
          l.objId1 = i;
          l.objId2 = num - i;
          var newLink = new this.linkModel(l);
          newLink.save();
        });
    }
  }

}
