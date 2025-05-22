import { getBlogs } from "./getBlogs";
import { removeMath } from "./cleanMd";

removeMath("./quantum/basics");
getBlogs({ blogDirectory: "./quantum/basics", sortBy: "order" });
