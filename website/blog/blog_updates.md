---
publishing_date: 2025-05-26
title: Updates to the website
tokenID: 26
description: "I explore the evolution of my website over 6 months, from minimal CSS to Panda CSS styling and Copilot-powered refactoring. I discover how modern tools enhance development productivity."
---

It has been roughly 6 months since I started this website. All in all, it is a enjoyable experience to have this super flexible stack on which I can simply play around in the way I want. So it is time to summarize the most important changes and updates on the stack over the last few months.

## Panda CSS for consistent styling

At the beginning, I kept the styling super minimalistic and just used inline css. This was ok at the beginning but by the time that I started to add the lecture notes and the image generator it become quite cumbersome to work in this way. So I started to look for a proper CSS solution. I wanted something that is simple, flexible and does not require a lot of setup. After some research, I settled on [Panda CSS](https://panda-css.com/). It allows me to write CSS in a very JS-like way, which is very convenient. It also has a great integration with Vike and works well with the rest of the stack. All in all, there will be no looking back.

## Copilot for code refactoring

In the middle of the refactoring, I also made my first experiences with the [Copilot Agent Mode](https://github.blog/ai-and-ml/github-copilot/agent-mode-101-all-about-github-copilots-powerful-mode/). Previously, I had only used Copilot in the normal way, i.e. it would suggest code snippets as I was typing. However, with the Agent Mode, I can now let Copilot refactor my code in a much more comprehensive way. I only gave the following instruction:

> The code within the website folder uses pandacss. However in a lot of the components and pages similiar styles are defined independently and hence not consistent. The code should have all the style definitions in a consistent way in the `styles.ts` file.

Then I let Copilot run with [Sonnet 4](https://www.anthropic.com/claude/sonnet) for about 20 minutes. Quite amazingly, it did a remarkable job involving fifteen files and hundreds of lines of code. All I had to do was a lint fix and [that's it](https://github.com/fretchen/fretchen.github.io/commit/8b9f37cb0ce2ef54bed23b034a40cebde72608b4). This really makes you wonder which projects are now possible that I put on the backburner before because they were just to long and not fun enough.

## More lecture notes

I was now able to move a number of lecture notes into the new [quantum](../quantum) section. It was all in all a rather straightforward process. I just had to convert the jupyter notebooks to markdown and then add them to the website. With the new content it actually became clear that the file based structure of content is a bit cumbersome. Yes, I previously started a new folder on each project. However, with the blog it would feel tempting to have a single stream of files, which are later sorted by tags etc into different views.

## A quick outlook

We will see where it takes me from here but a number of things could be cool:

- An image gallery for the generator that allows to browse the images, search for them and burn them if you feel like it. Maybe even have a functionality that automatically burns the images after a certain time if you don't want to keep them explicitly ?
- Introducing more tags etc to the blog to get a simpler handle on the content. Maybe I will be able to get rid of the folder structure and just have a single stream of content.
- On the more ambitious side, I really start to wonder if I can finally get quantum onto the blockchain. I had some thoughts on this, I think that it is possible, but I have to find the motivation to get started on it.
