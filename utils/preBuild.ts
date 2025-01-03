import { getBlogs } from "./getBlogs";
import { removeMath } from "./cleanMd";

// prepare the blog part of the website
getBlogs();

// prepare the amo part of the website
removeMath("./amo");
getBlogs("./amo");
