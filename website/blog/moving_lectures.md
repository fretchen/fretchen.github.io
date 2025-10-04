---
publishing_date: 2025-01-06
title: Moving old lectures
description: "I learn how to migrate academic lectures from LaTeX to modern web formats. I discover solutions for handling equations, references, and static site generation challenges in JavaScript environments."
---

In my time in academia, I gave a few lectures on various topics. They are saved as latex, markdown, jupyter notebook, whatever you want. But to get started, I decided to move over a number of lectures on AMO that I gave for several years.

I had them all saved on a website called Authorea and could export them directly as latex. So what could be easier than just importing them right ?

## Challenge 1: Loading the markdown

It was really quite straight forward to convert the files through pandoc with the command `pandoc MY__INPUT_FILE.tex -s -o MY_FILE.md`. However, once you have markdown I have to import it into the website. And it is really at this stage where my little python world crumbles. You have the habit that files are yours and any access from any script is identical. However, within the world of javascript, I suddenly had to think about strange things like clients / servers / build times etc. In the end, I chose a solution similiar to the one described by [vike](https://vike.dev/markdown) with a little script that converts the markdown into a json file. This json file is then loaded into the website without the need of any `fs`.

## Challenge 2: Equations and references

The first challenge, already existed for the blogs in general. But now I also had to handle equations and references. To render them you need a surprising amount of extensions to remark including:

- [rehype-katex](https://www.npmjs.com/package/rehype-katex) for compiling the equations.
- [remark-gfm](https://github.com/remarkjs/remark-gfm) for references in footnotes
- [remark-math](https://www.npmjs.com/package/remark-math) for compiling equations.

Despite all of those packages I needed to write a processing script that removed equation labels, equation alignements and also keep the spacing right. All in all it is nicer to use latex for long documents ...

## Challenge 3: Images

Now I was already quite proud about the result, but then I realized that the images were not loading. Remember how I was loading markdown into a `json` ? Well this messed up the references to images in production. So I had to copy the images into public folder. Further, I had to find a way to keep the images at an appropiate size. This worked nicely with the `img` link, but to have this you must allow for [rehype-raw](https://www.npmjs.com/package/rehype-raw). But then it was all good.

## Conclusion

Building up this kind of content management is really only for the curious. Otherwise, projects like docusaurus or astro are much more suited. But now I have a cute little system puzzled together and can extend it at will. All of this with a very limited amount of complexity. FWIW, the code can be [found here](https://github.com/fretchen/fretchen.github.io).
