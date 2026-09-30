---
title: Writing a tool to upload logs to MyHours with an agent
date: 2026-09-30
tags: [post, api, hours]
excerpt: I wrote up a small MyHours API Wrapper to make it easy to upload time logs with an agent
draft: false
---

Bit of a short one.

I was entering entries into [MyHours](https://myhours.com/) the other day, and wondered, hmm, I wonder if there's a faster way to do this.
Turns out, there is, as is usually the case.
They have a [documented REST API that you can access via Postman](https://documenter.getpostman.com/view/8879268/TVmV4YYU), which was a bit difficult to find at first.
It doesn't appear to be advertised up front, but it certainly works.

What's interesting is that although they do document their API, there aren't really any visible applications that consume it (at least not from what I can tell).
I'm sure there are actual consumers, but again it doesn't appear to be something they're broadcasting.

In any case, I do a lot of work in TypeScript, and found there wasn't an npm package.
So, I wrote one up to work with the MyHours REST API, an unofficial [myhours-api-wrapper](https://www.npmjs.com/package/myhours-api-wrapper).
Big emphasis on the _unofficial_ part, this isn't endorsed in any way by MyHours, I just wanted to make a helpful package available.

With that package, I was able to write a little cli for working with the MyHours api.
Via that, I was able to pull hours from the top of an Obsidian notes file for a days worth of work, auto-categorize it, get the hours range, and apply it to the time sheet for the current day.
From there I just proof it quickly to ensure it isn't off, and it's good to go.
Overall quite handy.

However, the main problem was that I didn't always write my notes so cleanly, so even when I noted hours, I wrote them in a way that didn't parse nicely.
Rather than fiddle with the details of normalizing how I write my notes in all cases, I thought of another solution.
Why not see how an agent could make sense of the same data.

I wrote up some helpers to retrieve the current Obsidian file for the day, pull out the time logs from the top, and combined with some instructions crafted a little skill to use the cli that I wrote.
Turns out that works quite well, even when I did a poor job writing down the hours myself in the first place.
In some cases what I wrote was actually wrong (bad time range, or even the wrong project reference), but there was enough context to correct the entry.
Of course, the results that would be entered are held until I could verify them, just in case something funny was crafted.
In all cases the usage was quite restricted, but it meant I didn't have to enter my hours by hand!
This meant that when it was time for dinner, I could kick an agent off to help upload my hours, quickly wrap up something else, and come back to proof the results in a matter of seconds.
The time savings wasn't much, but it beats entering in a ton of logs by hand.

Cases like this are really helpful, something akin to a _fuzzy problem_, where no singular programmatic solution is going to handle the myriad ways you could encounter a potential input. I tend to be more conservative in how I apply agents to tasks, but this was pleasantly effective without needing much oversight.
