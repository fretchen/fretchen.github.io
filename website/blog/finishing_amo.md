---
publishing_date: 2025-03-11
title: Can I have interactive python pages ?
---

_The original post on mirror can be found [here](https://mirror.xyz/fretchen.eth/iglgKZeAeHcUc_-Ya9cjQQ1vUNqhJTRUswredn-53e8?referrerAddress=0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20).\_

One of my main motivations to start this website was to consolidate different lectures, writings and other things that accumulated over the years in different places. The first project was to actually move my AMO lectures. This is now finished and can be found over [here](https://www.fretchen.eu/amo). I started with this as it was a really simple test case without anything interactive components.

However, I have a few more projects which are really based on [jupyter](https://jupyter.org/) notebooks. jupyter notebooks are just a fantastic tool to combine notes with simple visualizations and the [jupyter book](https://jupyterbook.org) project is really a great way to publish them. The only "annoying" drawback has been for years that you have to somehow download the notebook and run it locally or go into some service like [binder](https://mybinder.org/).

The rise of python in the browser actually promises to changes that at some point. What does this mean ? Projects like [jupyterlite](https://github.com/jupyterlite) allow you to run the full jupyter experience without any installation. And tools like [pyodide](https://pyodide.org/en/stable/) bring python directly into the brower. Just python programming without the cloud, or any installation. It all just runs in the browser. This would make the jupyter notebooks that I loved so extremely portable. And actually, there are now package that attempt to connect this directly to [react](https://github.com/elilambnz/react-py). If this worked out I would have:

- A blog that is written in markdown.
- The possibility to add small python snippets directly into the blog.
- All of this part of a website without the need to install anything.

I gave all of this a try and `react-py` looked particularly interesting. However, the ecosystem still seems fairly young and it was super painful to get even the simplest examples to run. I must admit that I gave up for the moment, when I understood that pyodide and hence `react-py` does always require a [build for tests](https://pyodide.org/en/latest/usage/working-with-bundlers.html). Having it in `dev` would have been a minimum to make it an enjoyable experience.

So for the moment I will most likely just transform the jupyter notebooks into react / plein markdown and then see how the ecosystem evolves. But kudos to the people behind _python-in-the-browser_. This is a super exciting development for all kind of data science and will make the ecosystem much more decentralized and accessible. Any suggestions or additional information ? Then just leave them in the comments below.
