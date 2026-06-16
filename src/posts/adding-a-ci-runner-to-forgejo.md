---
title: Adding a CI Runner to Forgejo
date: 2026-04-18
tags: [attiny, post, project, avr, oled]
excerpt: Setting up a tiny OLED driver to work within 1kb of flash & 64 bytes of SRAM on an ATTiny13
draft: false
---

I found myself needing to set up a Gitforge locally some months ago to serve as a pre-staging area for development (and local hosting for private projects as well).
There were a a few good choices to start with, being [Gitlab](https://about.gitlab.com/), [Forgejo](https://forgejo.org/) & [Gitea](https://about.gitea.com/).
Of these I've already set up a Gitea & Gitlab instance in the past, so I was really keen on trying out Forgejo this time around.
Forgejo itself is based on Gitea as well, and having had a good experience with that, I was interested to see how that would pan out.

In case you're not familiar, a Git forge is a platform for developing & collaborating on software [^wiki], and a Git forge does this around git itself naturally.
In general, most Forges come with rich features beyond providing a web-based Git client as well; such as issue tracking, CI support, and package management.
Forgejo in particular has all of these features, which was a key motivation for me.
To be fair, Gitea & Gitlab also support these, but the similarity of Forgejo's UI to Github's is also a point in its favor.
Anything to reduce onboarding time & learning friction is always a plus.

[^wiki]:https://en.wikipedia.org/wiki/Forge_(software)

After one thing or another, I eventually came to where I needed a CI runer. So, naturally, I looked into setting up a CI runner in Forgejo.
I ran into a number of hiccups along the way (mostly due to my own setup).
During the process of tracing my steps, I figured I would write it up in a post later; especially so I could refer to it later on.

For some background, my Forgejo instance is running on an old 2015 MacBook pro, which is running Debian.
According to the [documentation for installing Forgejo runners](https://forgejo.org/docs/v11.0/admin/actions/runner-installation/), it's recommended to put the runner on a _separate_ system from the Forge itself.
A major part of this is security related, but additionally there's the notion of performance as well.
Putting the runner on an entirely different system places a clear division between the two, and prevents a bad CI job (or jobs) from taking down your whole forge (the Docker daemon comes to mind here).

As for the CI runner itself, I opted to dust-off another (and older) MacBook pro from 2011.
The hard drive was replaced with an SSD, and it has mismatched RAM of 2 GB + 4 GB (long story for another time, but in short _don't do that_).
This machine has been running Arch for a bit as an experiment, so it was more or less ready to start setting up as a runner.

As noted above for installing runners, Forgejo has some great instructions for setting them up.
For Arch there's also a `forgejo-runner` package in the **extra** repo, which I opted to start with.
There's also a package in the the AUR, but I ran into some issues setting that up.

### Installation

In case you haven't installed these already, `docker` and `git` need to be present:

```bash
sudo pacman -Syu forgejo-runner docker git
```

Docker also needs to be enabled as well.

```bash
sudo systemctl enable --now docker.service
```

In my case the `forgejo-runner` user was created automatically, but it's good to double check that it's there.
If not you can [make it yourself as well](https://forgejo.org/docs/v11.0/admin/actions/runner-installation/#setting-up-the-runner-user).

Once the runner is all setup, you'll need a registration token from your Forgejo instance (local or otherwise).
This can be grabbed by hopping over to **/admin/actions/runners** at your Forgejo instance and setting up a new runner.
It just needs a name and a description, and in return you'll get your token.
Be sure to hold onto that, as you'll need it later when configuring a **.runner** file via `forgejo-runner register`[^forgejo-register].
I got to that part after ensuring Forgejo itself was ready to accept one.

[^forgejo-register]:https://forgejo.org/docs/v11.0/admin/actions/runner-installation/#standard-registration

I also needed to tweak the config shortly.
This included deciding whether to require docker-in-docker jobs.
That requires `container.privileged` to be set, and probably some other details, but I left this off on my end, so I can't attest to it.

With a token in hand, and a runner configured to my liking (*note* the runner from the extras repo for Arch sets its config under /etc/, not under /var/...) I was just about ready to register it.

As an aside, I had already made sure that my forgejo instance was securely accessible.
For a publicly accessible forge this is likely to be an upfront concern that's already resolved.
However, for a homelab setup a self-signed cert won't cut it when trying to hookup the runner.

For me, my instance was configured & managed via Ansible, and also setup with self-signed certs (which again, wouldn't cut it).
This worked initially, but the runner wouldn't be able to connect without a legitimate certificate authority (CA) to trust.

### So, Let's Make a Certificate Authority to Trust

There's this wonderful project called `mkcert` [^mkcert] which provides a convenient solution to this very problem.
It's not suitable for production systems, but for a local setup in a controlled environment (mostly), where I was willing to accept the risks & responsibility for doing this, it's a pretty convenient option (and it certainly beats self-signed certs).

[^mkcert]:https://github.com/FiloSottile/mkcert

```bash
# create a CA
mkcert -install
# and create a new certificate for the following names
mkcert forgejo.lan localhost 127.0.0.1
```

Of course, the names can be whatever suites your fancy, these were just for my own needs.

This gave me a cert & a key which I could use for as a source of trust, assuming the CA was trusted in advance.
Depending on how Forgejo is running, the cert & key can also be plugged into the config or into the **docker-compose.yml** itself.
_If_ you are using docker-compose (like me) then you're going to have to also update/recreate the volume as well, since it gets populated on creation.

Once that was in place, I wanted to make sure Forgejo actually pulled the new cert in correctly. If it's bare (without docker) there's nothing more to do, but with docker it was also straightforward:
```bash
docker compose down
docker compose up -d
```

Now that I'd gotten my Forgejo instance to use a custom cert, I needed to start getting things ready for my runner.
In particular, I needed to get a CA root, and pass it to my runner so I could trust it.

```bash
# get the location of the CA root
mkcert -CAROOT
```

I copied that over to my runner system, and added it into `/etc/ca-certificates/trust-source/anchors/`.
I named mine `mkcert-forgejo.crt`, but you can choose what works on your end.

### Setting up the Runner

Once that was in place, I also rebuilt my certificate bundle.
```bash
sudo trust extract-compat
```

And now that I had a trusted cert on my runner system, I could bind-mount the CA bundle into my jobs so that it's picked up.
From what I was able to tell, this appears to be due to docker having its own separate CA file that it uses, but I didn't get around to verifying this directly.
```bash
container:
     valid_volumes:
       - /etc/ssl/certs/ca-certificates.crt
     options: "-v /etc/ssl/certs/ca-certificates.crt:/etc/ssl/certs/ca-certificates.crt:ro"
```

And now, using the token from before, I was able to register a new runner like so:

```bash
forgejo-runner register
```

Fill out the details, and set whatever runner name you like.
For me I put in `arch-runner`, but it could have also been `potato-runner` to reflect the hardware in this case.

On my end the labels looked okay by default, but some of them were a bit dated.
You can tweak them pretty easily as desired.

I also double checked the systemd service at this point, to make sure it's running, registered, and that it's reading from the config I had changed (and not the **/var/** one).
This got me pretty bad since I was assuming the **/var** location was the active config, and although there was a config present there, I spent a bit too much time trying to figure out why my changes weren't applying.
```bash
systemctl cat forgejo-runner.service
```

Once I resolveed the config issue, it was just a matter of enabling the freshly registered runner, & checking its status:
```bash
sudo systemctl enable --now forgejo-runner.service
sudo systemctl status forgejo-runner.service
```

It might be worth checking the jouralctl to make sure something didn't go wrong behind the scenes as well, just to cover your bases.
```bash
sudo journalctl -u forgejo-runner.service -f
```

I also needed to verify that I could actually resolve the name of my forgejo instance from inside my runner's docker containers.
`/etc/hosts` wouldn't cut it since that's just for my own system, and the runner will likely have its own resolution.
There are a number of ways to do this, almost all of which revolve around updating the forgejo-runner configuration (very similar to what was done with the cert bundle above).

Something like this did the trick for me.

```bash
container:
  options: "--add-host=forgejo.lan:192.168.1.x"
```

And, per usual, it's always good to restart the runner:
```bash
sudo systemctl restart forgejo-runner.service
```

I also wanted this forgejo instance to be generally reachable across my network at `forgejo.lan`, not just this one machine.
Thankfully, I already had a PiHole instance that I setup sometime later in 2025, and so I opted to add a custom DNS record for this very purpose.
There's some care that should be taken with _what_ names you decide to set custom records for, as they could shadow legitimate names upstream (this applies to `.local` domains as well).

Adding the record to PiHole was simple enough, but getting the container to pick up that same record took an extra step.
DNS can be customized by modifying the daemon with `/etc/docker/daemon.json` (which doesn't exist normally).
Creating that file and adding in some JSON with the following DNS servers got me the expected resolution:

```json
{
  "dns": ["192.168.2.X", "1.1.1.1"]
}
```

Followed by a docker restart:
```bash
sudo sysetmctl restart docker
```

And when I still wasn't sure, I ran a quick test by trying a lookup from inside an Alpine container:
```bash
docker run --rm alpine sh -c "nslookup forgejo.lan"
```

This worked on my end, but I also did another quick check via `curl` in a similar fashion.

### Running CI Jobs

At this point it all worked, and I was ready to test CI with an existing repo.
Thankfully, either `.forgejo/workflows/ci.yml` or `.github/workflows/ci.yml` is suitable to drive the runner.
In my case most of these projects have a primary remote on Github, so I often had pre-existing Github workflows.
As far as I could tell these worked pretty much out of the box.
I'm sure there are exceptions, but it seems the Forgejo runner follows pretty closely with their specification language & features, which is very convenient.

And that was about it!
At this point I had a custom Forgejo runner for CI jobs on an old macbook pro.
It didn't really need to be setup with such old hardware, but it was a lot of fun to do so.
Best of all when I don't need the runner online, the forge works just fine without it, so I can opt to turn it on as need be.
However next time I think I'll pick up a more dedicated machine to do the job.
Especially when automated publishing is a goal (such as for npm packages).
