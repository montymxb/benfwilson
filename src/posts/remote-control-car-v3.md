---
title: "Three RC Cars: Builds and Thoughts"
date: 2026-10-14
tags: [post, project, electronics, 3d printing, rc, car]
excerpt: A look back at three homemade RC cars, from a 3D printed mouse droid to a literal cube on wheels.
draft: false
---

Over the last couple of years I've been building little remote control cars on and off.
These have been purely a hobby fascination, but the projects have gone on long enough that I wanted to write something about them.
Recently, I finished the _third_ one, which I started back in June.

Here's a picture of the finished item for reference.

![Third iteration of a simple RC car. In this case not much going on style-wise, but there's more under the hood.](/assets/images/cube1.jpg)

_Very_ cube-like indeed.

I opted to keep the shell super simple to save time and effort.
Plus, with 3D printing, that kind of geometry is straightforward to print and quick to iterate on.
Later on, if I wanted to, I figured I could expand the shell into something more aesthetically appealing.

That aesthetic note is a good pivot back to where it all began.

### First Iteration: A Mouse Droid

It started in the summer of 2024.
I decided to build up a mock mouse droid, and for reference here's a shot of the completed result.

![A fully 3D printed mouse droid with custom-built controller.](/assets/images/mouse-droid-1.jpg)

I had a couple of months for a project, and I had just picked up a brand-new [Bambu Lab A1 Mini](https://eu.store.bambulab.com/products/a1-mini).
At the time this was a pretty interesting printer, given it had self-calibrating features at a competitive price point.
Now, there are some alternatives that are more sensible, particularly as Bambu has become [a bit less savory](https://cybernews.com/tech/bambu-lab-legal-threats-spark-pr-crisis/), but that's a digression.
Despite that, the printer itself was a game changer, and also a great machine overall.

For building the mouse droid I wanted to craft something reasonably faithful to the original, while being realistic in terms of time.
I saw that most shells (particularly the original) were made from vacuum-formed plastic.
That was a bit out of reach for me, but printing the upper and lower shells, and then joining them together, was more than reasonable.

![A 3D printed half shell for the mouse droid (in red), alongside a prototype base.](/assets/images/mouse-droid-2.jpg)

As for the circuitry and hardware, the setup was mostly custom.

I put an Arduino Nano RP2040 Connect at the heart of it (replacing an Arduino Nano), and wired up two simple continuous-rotation servos to provide tank steering and drive power.
The wheels themselves ended up being 3D printed too, but turned out to be problematic (at least in my execution).
3D printed parts are inherently anisotropic, so depending on the print orientation your parts will have different characteristics in different directions.

![Some assorted 3D printed parts for the mouse droid, with some early wheels visible as well (and an Arduino Nano in the back).](/assets/images/mouse-droid-3.jpg)

I printed my wheels face _down_ with the drive shafts attached as little stems.
Turned out these failed quite often.
Later iterations left an opening for a 5mm printed shaft that was much more robust, but printed plastic wheels just don't do the trick for grip (TPU might be different, but I can't speak to that).
I did experiment with wrapping rubber bands around the wheels to increase traction, but the problem was the same.

The core assembly for mounting everything, which went into the shells, was a single printed mounting board.
This was something that I revised later on, but it meant that nothing had to be attached post-print.

![A few versions of the core assembly, one with batteries, a Nano, and servos attached.](/assets/images/mouse-droid-4.jpg)

What it _also_ meant was that mistakes were forever, requiring a whole new mounting board to be printed.
Not only did this waste material, but it also slowed down turnaround time on iterations.
Still, the results looked pretty nice once they were finished.

I also built up a custom controller with an ESP32 wired inside.
The ESP32 then communicated with the RP2040 via Bluetooth, and the result was a dedicated controller.
This was really nice to see at first, but overly complicated in the long run.
By the second iteration, I had already ditched the custom controller for practical reasons and switched to using a pre-built one.

![Custom mouse droid controller with the Imperial crest on the front. Inside there's a small LiPo battery, an ESP32 and a bunch of custom wiring.](/assets/images/mouse-droid-5.jpg)

One of the key aspects that I've quite enjoyed about 3D printing is the ability to do rapid prototyping.
Being able to turn around parts in a matter of hours allowed me to quickly iterate on designs and improve on them incrementally.
However, with this design, since most parts were printed as monolithic chunks, a single misaligned or poorly sized portion required an entire reprint, which wasn't ideal.
The follow-up version that I worked on was less focused on the visuals, and more on this notion of producing a lot of smaller parts over a few large ones.

### Second Iteration: The Blue Thing

The second thing never really got a name, other than just being predominantly "blue", so I'll refer to it as such here.

![The blue thing, not a mouse droid anymore, but it borrows a lot from the first design, with a modular base assembly.](/assets/images/blue-1.jpg)

This "blue" thing was a second approach to tackle a lot of the shortcomings from the first design, namely:

- Lack of traction (and lack of steered wheels)
- Monolithic prints that were slow to iterate on and replace
- No sensor input

There were also a couple of good details I wanted to keep: the onboard LiPo power and remote control aspect (but with an off-the-shelf, non-custom controller).

So, this time the design was produced as a series of individual parts.
I sketched up a base board that would have sockets for inserting separate components and parts, most of which would just friction fit and snap into place.
I also added steering this time around, although I still had two separate servos for L/R drive.
So steering wasn't strictly necessary, but I wanted to try it out regardless.

![A view of the base assembly during early testing, with openings for mounted pieces visible. The steering is wired up for checks, and a couple of drive servos are mounted as well.](/assets/images/blue-3.jpg)

The steering itself was a simple rack with a pin that locked onto both front wheel hubs, allowing a servo to drive the steering mechanically in addition to the power from the rear wheels.
That worked out surprisingly well, all things considered.
The rear drive held up too, using a pair of servos side by side.

On top of all this, I added a simple frame that supported mounting power (a single LiPo again) and a small speaker.
The speaker was intended to add some small sound effects, but it wasn't used much toward the end.

You'll also note that there's no shell or covering this time.
Just lots of exposed electronics.
I got about that far, had a good time driving it around, added a ton of peripherals on top (lights, sensors, accelerometers, and an MP3 player), and then ended up stopping there.
I also chose to use a PS4 controller to drive the RC car via Bluetooth to my _computer_, which was connected via the onboard WiFi to the RP2040 Connect on the RC car.
The controller's inputs were interpreted by a Python script, and then fed into an API exposed by the RP2040.
Driving around with the left stick of a controller felt _much_ better than the custom controller I built before.

At the end of the project, I found that:

- Building with a bunch of smaller connectable parts was _great_ for being productive
- Steering was OK, especially with dedicated wheels this time around, but tank steering still gave the best results
- Little servos don't give much power
- Using a base platform that pieces could attach to was fantastic

With these observations, and some more time, I went ahead and made a third iteration (the cube from the top of this post).

### Third Iteration: The Cube

![Same RC car from the initial picture, but with the shell removed.](/assets/images/cube2.jpg)

This third iteration did a number of things differently, besides opting to be a cube.
One of the biggest changes was the simplification to two base plates stacked together.
Instead of coming up with a more complex layout in advance, I went with a regular pattern of mounting holes.
That let me defer deciding how to mount parts until later, without needing to change anything about the plates themselves.

I also picked up some [75:1 HP Pololu geared motors](https://www.pololu.com/product/2361) for driving this car.
The previous choice of working with continuous-rotation servos left a lot to be desired.
The performance wasn't abysmal with the servos, but it was lackluster, so having the Pololus was a great improvement in terms of responsiveness and speed (as well as torque).

![An early layout with the lower half assembled. The geared motors are already locked in place, the rear wheel mounts are on, and so are some simple IR range sensors on the front. Note the pocket on the back for a pair of LiPo batteries.](/assets/images/cube3.jpg)

Those geared motors were directly attached to the front wheels, while the rear ones remained free-wheeling.
Similar to what I did in the mouse droid a couple of years ago, I used 3D printed mounts.
However, this time the mounts were larger (still with a 5mm axle) and separate from the wheels themselves.
These parts still failed along the axle, but only a couple of times.
Not only that, but when they did, they were trivial to swap out with replacements.

For power, I hooked in a pair of 1200 mAh LiPo battery pouches, nestled toward the back of the car.
They received their own pocket they could slide into, with a mount on top for a buck-boost converter set to output 5V.
The daughter board holding the buck-boost converter was produced ad hoc, using some extra perfboard I had lying around.
I also decided _not_ to include an onboard charging circuit, and instead set it up so I could remove the batteries and charge them individually.
I did investigate LiPo balance charging setups, but I decided against them in favor of keeping the car itself simpler.

The hardware layout was also further decomposed into a series of daughter boards that were connected together.
I hadn't taken this approach before, and wished I'd done so sooner after the mess that came about on earlier designs.
It took more time to put together: soldering components, routing connections underneath the perfboards, and preparing harnesses for each board.
But the payoff was substantial: working on a system that can be decomposed into sub-units is much easier to debug, iterate on, and repair.
It's also significantly less daunting to return to later on.

![Decomposed daughter boards for power management, motor driver, and core logic board and sensors (top to bottom). The harnesses took a considerable amount of time to make, but paid dividends in making it easy to diagnose and fix issues later on.](/assets/images/cube4.jpg)

Similar to the last RC car, I chose to use a PS4 controller as my primary input device.
The whole stack was reused as well: the RP2040 hosts an access point, and a Python server on my laptop translates controller inputs received via Bluetooth.
Again, I did this so I could separate the logic for interpreting the controller from the car itself, which gave me ways to interpret single-button inputs as macro-like triggers (like doing an in-place 180-degree rotation).

Part of this design was about having an autonomous mode, guided purely by IR time-of-flight distance sensors.
The ones I had were rather cheap, and there were just three, but I wanted to see how well the car could navigate by itself.
As it turns out, somewhat well, so long as the objects are relatively solid and at the right height.
It was pretty impressive to see how much faster this car was than its predecessor, but this resulted in it running into obstacles far too often.
In the end, it was more fun to directly drive the car myself, but it's still on my mind to build a smaller autonomous car another time.

As for the cube-like shell shown at the beginning of this post, that was more of a last-minute decision.
Initially I had fancy plans for building a simple frame, and building a more aesthetically appealing body on top of it.
Due to the project taking longer than expected, and my own laziness, I decided a pure cube was more than sufficient.
It was a simple geometry to print as well, and provided reasonable protection for all the wiring and hardware inside.
Over time this design actually grew on me; its simplicity was quite charming.
There really wasn't much to it visually, but knowing that it needn't be any more was also somewhat satisfying.
I also may have been biased by the promotional material for [Valve's rebooted Steam Machine](https://en.wikipedia.org/wiki/Steam_Machine) at the time.

### Overall

All in all, it took a long time to get around to writing this up.
I originally planned to write a separate post for each car, but after _literally_ a couple of years I figured one post is better than none.
Each of these projects was an absolute joy to work on, and it was also quite nice taking a moment to reflect on the highlights from each of them.
But on to newer and fresher things!
