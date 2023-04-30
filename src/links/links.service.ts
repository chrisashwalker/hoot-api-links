import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Link, LinkType, PartialLink } from "./schemas/link.schema";
var amqplib = require('amqplib');

@Injectable()
export class LinksService {

  messageChannel = null;
  deletionQueue = 'deleted-objects';

  constructor(@InjectModel('Link') private readonly linkModel: Model<Link>) {
    this.initDatabase();
    this.connectToMessaging();
  }

  async findAll() : Promise<Link[]> {
    return await this.linkModel.find({}, {'_id': false, '__v': false}).exec()
    .then(l => { return l; })
  }

  async findByObject(linkToFind: PartialLink) : Promise<Link[]> {
    return await this.linkModel.find({type: linkToFind.type}, {'_id': false, '__v': false}).exec()
    .then(results => {
      results = results.filter(l => (!(linkToFind.objIsSecondary) && (linkToFind.objId == l.objId1))
                  || (linkToFind.objIsSecondary && (linkToFind.objId == l.objId2)));
      return results;
    });
  }

  async create(link: Link) {
    await this.linkModel.findOne({type: link.type, objId1: link.objId1, objId2: link.objId2}).exec()
    .then(existingLink => {
      if (existingLink){
        return;
      }
      const newLink = new this.linkModel(link);
      newLink.save();
    });
  }

  async delete(linkToDelete: Link) {
    await this.linkModel.deleteOne({
      type: linkToDelete.type,
      objId1: linkToDelete.objId1,
      objId2: linkToDelete.objId1
    }).exec();
  }

  initDatabase() {
    this.linkModel.estimatedDocumentCount()
    .then(count => {
      if (count < 1) {
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
    });
  }

  connectToMessaging() {
    amqplib.connect('amqp://hoot-message-queues')
          .then(conn => conn.createChannel())
          .then(ch => {
            this.messageChannel = ch;
            ch.assertQueue(this.deletionQueue);
          })
          .then(() => {
            this.messageChannel.consume(this.deletionQueue, 
              msg => {
                this.handleDeletion(msg);
                this.messageChannel.ack(msg);
              }
            );
          })
          .catch(err => {
            console.log('Failed to connect to message queues. ' + err);
          });
  }

  // Not good, but it will do for now!
  handleDeletion(msg) {
    var msgObj = JSON.parse(Buffer.from(msg.content).toString());
    var searchObj = new PartialLink();
    searchObj.objId = msgObj.objId;
    switch (msgObj.type){
      case 'person':
        searchObj.type = LinkType.PERSONTOPOST;
        searchObj.objIsSecondary = false;
        break;
      case 'team':
        searchObj.type = LinkType.POSTTOTEAM;
        searchObj.objIsSecondary = true;
        break;
      case 'post':
        searchObj.type = LinkType.PERSONTOPOST;
        searchObj.objIsSecondary = true;
        break;
      default:
        return;
    }
    this.linkModel.find({type: searchObj.type}, {'_id': false, '__v': false}).exec()
    .then(results => {
      results = results.filter(l => (!(searchObj.objIsSecondary) && (searchObj.objId == l.objId1))
                  || (searchObj.objIsSecondary && (searchObj.objId == l.objId2)));
      results.forEach(l => { this.delete(l) });
    });
    
    // Repeat if it's a post, as there are two possible link types
    if (msgObj.type == 'post'){
      this.linkModel.find({type: searchObj.type}, {'_id': false, '__v': false}).exec()
      .then(results => {
        results = results.filter(l => (!(searchObj.objIsSecondary) && (searchObj.objId == l.objId1))
                    || (searchObj.objIsSecondary && (searchObj.objId == l.objId2)));
        results.forEach(l => { this.delete(l) });
      });
    }
  }

}
