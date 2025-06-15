import { getBlogs } from "./getBlogs";
import { removeMath } from "./cleanMd";
import { copyImg } from "./copyImg";

// prepare the blog part of the website
getBlogs({ blogDirectory: "./blog", sortBy: "publishing_date" });
copyImg("blog");

// prepare the amo part of the website
removeMath("./quantum/amo");
getBlogs({ blogDirectory: "./quantum/amo", sortBy: "order" });
copyImg("quantum/amo");

// prepare the quantum part of the website
getBlogs({ blogDirectory: "./quantum/basics", sortBy: "order" });
copyImg("quantum/basics");

// prepare the quantum part of the website
getBlogs({ blogDirectory: "./quantum/basics", sortBy: "order" });
copyImg("quantum/basics");

// prepare the quantum part of the website
getBlogs({ blogDirectory: "./quantum/hardware", sortBy: "order" });
copyImg("quantum/hardware");

getBlogs({ blogDirectory: "./quantum/qml", sortBy: "order" });
copyImg("quantum/qml");
