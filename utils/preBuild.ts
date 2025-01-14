import { getBlogs } from "./getBlogs";
import { removeMath } from "./cleanMd";
import { copyImg } from "./copyImg";

// prepare the blog part of the website
getBlogs({ blogDirectory: "./blog" });

// prepare the amo part of the website
removeMath("./amo");
getBlogs({ blogDirectory: "./amo" });
copyImg("amo");
