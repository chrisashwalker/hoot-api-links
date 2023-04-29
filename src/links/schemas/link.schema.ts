import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Link {

  @Prop()
  type : LinkType;

  @Prop()
  objId1 : number;

  @Prop()
  objId2 : number;

}

export class PartialLink {

    type : LinkType;
    objId : number;
    objIsSecondary : boolean;

}

export enum LinkType {
    PERSONTOPOST,
    POSTTOTEAM
}

export const LinkSchema = SchemaFactory.createForClass(Link);
