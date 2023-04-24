import { Injectable } from '@nestjs/common';
var amqplib = require('amqplib');

@Injectable()
export class PollingService {

  messageChannel = null;
  deletionQueue = 'deleted-objects';
  pollTimer = null;

  constructor(){
    this.connectToMessaging();
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

  handleDeletion = (msg) => {
    let msgObj = JSON.parse(Buffer.from(msg.content).toString());
    let fetchOptions : any = { method: msgObj.method };
    if (fetchOptions.method != 'GET') {
      fetchOptions.body = msgObj.body;
    }
    fetch(msgObj.url, fetchOptions)
      .then(res => res.json())
      .then(json => {
        msgObj.response = json;
        this.messageChannel.sendToQueue(this.deletionQueue, Buffer.from(JSON.stringify(msgObj)));
      });
  }


}
