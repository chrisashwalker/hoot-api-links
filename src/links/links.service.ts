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

  findAll(): Promise<Link[]> {
    return this.linkModel.find({}, {'_id': false, '__v': false}).exec();
  }

  findByObject(linkToFind: PartialLink): Promise<Link[]> | void {
    this.linkModel.find({type: linkToFind.type}, {'_id': false, '__v': false}).exec()
    .then(results => {
      results = results.filter(l => (!(linkToFind.objIsSecondary) && (linkToFind.objId == l.objId1))
                  || (linkToFind.objIsSecondary && (linkToFind.objId == l.objId2)));
      return results;
    })
    .catch(reason => {
      return reason;
    });
  }

  create(link: Link): Promise<Link> | void {
    this.linkModel.findOne({type: link.type, objId1: link.objId1, objId2: link.objId2}).exec()
    .then(existingLink => {
      if (existingLink.objId1 > 0){
        return;
      }
      const newLink = new this.linkModel(link);
      return newLink.save();
    })
    .catch(reason => {
      return reason;
    });
  }

  delete(linkToDelete: Link): Promise<Link> | void {
    var deleteId = '';
    this.linkModel.find({type: linkToDelete.type}).exec()
    .then(links => {
      links.forEach(l => 
      {
        if ((l.objId1 == linkToDelete.objId1) &&
            (l.objId2 == linkToDelete.objId2)) 
        {
          deleteId = l.id;
        }
      });
      if (deleteId != '') {
        return this.linkModel.findByIdAndRemove(deleteId);
      }
    })
    .catch(reason => {
      return reason;
    });
    
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
    var search = this.findByObject(searchObj);
    if (search instanceof Array) {
      search.forEach(l => { this.delete(l) });
    }

    if (msgObj.type == 'post'){
      searchObj.type = LinkType.POSTTOTEAM;
      searchObj.objIsSecondary = false;
      search = this.findByObject(searchObj);
      if (search instanceof Array) {
        search.forEach(l => { this.delete(l) });
      }
    }
  }

}
