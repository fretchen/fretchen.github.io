---
publishing_date: 2025-04-06
title: Running an image generator
description: "I build my own AI image generator using open-source models and European hosting. See how to integrate Stable Diffusion into static websites with full privacy and cost control."
---

Just as about every other person on the planet, I have been playing around with [stable diffusion](https://stability.ai/) and other image generators. But I personally do not care too much about the exact details, which model is best etc. I wanted to have my own personal system. I made some good progress on it and I felt that it could be time to share some of my findings.

## My goal

When I set up my system, I started with a few conditions:

1. I want it to be accessible really easily my own website, which is static.
2. I want to use open source models.
3. The infrastructure to run the system should be hosted in Europe.
4. At some point I must be able to limit access to the system or let people pay for it.

## Using model for image generation

To generate the images I need to have some back-end that is non-static and that I can easily call through some API. Several options exist, but for the moment I really like the system by [Ionos](https://cloud.ionos.de/managed/ai-model-hub). It is a straight-forward API with several open source models for image generation like [Stable Diffusion](https://stability.ai/) or FLUX. The system is hosted in Europe, which I personally like these days and the costs are ok. You can get started within minutes on a local setup.

## Using the model in a static website

However, to use the model you need to have some kind of API key. And on a static website there is no really nice way to store such keys. Therefore, I decided to go with a serverless setup. Here, I must admit that I was surprised how hard it was to find something that was not run by an American company. If you go with the American companies you have an almost infinite choice between Amazon, Vercel and so on. However, on the European side, I could only find [Scaleway](https://www.scaleway.com/en/) with their functions. This setup works quite nicely. Now I have a simple website that calls Scaleway, which then calls the Ionos API and returns the image. The whole thing is hosted in Europe.

## Decentral payments

The generation of each image has a cost of less than one euro. However, somehow I need to pass the cost to the user. I really do not want to go with weird advertisement things. So I could go with some traditional payment services. However, it would be substantially more fun to use some web3 payment. I am now quite sure that ChainLink functions are an interesting way to go. It is just a slightly steep learning curve and a fairly new technology. Let's see how it goes. I will keep you updated on the progress.
