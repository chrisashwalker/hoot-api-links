import { Injectable } from '@nestjs/common';
import { AppService } from './app.service';
import { PartialLink } from './model.link';
import { LinkType } from './model.linktype';
var amqplib = require('amqplib');

@Injectable()
export class PollingService {

  messageChannel = null;
  deletionQueue = 'deleted-objects';
  pollTimer = null;
  service = null;

  constructor(){
    this.connectToMessaging();
    this.service = new AppService();
  }

  connectToMessaging = () => {
    amqplib.connect('amqp://hoot-message-queues')
          .then(conn => conn.createChannel())
          .then(ch => {
            this.messageChannel = ch;
            ch.assertQueue(this.deletionQueue);
          })
          .then(() => {
            this.pollTimer = setInterval(this.pollQueue, 10000);
          })
          .catch(err => {
            console.log('Failed to connect to message queues. ' + err);
          });
  }

  pollQueue = () => {
    if (this.messageChannel) {
      try {
        this.messageChannel.consume(this.deletionQueue, msg => {
          this.handleDeletion(msg);
          this.messageChannel.ack(msg);
        })
      }
      catch {
        //clearInterval(pollTimer);
      }
    }
  }

  // Not good, but it will do for now!
  handleDeletion = (msg) => {
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
    var search = this.service.getLinksByObject(searchObj);
    if (search instanceof Array) {
      search.forEach(l => { this.service.deleteLink(l) });
    }

    if (msgObj.type == 'post'){
      searchObj.type = LinkType.POSTTOTEAM;
      searchObj.objIsSecondary = false;
      search = this.service.getLinksByObject(searchObj);
      if (search instanceof Array) {
        search.forEach(l => { this.service.deleteLink(l) });
      }
    }
  }

}
