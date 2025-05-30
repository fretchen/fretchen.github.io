---
publishing_date: 2025-01-03
title: Ideas behind the blog stack
---

Over the last few years I kept writing notes and code in all kind of different ways. Sometimes I would use Wordpress, personal notes, markdown or Jupyter notebooks. They get saved in some repo and there you go. But these days I would like to bring them slowly together into some more common structure, i.e. on one common website.

My rather heavy reliance on Jupyter notebooks and markdown really mostly ruled out Wordpress. I also really like the ideas behind static site generators. They are simple, fast and can be version controlled. Then I had to choose the appropiate stack. The first logical idea would have been [mkdocs-material](https://squidfunk.github.io/mkdocs-material/). I have made great experiences with it in the past. It is super simple to set up, very configurable and it looks great. However, I recently started to have a deeper look into proper web tech of the type of React and it is simply sooo much more natural to work with those components etc.

Having settled on _React_, I first thought that it is totally enough to work with [create-react-app](https://create-react-app.dev/). However, you soon realize that there have been no releases over the last few years and that the project is not really maintained anymore. A cute little solution was then [nano-react-app](ttps://github.com/nano-react-app/nano-react-app). It is a super minimalistic setup and worked well as I started to play around.

This got me far enough with a single webpage. But as I wanted to have a blog with multiple posts, I had to think about how to structure the whole thing. And this is the moment where you need some kind of routers. And this is the moment, where I had to learn what react meant with the following statement [on their website](https://react.dev/learn/start-a-new-react-project):

> If you want to build a new app or a new website fully with React, we recommend picking one of the React-powered frameworks popular in the community.
>
> You can use React without a framework, however we’ve found that most apps and sites eventually build solutions to common problems such as code-splitting, routing, data fetching, and generating HTML. These problems are common to all UI libraries, not just React.
>
> By starting with a framework, you can get started with React quickly, and avoid essentially building your own framework later.

I really wanted to avoid this blow at the beginning but with the need for multiple pages I had to dive into this. After some research, I settled on [vike](https://vike.dev/). It provides everything I need and super flexible. It also has a bit of an indie vibe, which made it more sympathic. Finally setting it up is made quite easy with [create-bati](https://batijs.dev).

So here we are. I have a blog stack that I can work with. It is not perfect but it is a start. I will keep you updated on how it goes.
