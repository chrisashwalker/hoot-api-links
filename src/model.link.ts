import { LinkType } from "./model.linktype";

export class Link {

    type : LinkType;
    objId1 : number;
    objId2 : number;

    constructor (type: LinkType, objId1: number, objId2: number) {
        this.type = type;
        this.objId1 = objId1;
        this.objId2 = objId2;
    }
    
}

export class PartialLink {
    type : LinkType;
    objId : number;
    objIsSecondary : boolean = false;
}