---
title: Driving an OLED Display from an ATTiny13
date: 2026-04-18
tags: [attiny, post, project, avr, oled]
excerpt: Setting up a tiny OLED driver to work within 1kb of flash & 64 bytes of SRAM on an ATTiny13
draft: false
---

> [!NOTE]
> _This post is a continuation from [debugging & monitoring on an ATTiny13](/post/attiny-getting-started-and-flashing). Check that out if you're interested in seeing how we got here._


From the last time I was working on the ATTiny13, I was able to get to a bit-banged half-duplex UART setup (see the post link above for details on that). Albeit at a bit of a cost on the RX side. Already I removed that half, and was perfectly happy with a TX only implementation, but now I was really interested in hooking up some peripherals.

I wasn't entirely sure yet, but I did have the following general sketch that I was going for (really it's just a sketch, but it's where all good ideas start from).

![A very quick sketch of the device I have in mind at the end.](/assets/images/board-sketch.png)

Although it's quite crude, this still summarizes the general idea of what I'm going for. A small prototyping device with 3 or 4 button inputs, a rotary encoder of some form, a small screen, external power & GPIOs exposed. Still, this is a very rough idea, and it's subject to change based on how things come together.

Buttons are straightforward enough. Simply connecting GPIOs to ground and enabling the internal pull-ups on the ATTiny13 for example, but already I was pretty limited on GPIOs to begin with (we have 6 at most). That, plus I really wanted to get a screen in there too, and that was going to be _much_ trickier. I had a small OLED with an I2C interface that I wanted to try out in particular. However I2C is _not_ supported on the ATTiny13 natively, but seems to be supported on the 45 last I checked, and so it looked like I was going to need to setup another bit-banged implementation to make this work too.

Last, but not least, it was already evident that there was not going to be enough flash or memory on-chip to handle everything I had in mind. I would definitely need to hookup some external flash & memory later on. I could simply get a bigger chip with more than enough head-room (ex. an ATMega328), but personally for me having such constraints creates a much more interesting (and creatively conducive) problem space to work within.

## Wiring up the OLED

I was really keen on getting this I2C OLED display working first, so I started familiarizing myself with the I2C protocol. I'm not an embedded systems engineer by trade (I tend to be more on the parsers, type-checkers and compilers side of things) so although I know about most of these protocols, I don't know much about the implementation details (at least not from memory). A quick browse on the wiki page for the I2C protocol revealed info that was pretty helpful [^i2c-wiki].

We would need a couple of signal pins: an SDA (serial data line) and an SCL (serial data clock). Already we were only using 2 pins for half-duplex UART, and without RX support that was really just 1 pin. So there were pins to spare still.

[^i2c-wiki]: I2C Reference: https://en.wikipedia.org/wiki/I2C

It was at this point that I went _back_ to my [original post](/post/attiny-getting-started-and-flashing) to look at the ATTiny13 pin-out again. I recalled writing an SCL there, and if so that meant I didn't need to setup a bit-banged implementation for the ATTiny13. The SDA & SCL pins _were_ listed, but they were written using the spec for the ATTiny45 and not the ATTiny13. This wasn't an issue, but I just wanted to be sure I wasn't missing a preexisting implementation on the 13.

So, I whipped up some simplistic I2C bit-banging code using pins PB2 & PB3.

```c
#define SDA_PIN PB2
#define SCL_PIN PB3
// microseconds, ~100kHz
#define I2C_DELAY 5

// set SDA/SCL as outputs (low)
#define SDA_LOW() DDRB |= (1 << SDA_PIN)
#define SCL_LOW() DDRB |= (1 << SCL_PIN)

// set SDA/SCL as inputs (pulled high)
#define SDA_HIGH() DDRB &= ~(1 << SDA_PIN)
#define SCL_HIGH() DDRB &= ~(1 << SCL_PIN)

// read SDA state
#define SDA_READ() (PINB & (1 << SDA_PIN))

void i2c_start(void) {
    SDA_HIGH();
    SCL_HIGH();
    _delay_us(I2C_DELAY);
    SDA_LOW();
    _delay_us(I2C_DELAY);
    SCL_LOW();
}

void i2c_stop(void) {
    SDA_LOW();
    _delay_us(I2C_DELAY);
    SCL_HIGH();
    _delay_us(I2C_DELAY);
    SDA_HIGH();
    _delay_us(I2C_DELAY);
}

// send 8 bits, MSB first
uint8_t i2c_write_byte(uint8_t data) {
    for (uint8_t i = 0; i < 8; i++) {
        if (data & 0x80) {
            SDA_HIGH();
        } else {
            SDA_LOW();
        }
        _delay_us(I2C_DELAY);
        SCL_HIGH();
        _delay_us(I2C_DELAY);
        SCL_LOW();
        data <<= 1;
    }

    // read ACK bit
    SDA_HIGH();
    _delay_us(I2C_DELAY);
    SCL_HIGH();
    _delay_us(I2C_DELAY);
    // ACK is active low
    uint8_t ack = !SDA_READ();
    SCL_LOW();

    return ack;
}

uint8_t i2c_read_byte(uint8_t ack) {
    uint8_t data = 0;
    SDA_HIGH();

    // read 8 bits
    for (uint8_t i = 0; i < 8; i++) {
        _delay_us(I2C_DELAY);
        SCL_HIGH();
        _delay_us(I2C_DELAY);
        data <<= 1;
        if (SDA_READ()) {
            data |= 1;
        }
        SCL_LOW();
    }

    // send ACK/NACK
    if (ack) {
        SDA_LOW();
    } else {
        SDA_HIGH();
    }
    _delay_us(I2C_DELAY);
    SCL_HIGH();
    _delay_us(I2C_DELAY);
    SCL_LOW();
    SDA_HIGH();

    return data;
}
```

This was already looking good for a first attempt, and corresponded nicely to the I2C specification I read earlier.

I also soldered on some header pins for the little OLED display, and set it up on its own breadboard for testing.

![A blue/black 1.3" 128x64 OLED Display based on the SH1106. And yes, the peel is still on.](/assets/images/oled1.jpg)

I powered it on as a test, but didn't see anything light up, which makes sense given it's an OLED and there's no 'backlight' panel that would light up.

> [!TIP]
> It's always good to double check your voltages. I first checked the data-sheet for this particular display to ensure it wasn't expecting 3.3.v power instead of 5v. The one I happen to have is based on the SH1106. It has its own voltage regulator onboard, and can accept either 3.3.v or 5v to drive it.

I wired up SDA to PB2, and SCL to PB3. I also hooked up a couple of 5k pull-up resistors from SDA & SCL to VCC, and I was about ready to try out the code I wrote up. 

![A roughly wired up OLED display to an obscured ATTiny13 on the other board](/assets/images/oled2.jpg)

## Interfacing with the SH1106

However I still needed to get the I2C address for the device, which is required in order to correctly identify which device you want to talk with. In many cases we may have a common bus for SDA & SCL between numerous devices, all communicating over I2C. So long as the addresses are unique across all devices, data can be transmitted to the correct device.

At first, I didn't really know what the address was, so I started looking up information about the SH1106. Unfortunately I wasn't able to pin down the _exact_ data-sheet for this board. Despite that setback, I did manage to find a likely default address of `0x3C`. Even if that was wrong I could work around that, and see if I could sketch up some code to update a single pixel on the screen.

After looking around even more, I was still coming up short for a data-sheet on the SH1106. Instead, I came across an [SH1106 implementation by Adafruit](https://github.com/davidperrenoud/Adafruit_SH1106) that looked quite promising, although it was a bit dated (11 years at the time of writing).

### Digging for info

Backing up a bit, I figured that I should start looking more into Adafruit's product line. Not only did they have a very similar component for sale, but it seemed like they had some solid demo code as well. Specifically, I came across a [1.3" 128x64 OLED graphic display with an SSD1306](https://www.adafruit.com/product/938) (wrong driver chip, but similar in its execution from what I could tell), complete with some example code too. Mainly these were targeting Arduino board, but that brought up another idea entirely. I figured I could instead do a test run using an Arduino with some known-good libraries to get a working state.

### Going the Arduino Route

Going this route, I pulled out an old Arduino Uno that I had lying around, stole my printer's USB-B cable to hook it up, and wired it to the OLED board. Thankfully I had already separately mounted the OLED board on a separate half-size breadboard. This proved to be pretty helpful, making it easy to pull it over to my Uno without the mess of wires that was accumulating around the ATTiny13's board.

![Arduino Uno wired up to the OLED board for testing. Nevermind the messy probe attachments, that part comes later.](/assets/images/oled3.jpg)

I used a very simple example program leveraging Wire (Arduino's 2-wire ISP comms library), and an Adafruit graphics library for talking with the SH1006 specifically (right driver this time around). I wasn't planning to stick with an Arduino, but assuming it worked it would be pretty easy to derive a minimally working implementation for the ATTiny13 from that.

While going this route I also came across the i2c_scanner example for Arduino boards, which allowed me to quickly confirm that the address for the OLED board was in fact `0x3C` and that the _board was responding_ to requests!

> [!NOTE]
> `0x3C` was expected, but it could have also been `0x3D`, always good to double check!

This was super helpful, as it was likely now that only my I2C implementation was flawed, rather than having a dead OLED board.

From there I installed a library for one of [SH1106 examples](https://github.com/laura240406/SH1106) (one of their snowflake examples) and gave the associated example program a test.

![Working snowflake demo on the OLED. A great way to confirm the device was working as expected.](/assets/images/snowflake.jpg)

So now that I had a baseline that was working, my plan was to pivot back from that to establish a smaller, simpler implementation on the ATTiny13.

Yet, there was a key issue, graphics take memory & program space. My hope, and plan, was that I could start simply, without needing external storage. From there, I could _probably_ use external memory or flash to store prepared sequences that I could stream to the OLED, without exceeding the memory or program space on the ATTiny13. But either way I needed to cognizant of the overhead.

## Backporting a Working Implementation onto the ATTiny13

After about a week of other things occupying my time, I came back to this and picked up porting that baseline I2C OLED driver setup. I started with the basic Arduino implementation, and got to work on the port. Ultimately, I wanted to setup the display logic to show a few pixels on the screen, akin to this code pulled from the original Arduino example:

```c
// init the display
display.begin();
// draw a pixel
display.drawPixel(10,10, WHITE);
// show it
display.display();
// clear it out after 5 seconds
delay(5000);
display.clearDisplay();
```

If I could get this part ported over, then I would have a nice starting point to build from.

The first thing I wanted to move over was the `display.begin` init code. I had looked a bit up, and started sketching a few attempts, but didn't get anywhere at first. A lot of that was quite dependent on the information I had at hand for the SCH1106, and I still kept having issues locating the right data-sheet, but I made do with what I had at hand.

After this I wanted to look at how `display.drawPixel` was setup. This method had a bit of rotation detection logic (which I chose to skip over) and then wrote the pixel value into a buffer as `0x1` for white (blue in my case) & `0x0` for black. Writing a pixel just populated the internal buffer, so I skipped the rest. As is I knew I couldn't even have a model buffer on the ATTiny13 given the memory constraint, at least not without some external memory attached.

I wondered if `clearDisplay` was just clearing the internal buffer to all black & calling `display.display`, so I took a peek. Turns out that one was even simpler than I expected, just a single call to `memset` on the buffer & nothing else. So I was able to skip that entirely.

The last piece of the implementation was `display.display`. Right off the bat I could see that the data being sent was divided up into pages, of which there were 8. This seemed to correlate pretty well with what I saw back in `drawPixel`. In that method there was also a notion of computing the following for the buffer:
```c
// set a pixel 'white'
buffer[x + (y / 8) * SH1106_LCDWIDTH] |= (1 << (y & 7));
```

Since we have a 128x64 display, and we're calculating y / 8, we get 8 pages. So this is effectively using `x + curPage * WIDTH`, where `WIDTH` multiplied by our page allows us to get computed offsets in a flat array. Beyond that I looked into how they stored their data, but more or less I had what I needed to proceed.

### Writing up the SH1106 Driver

The first part of `display.display` was mostly setup code:
```c
// set low col
sh1106_cmd(0x00);
// set high col
sh1106_cmd(0x10);
// set start line
sh1106_cmd(0x40);

// set page address (0xB0-0xB7 for pages 0-7)
sh1106_cmd(0xB0 + page);

// set column address (statically for now)
uint8_t col = 2;
// low nibble
sh1106_cmd(0x00 + (col & 0x0F));
// high nibble
sh1106_cmd(0x10 + ((col >> 4) & 0x0F));
```

After that it was a regular I2C transmission, setting the address, marking the command with `0x40` and actually sending the data to update pixels on the screen.

As an aside, I got a bit confused at this point due to the way data was prepared. The width, for example, was computed first as `64` and then shifted over by 3 bits, which leaves the upper 5 bits and a value of `8`. But this was still referred to as `width` in code. There were a couple oddities like this.

After looking through everything, I got what I figured was a general sense for how the send logic works.

To set a pixel, you would have to:
- start at the correct page address out of the 8 available pages
- set the correct column address
- transmit all pixels to modify as bytes until the end of the page (64 bytes)

This was my _very rough_ understanding at this point, so I wanted to practically apply it and see what kind of results I could get to test that understanding.

### Giving it a spin

After a lot of fiddling around, I had some code that should have done _something_, but I wasn't getting any response from the OLED. Just to be sure I was communicating I checked SDC & SCL with an oscilloscope (the purpose of the probes from the picture above). Curiously enough, I was reading 3v & nearly _2v_ on the SDA & SCL pins (I didn't compare which voltage was on which pin at this time, but already this was a problem).

The first thought that crossed my mind was that I was drawing a bit too much power through the GPIOs on the ATTiny13, especially since I had the pins wired up directly to the OLED while simultaneously driving some LEDs.

Just to do a little verification, I went back to the Arduino Uno that I tested with to measure the pin voltages there. I wasn't really expecting anything other than 5v across the board, but I wanted to be sure I wasn't missing something. Of course everything measured 5v and worked as it had before.

Back over at the ATTiny13 I was able to confirm that I was reading specifically 2v on SCL & ~3v on SDA. As a quick test, I swapped my power & ground to a different rail, disconnected all the LEDs I had hooked up, and before I removed the associated LED driver code I checked the voltage levels again. Spot on this time around 5v. I was just pulling too much power from the GPIOs directly. Going forward I noted that I would need some transistors to help do the work for drivings LEDs and other peripherals.

> [!NOTE]
> Not having a formal background in embedded systems design & development gets me like this all the time (regarding the overdraw on GPIO). Still I find it quite enjoyable to really drill down, figure out what's going on at the wire level, and learn something new in turn for next time!

### Getting Pixels on the Screen

Coming back after about a few weeks, I picked up where I left off and tried to get some actual pixels on the screen; now that I had the right voltages. Maybe I was writing into a strange corner or something, or maybe my I2C setup wasn't working as expected? I wasn't entirely sure yet, but I gave the existing pixel drawing code another look over. I tweaked a few things as well, but still wasn't getting anywhere.

At this point, I backed up a bit and thought about the I2C scanner that I used to confirm the device address in Arduino. It occurred to me that honestly it would be _much_ easier to try to implement the same, and use that to confirm whether my bit-banged I2C was working in the first place.

I needed to check for an 'ack' (acknowledge) coming back while I polled across the possible device addresses. Effectively I just needed to write to the address with `addr << 1` to indicate we wanted to set into WRITE mode, and look for an acknowledge in return. I had to check, but I2C addresses come in the range of `0x08` to `0x77`, so I needed walk the range and see what popped up (the rest of the possible addresses appear to be reserved and were skipped for this check).

### A Detour into PGM Space

Well, while putting that code together, I made a couple of interesting observations. The first was with all the strings I was printing out for debugging via UART, I kept exceeding the 64 byte SRAM limit.

With a bit of investigation & research, I came across something that I really should have checked for initially, storing fixed strings in program flash & reading those instead! Turns out there's `<avr/pgmspace.h>` [^pgm] which provides functionality for working with data stored in program space for this very purpose.

For the strings that were filling up my SRAM, I was able to leverage `PSTR` combined with `pgm_read_byte`, which allows us to declare a pointer to a static string that's contained in program space & read the pointed-to data itself.

[^pgm]:https://github.com/Synapseware/avr/blob/master/include/avr/pgmspace.h

### Polling for I2C

Once I had resolved the SRAM issue, and I was able to leverage the extra flash space I had, I couldn't find an address for any attached I2C device. This was partly good news, since it suggested the actual SH1106 code _may_ have been okay separate from my I2C code, but it also indicated that there was something up with either my I2C implementation or the way I had wired everything together.

I double checked the onboard connections between the ATTiny13 and the OLED board. And somehow, after checking, I saw that I managed to flip SDA & SCL. Honestly this happens _way too often_, even when I check for it, but I was glad that I caught it at this point. Swapping those back and rerunning the I2C address scanner gave me...`0x3C`! Fantastic! Finally I was getting a response, and the correct one as well.

> [!TIP]
> Always double check your connections! I can't count the number of times I've flipped things around, even when double & triple checking (although maybe it's just me). Often this can be as simple as correcting the misplaced connections, if you're lucky, but it can also lead to a bit of magic smoke leaving your beloved device.

With the scanner logic in place, I wanted to bring back what I was doing before with the pixel painting, and seeing whether that would work now that I had corrected my pin connections. With the original OLED driver implementation in place, I gave the code another run.

And it finally worked!

![A rather messy array of semi-organized pixels being driven by a bit-banged I2C implementation on an ATTiny13.](/assets/images/oled-on1.jpg)

It's not a particularly pretty sight, but it is functional! I messed around with the code a bit more and I was able to see that I was getting somewhat predictable results, but only for about half the screen.

Just to test things out I wanted to try and clear the screen entirely, and when I ran that it was pretty clear I was really only covering half the display.

![Tweaking with the code seemed to only cover about half the screen.](/assets/images/oled-on2.jpg)

It looked like I was hitting the first 64 columns, but not the rest. I just needed to correct my block logic from 0-7 to 0-15. And after that I was getting a full paint, but I wasn't able to set all the pixels yet, so there was still something else going on.

I was pretty sure it was just a logic error at this point that was escaping me. So I did a quick debugging round (or two), isolated the issue, and also whipped up a nice sin-wave function to boot.

![Sin-wave approximation from an ATTiny13](/assets/images/oled-wave.jpg)

And that was it! I was pretty much done at this point, and pretty happy with the results. I still had to deal with how I wanted to display more structured visuals, glyphs & such for text, but I figured I would handle that later. The most important part was that the display was working, I had a bit-banged I2C implementation, _and_ a working but simplistic SH1106 driver.

From here, my next steps are to add some inputs to match the outputs, and to start interacting in a more hands-on fashion with the controller.
