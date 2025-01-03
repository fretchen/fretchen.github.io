import { getBlogs } from "./getBlogs";
import { removeMath } from "./cleanMd";

removeMath("./amo");
getBlogs("./amo");
