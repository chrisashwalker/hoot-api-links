import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LinkStore } from "./data.linkstore";
import { Link, PartialLink } from "./model.link";

@Injectable()
export class AppService {

  getLinks(): Link[] {
    return LinkStore;
  }

  getLinksByObject(linkToFind : PartialLink) {
    var results = LinkStore.filter(l => linkToFind.type == l.type)
                  .filter(l => (!(linkToFind.objIsSecondary) && (linkToFind.objId == l.objId1))
                                || (linkToFind.objIsSecondary && (linkToFind.objId == l.objId2)));
    if (results.length > 0) {
      return results;
    }
    return new HttpException('No links found', HttpStatus.NOT_FOUND);
  }

  createLink(linkToCreate : Link) {
    LinkStore.push(linkToCreate);
  }

  deleteLink(linkToDelete : Link) {
    var deleteIdx = -1;
    LinkStore.forEach((l, idx) => 
      {
        if ((l.type == linkToDelete.type) &&
            (l.objId1 == linkToDelete.objId1) &&
            (l.objId2 == linkToDelete.objId2)) 
        {
          deleteIdx = idx;
        }
      });
    if (deleteIdx > -1) {
      LinkStore.splice(deleteIdx, 1);
      return;
    }
    return new HttpException('Link not found', HttpStatus.NOT_FOUND);
  }

}
