import { getBlogs } from "./getBlogs";
import { copyImg } from "./copyImg";

// Note: quantum/amo now uses blogLoader.ts - no prebuild needed!

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
