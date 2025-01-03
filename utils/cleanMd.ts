/**
 * This functionality cleans the markdown of useless math mode commands.
 */

import fs from "fs";

export const removeMath = (fileDirectory: string = "./blog") => {
  const blogFiles = fs.readdirSync(fileDirectory);
  console.log(blogFiles);
  // go through each file remove \begin{aligned} and \end{aligned}

  blogFiles.forEach((file) => {
    console.log(file);

    // check that the file is a markdown file with ending .md or .mdx
    if (!file.endsWith(".md") && !file.endsWith(".mdx")) {
      return;
    }
    const blogFileContent = fs.readFileSync(`${fileDirectory}/${file}`, "utf-8");
    let blogContent = blogFileContent;

    // remove any \ensuremath{} from the content
    blogContent = blogContent.replace(/\\ensuremath{([^}]*)}/g, "$1");

    // remove any \begin{aligned} from the content
    blogContent = blogContent.replace(/\\begin{aligned}/g, "");

    // remove any \end{aligned} from the content
    blogContent = blogContent.replace(/\\end{aligned}/g, "");

    // write the new content to the file
    fs.writeFileSync(`${fileDirectory}/${file}`, blogContent);
  });
};
