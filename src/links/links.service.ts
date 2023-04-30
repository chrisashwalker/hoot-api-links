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
    return await this.linkModel.find({}, {'_id': false, '__v': false}).exec();
  }

  async findByObject(linkToFind: PartialLink): Promise<Link[]> {
    var results = await this.linkModel.find({type: linkToFind.type}, {'_id': false, '__v': false}).exec();
    results = results.filter(l => (!(linkToFind.objIsSecondary) && (linkToFind.objId == l.objId1))
                  || (linkToFind.objIsSecondary && (linkToFind.objId == l.objId2)));
    if (results.length > 0) {
      return results;
    }
  }

  async create(link: Link): Promise<Link> {
    var existingLink = await this.linkModel.findOne({type: link.type, objId1: link.objId1, objId2: link.objId2}).exec();
    if (existingLink.objId1 > 0){
      return;
    }
    const newLink = new this.linkModel(link);
    return await newLink.save();
  }

  async delete(linkToDelete: Link): Promise<Link> {
    var deleteId = '';
    var links = await this.linkModel.find({type: linkToDelete.type}).exec();
    links.forEach((l, idx) => 
      {
        if ((l.objId1 == linkToDelete.objId1) &&
            (l.objId2 == linkToDelete.objId2)) 
        {
          deleteId = l.id;
        }
      });
    if (deleteId != '') {
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
          l.type = LinkType.POSTTOTEAM;
          l.objId1 = i;
          l.objId2 = num - i;
          var newLink = new this.linkModel(l);
          newLink.save();
        });
    }
  }

}
