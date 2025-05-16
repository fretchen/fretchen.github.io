---
publishing_date: 2025-05-15
title: Generating AI images, paying anonymously and little
---

As I wrote already in one of my [previous posts](6), I have set up a small image generator on my website. The whole thing is hosted in Europe and I am using open source models. The system is running on a serverless setup, which is also hosted in Europe. The costs are low and I am happy with the setup. But to make it sustainable, I need to charge the users for the images at least as much as I get charged. 

I do not want to go with advertisement or anything like that. To test the waters, I have recently set up a support button to "like" the website. This experiment proofed that it Layer-2 solutions on ethereum are nowadays super cheap and up for task. Feel free to have a look into my note over [here](7).

In the last few week I was able to tie the two ingredients (the AI system and the blockchain) together and I will describe the setup here.

## The challenge

Nowadays it costs roughly 5 to 6 cents to generate an image with services like [Ionos](https://cloud.ionos.de/managed/ai-model-hub) or [deepinfra](https://deepinfra.com/). Therefore, I wondered if it was possible to implement a payment system with similiar cost but without the need of Stripe etc but with web3 systems. This meant mostly that I had to solve two major challenges:

- **Challenge 1:** How could I minimize the fees and remain competitive ?
- **Challenge 2:** How could I connect the ethereum payment systems to the serverless systems. 
This is a challenge that I have not yet solved. I am still looking for a solution that would allow me to charge less than 5 cents per image. The current solutions are all too expensive.