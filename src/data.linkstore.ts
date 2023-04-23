import { Link } from "./model.link";
import { LinkType } from "./model.linktype";

const num = 5;
const postHolders: Link[] = [...Array(num).keys()]
                    .slice(1)
                    .map((i) => 
                    {
                        return new Link(LinkType.PERSONTOPOST, i, num - i);
                    });
const postOwners : Link[] = [...Array(num).keys()]
                    .slice(1)
                    .map((i) => 
                    {
                        return new Link(LinkType.POSTTOTEAM, i, num - i);
                    });

export const LinkStore = postOwners.concat(postHolders);