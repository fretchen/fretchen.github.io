import { getBlogs } from "./getBlogs";
import { removeMath } from "./cleanMd";
import { copyImg } from "./copyImg";

// prepare the blog part of the website
getBlogs({ blogDirectory: "./blog", sortBy: "publishing_date" });

// prepare the amo part of the website
removeMath("./amo");
getBlogs({ blogDirectory: "./amo", sortBy: "order" });
copyImg("amo");
