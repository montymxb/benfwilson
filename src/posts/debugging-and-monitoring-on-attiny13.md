---
title: Debugging & Monitoring on an ATTiny13
date: 2026-03-07
tags: [attiny, post, project, avr, debugging]
excerpt: Getting debugging & monitoring setup with bit-banged UART on the ATTiny13
draft: false
---

---

_This post is a continuation from [getting started developing for the ATTiny13 & 45](/post/attiny-getting-started-and-flashing)._

Previously I was going over how we can get a simple program flashed onto an ATTiny45 (and also ended up doing this for an ATTiny 13 too), and we got an simple LED flashing. This was a great way just to verify that we could write, compile and flash the board successfully. I even played around a bit in my spare time and hooked up extra LEDs to the other IOs to create a little chain of lights, just for fun.

With the basic setup out of the way, I wanted to get a bit more information about what's going on during execution on the ATTiny itself. I already had LEDs, which could be used to broadcast a bit of information. But I also wanted to communicate data back on the wire via some clock, or even pulse back in Morse code on a single pin. Unfortunately I'm not particularly well-versed in Morse Cod, and I also preferred to have something more robust.

To that end, I opted to setup basic Serial support on the ATTiny via UART. The ATTiny doesn't have hardware support for UART, but I could implement a bit-banged version of instead. I came across this after looking around a bit for solutions, but I wasn't entirely familiar with bit-banging at first (although I'd heard about it numerous times before). Effectively, it means we can emulate the protocol in software rather than in hardware, using GPIOs in this case, to do what the hardware would be doing for us. It'll be both slower & less efficient, but for me I figured this would be sufficient to start with.

While looking more into how I could bit-bang UART, I also came across the debugWIRE protocol. I was curious so I dug more into that. Turns out the [debugWIRE protocol](https://en.wikipedia.org/wiki/DebugWIRE) was developed by Atmel for their AVR family of microcontrollers -- it's a bit more lightweight than JTAG for the same purposes. To enable it, it does requires programming the DWEN fuse, but in doing so it also disables the RESET pin and ISP (which we're using to program the chip in the first place). Already this kind of ruled it out for the basic monitoring I wanted (combined with repeated reprogramming early on), but reading further it's clear that it provides excellent debugging support: full memory inspection, execution control via breakpoints, etc.. There is dedicated hardware that you need in order to leverage debugWIRE, but it looks like it's reasonable to build your own as well. So with all that in mind, I decided to stick with a lightweight bit-banged UART for now.

### Setting up TX-only UART

Given that I've never done something like this before, and the flash constraints are pretty tight on the ATTiny boards, I wanted to start with a TX only implementation on the ATTiny13 (again with just 1KB flash). I combed the web a bit to find existing implementations, and I also used Claude Code to help generate a few small proposals to compare against. Altogether this netted the following high-level approach:

- Declare the clock rate (10Mhz)
- Declare what we want as our desired baud rate (something slow, like 9600 baud)
- Declare our TX pin (pretty much the only pin we'll need for a TX-only implementation)
- Sketch out a software implementation of the protocol that we can repeat for each byte
	- Pull the TX line low for our starting sequence
	- Shift out all 8 bits
	- Pull the line high again for our stop sequence

That's pretty much it! Not too bad when you abstract the implementation details away.

Writing up a candidate implementation that followed that plan, I got something like this:

```c
#define TX_PIN PB0
#define BAUD_RATE 9600

// try to setup a timing delay factoring in the ATTiny13 clock
// 10Mhz in our case
#define BIT_DELAY_US (10000000 / BAUD_RATE)

/**
 * Initialize serial pins
 */
void serial_init(void) {
  // TX output
  DDRB |= (1 << TX_PIN);
  // pull TX high (idle)
  PORTB |= (1 << TX_PIN);
}

/**
 * Write a single byte via bit-banged serial
 */
void serial_write_byte(uint8_t data) {
  // send out the starting bit
  PORTB &= ~(1 << TX_PIN);
  // wait
  _delay_us(BIT_DELAY_US);

  // shift out our bits
  // least-significant bit first
  for (uint8_t i = 0; i < 8; i++) {
	  if (data & 0x01) {
		  PORTB |= (1 << TX_PIN);
	  } else {
		  PORTB &= ~(1 << TX_PIN);
	  }
	  _delay_us(BIT_DELAY_US);
	  data >>= 1;
  }

  // send the stop bit
  PORTB |= (1 << TX_PIN);
  // closing wait
  _delay_us(BIT_DELAY_US);
}

/**
 * Helper to write out a whole string of bytes via our serial implementation
 */
void serial_write_string(const char* str) {
  while (*str) {
	  serial_write_byte(*str++);
  }
}

```

To quickly summarize what I'm doing in the code above, this is a _TX-only_ implementation that pulses about 9600 times per second (9600 baud). We can achieve this by dividing up the number of clock cycles we have per second (10Mhz here), to know how long we should be delaying for each pulse. The actual protocol implementation itself is pretty simple as well. You send a starting sequence (TX pulled LOW), delay, and then send one bit at a time as you shift through all 8-bits of the byte. Once done, we send a closing sequence (TX pulled HIGH), and that's it. In theory the above should work pretty well without needing to do too much else.

Chances are that this implementation will be a bit off in terms of timings, given it's not accounting for the extra clock cycles that are consumed by the underlying instructions themselves after compiling, but it should be small enough to be negligible. In this case the delays are about ~1041 clock cycles, so it is still possible we could drift on really long chains of outputs. But we shouldn't be entering that territory for shorter debugging messages. Still, if that comes up, it won't be entirely unexpected.

Without further ado, we're ready to test this out! As is I still was wired up to some LEDs, so there's no actual UART connection to write to yet, but I wanted to make sure the hex was going to be small enough to flash successfully.

```bash
# compile to elf
avr-gcc -mmcu=attiny13 -o main.elf main.c
# convert to intel hex for flashing
avr-objcopy -O ihex -R .eeprom main.elf main.hex
```

From that, I had no issues during compilation, and the size looked okay. The one exception was from a warning that I kept seeing (from the beginning actually, I just omitted it early on).

```
# warning "F_CPU not defined for <util/delay.h>"
```

And actually, this time, I decided to follow up on that for good measure. Seems this is important to allow the build system to know how fast your chip is running (in our case 10Mhz, assuming no changes). It apparently defaults to the following, which can also be added explicitly in your source or via compiler flags to remove the warning.

```c
#define F_CPU 1000000UL
```

And there was another warning as well that deserved some attention:

```
# warning "Compiler optimizations disabled; functions from <util/delay.h> won't work as designed"
```

This one made more sense given I had no optimizations set during compilation. I figured I would focus on optimizing for size, and once adding that in, the last warning was gone as well. To bring up what optimizations were available I checked out the help for `avr-gcc`, and tried something like this

```bash
avr-gcc --help=optimize
```

That provided a _ton_ of optimization information that I wasn't aware of the first time around, which was fantastic. Right up at the top I saw a familiar entry,`-Os`, to optimize for space. There was also `-Ofast` for speed, `-Og` for _debugging_ (interesting), and the usual `-O<number>` for tweaking how far to push optimizations. For me, `-Os` was sufficient.

```bash
avr-gcc -Os -mmcu=attiny13 -o main.elf main.c
```

Just for good measure, I checked the size difference using the old program I was running (before adding in the one-way Serial logic outlined above). Before I got a binary with 294 bytes, and optimizing for space I got just _90_ bytes. This looked great at first, but upon flashing the program nothing worked correctly, specifically the LEDs turned on but never turned off. I tried out `-O1`, `-Og` and `-Ofast` just to see how those fared, and all of them produced the exact same result.

This was puzzling at first, so I went back to my implementation, and swapped out a custom `_delay_ms` function I wrote with a busy spin, back to the library defined version for AVRs. This was previously done, as a test, to try to reduce the overhead from compiling against that library. But at this point I wondered if it was better to compile it in and _then_ optimize.

Sure enough, then compiling with `-Os` produced the desired program functionality at just 106 bytes. But now I was curious why my 16 bytes smaller version did _not_ produce a working program under optimization. At this point, I assumed that my function implementation had been aggressively optimized out.

I tweaked things a bit a first to no success, but eventually tried using `volatile` to mark the variable in my busy spin as non-optimizable to the compiler. After doing that, I got a 146 byte program (without the delay libs included) that worked as expected. So this seemed to support the rationale that the compiler was optimizing the function away. But why? Well, to elaborate on that a bit, in its current form my custom delay looked a bit like this (with volatile added to resolve the issue):

```c
void _delay_ms(int ms) {
    volatile int ms2 = ms * 16;
    while (ms2 > 0) {
        ms2--;
    }
}
```

Not very pretty being a busy spin & all, but again we're just playing around with things here. Adding the volatile keyword to `ms2` helped remove the issue, and that in itself was changed from directly manipulating `ms` itself instead of using `ms2`. Exploring this a bit further I found that optimizing with `volatile int ms` in the parameter declaration also produced a working program, but at a greatly accelerated cycle speed (the LEDs were flickering on and off maybe 10-20x faster than expected). Clearly there was still more going on that I didn't understand. I didn't want to get _too_ off track so I could still have time to test out the serial logic, but I wanted to do one last look into the `_delay_ms` library implementation itself.

A brief peek into **util/delay.h** showed what appear to be a couple of versions for how that function is compiled, one optimized with an internal call to `__builtin_avr_delay_cycles` and another unoptimized busy loop with a call to `_delay_loop_2`. [Looking up the first](https://gcc.gnu.org/onlinedocs/gcc-14.1.0/gcc/AVR-Built-in-Functions.html) indicates it can "Delay execution for _ticks_ cycles", taking that at face value without digging further seems pretty self explanatory. I found a bit more info as well under the [AVR libc user manual](https://avrdudes.github.io/avr-libc/avr-libc-user-manual/group__util__delay.html), which indicated the second approach is in-fact a fallback with a busy loop. Pretty interesting stuff!

Assuming we're optimizing, we'll get the first version, and assuming that's heavily optimized then I don't really need my own implementation anyways (which probably was the right answer in the first place to begin with).

With that tangent out of the way, I came back to the TX-only feature. I compiled & flashed that to the board, while sending bytes for the sequence `hello world` (original, right?). The end result was a 226 byte hex that flashed with no issues, and as far as I could tell the TX-only logic ran as expected. Great, but it passed by so quickly there was wasn't much more than a slight delay before the still-in-place LED sequence started up. I wanted a little more visual confirmation before proceeding, and since I had a LED on PB0 (which is our TX pin), I figured I could artificially delay the normal baud rate to something ridiculously slow and watch the serial write take place.
```c
#define BIT_DELAY_US 1000 * 1000 
```

With that I was able to see some activity on the LED. I had no outright reason to doubt what was setup so far, but it's always nice to get some concrete feedback _just_ to be sure. I can't count the number of times this kind of quick sanity check has helped to avoid issues later on.

### Testing out one-way UART

Now that we're writing data out via serial, we need something to receive the incoming data! After setting the bit delay back to what it was before, I dug out a Serial to USB converter that I had lying around. The particular one that I grabbed was converter based around an "FTDI FT232RL" that I got some years ago. I'd used it a handful of times for UART communication with various other devices -- you'd be surprised how many devices have UART headers with or without pins attached -- and it was my go-to this time as well. Apparently the FT232 is a pretty popular converter for USB to Serial & vice-versa, so there's no shortage of devices that incorporate it.

On macOS I didn't have any problems communicating with the FT232 driver-wise, but if you're on Windows or any other system that needs some drivers, you can pull them directly from the [FTDI chip product page](https://ftdichip.com/products/ft232rl/). You should also be able to use most other USB to Serial converters that you happen to come across, assuming the converter chips are legitimate & function as expected.

What's cool here is that we're just checking one-way communication, so all we need to do is connect the TX pin on our ATTiny to the RX pin of our converter, and connect GND as well. The rest we can leave unconnected for now assuming the board has power. VCC might be needed if this isn't the case, but then double check that you're using the _right voltage_.

At this point I plugged the converter in, powered up the ATTiny, and used `minicom` to establish a connection to our new serial device:
```bash
# may need to check where your device is listed in /dev/ first
# just checking tty devices may be enough
minicom -b 9600 -D /dev/tty.usbserial-AQ044IRG
```

On my end then I got a whole bunch of random symbols, which wasn't what I was expecting, but least it was a start as data was being sent over the line. I decided to slow the baud rate down to 4800, re-flash, and try again. Still the output was the same, so I dropped it down to 2400 as well, but it was still the same result. Despite this, the number of symbols that I was receiving looked roughly about right for the string I was sending, but the encoding/decoding looked off, so I started looking things up a bit.

### Debugging

The first thing I came across was related to the clock speed of the device, which I was _pretty_ sure was 10Mhz, but honestly I never actually checked it to be sure. So going in that direction I went ahead and read the relevant fuses using avrdude to see what our clock was set to, being `lfuse` and `hfuse` respectively. On my end I got `0x6A` and `OxFF`.

There's [some helpful tools](https://eleccelerator.com/fusecalc/fusecalc.php?chip=attiny13a) to assist with both reading & writing fuse bits for ATTiny chips. Comparing against my own values more or less indicated I had the default fuses set, which is what I would expect given I hadn't explicitly changed any fuse values directly via `avrdude`. For the defaults, this also indicated I had an internal clock divider enabled. Taking our default 9.6Mhz (a bit off from the 10Mhz I thought we had before) and giving us about 1.2Mhz.

The question I had now was whether the internal clock was what we should be tracking with `F_CPU`, or the regular 9.6Mhz one. This brought me back to the fuses since I was pretty sure I overlooked the clock divider, and I figured I needed to turn that off to get a `9.6Mhz` clock without tweaking anything else. But before that, I did one little check with `F_CPU=1200000UL` just to see if that would work given the clock divider was still active.

And turns out that worked as expected! Finally I was getting a nice clean bit-banged serial output, and I was pretty happy with the result.

Despite this, I still wanted to remove the clock divider, and verify that I was going in the right direction. If I was right, I could get the same output with 9.6Mhz instead of 1.2Mhz, and simply adjust `F_CPU` to match once I changed the fuses.

```bash
# read lfuse just to check if it's 0x6A (w/ clock div 8 on, the default)
avrdude -p t13 -c usbtiny -U lfuse:r:-:h

# if so, we can write 0x7A to disable clock div 8
avrdude -p t13 -c usbtiny -U lfuse:w:0x7A:m
```

Reading the lower fuse byte one more time gave `0x7A`, just to confirm, and after adjusting `F_CPU` back to `9600000UL`, we got good reads again at the higher clock + baud. With that debugging tangent aside, I went back into looking at the UART implementation.

### Looking at a full UART

Now that I had the serial write, I was curious what it might take to add RX support as well. Turns out this direction is _much_ more complicated. The key detail on the RX side is that we have to be able to pick up the start sequence of an incoming byte, process each of the incoming bits, and then we have our byte. Initially this seems somewhat straightforward, until we consider what this does to the rest of our code.

Being in a single threaded environment, we're either handling TX or RX, but not both. If we try to 'listen' to an incoming RX byte, we either have to busy spin on the RX pin waiting for a change, or setup an interrupt handler. The later sounds quite good until you consider that an interrupt during a TX sequence will completely break the sequence, or if we disable interrupts during TX then we'll either miss our incoming RX byte or misinterpret a portion of it later. Either way, it's clear we're only running at half duplex (one way at a time), and not full duplex (both ways at once).

With that in mind, there was the choice of polling or using an interrupt. I opted for the interrupt given how busy spinning would absolutely ruin the ability to get anything else done, at the cost of needing to setup an ISR along with processing bytes post-receipt once the interrupt was completed. I figured that if this turned out to be _too_ complicated, I could always let it be, and simply move onto the other parts of the project I wanted to work on. Lacking the ability to send data in via RX would be a pain, but there would still be plenty of other ways to communicate with the ATTiny.

I let Claude code whip up a proposal for RX handling with interrupts, and got something to test out. Initially I wanted to write this myself, but given I didn't really need this yet I was more curious _how_ a potential implementation would look; also to serve as a reference if I decided to come back to this.

```c
#include <avr/interrupt.h>

#define RX_BUF_SIZE 16  // Must be power of 2
static volatile uint8_t rx_buf[RX_BUF_SIZE];
static volatile uint8_t rx_head = 0;
static volatile uint8_t rx_tail = 0;

static void uart_rx_init(void)
{
    DDRB  &= ~(1 << RX_PIN);   // Input
    PORTB |= (1 << RX_PIN);    // Pull-up

    PCMSK |= (1 << RX_PIN);    // Enable pin-change on RX pin
    GIFR  |= (1 << PCIF);      // Clear any pending flag
    GIMSK |= (1 << PCIE);      // Enable pin-change interrupt

    sei();
}

ISR(PCINT0_vect)
{
    // Only act on falling edge (start bit)
    if (PINB & (1 << RX_PIN))
        return;

    // Disable pin-change interrupt during reception
    GIMSK &= ~(1 << PCIE);

    // Center on start bit
    _delay_us(BIT_DELAY_US / 2);

    // Verify still low (not a glitch)
    if (PINB & (1 << RX_PIN)) {
        GIMSK |= (1 << PCIE);
        return;
    }

    // Sample 8 data bits
    uint8_t byte = 0;
    for (uint8_t i = 0; i < 8; i++) {
        _delay_us(BIT_DELAY_US);
        byte >>= 1;
        if (PINB & (1 << RX_PIN))
            byte |= 0x80;
    }

    // Wait through stop bit
    _delay_us(BIT_DELAY_US);

    // Store in ring buffer
    uint8_t next_head = (rx_head + 1) & (RX_BUF_SIZE - 1);
    if (next_head != rx_tail) {  // Drop byte if buffer full
        rx_buf[rx_head] = byte;
        rx_head = next_head;
    }

    // Re-enable pin-change interrupt
    GIFR  |= (1 << PCIF);      // Clear any flags from the data bits
    GIMSK |= (1 << PCIE);
}

static uint8_t uart_rx_available(void)
{
    return rx_head != rx_tail;
}

static uint8_t uart_rx_read(void)
{
    while (!uart_rx_available())
        ;
    uint8_t byte = rx_buf[rx_tail];
    rx_tail = (rx_tail + 1) & (RX_BUF_SIZE - 1);
    return byte;
}
```

And the following in my main:

```c
uart_rx_init();

// and during the main loop later
// periodically check for bytes from the ring buffer
if (uart_rx_available()) {
	uint8_t c = uart_rx_read();
    serial_write_string("got a byte: ");
    serial_write_byte(c);
    serial_write_string("\n");
}
```

The buffer looked pretty tight, but I still wanted to give this a shot and at least see whether it could. Flashing the program showed I was using 512 bytes (up from 260 with just the TX code). So already that nearly doubled my program size just to get RX logic via interrupts.

Almost *immediately* I realized I didn't wire anything up to allow this to work. So I plugged in PB1 to the RX pin on my serial converter, and then went back to minicom to check the output. I was surprised to not only not be able to send anything, but also now I wasn't getting any output either. My first guess was an extra `DDRB` line that I had forgotten to remove.
```c
DDRB |= (1 << PB1);
```

This was immediately after the RX pin setup, which was flipping the RX pin back to an input erroneously. I corrected that plus made sure to skip PB1 when setting LEDs I had setup.

Still no good, but I was pretty sure the main loop wasn't blocked by either the available check or the RX read, given the LED sequence I had programmed before was still running. So I disabled the RX setup entirely to see if that was related somehow.

Still nothing, so I disabled the RX checking entirely, leaving the original code more or less intact.

And still I got nothing. So I backed it up all the way to commenting out all of the new RX code entirely, just to be sure I hadn't messed something else up.

Ah! At this point not only was I getting serial output again, but the byte count dropped back to around 260 for the flashed program. Curious, I wanted to just let the interrupts be included and to watch what might happen. I would assume the library would be totally optimized out if everything was working as expected, and it was upon testing. Moving onto the next bit I wanted to bring back to the static vars, as I was wondering if they had disabled some compiler optimization that was causing issues then.

Now I was getting somewhere, the program size increased from 262 to 278 (+16 bytes) _and_ it was no longer working correctly for serial output. At this point I was pretty confident that the usage of volatile on a globally scoped variable was messing with the compiler. Slowly I started to pare things back to just a single entry, `rx_head`, no issues.

I did the same with `rx_tail` as well, also no issues. And then I re-added the little ring buffer `rx_buf`. Still no issues.

Okay, so at this point I was really starting to wonder _what_ exactly was going on. My next thought was that maybe I was exceeding what we could reasonably store in program. A quick look back at the data sheet reminded me I only had 64 bytes of SRAM to work with. With our ring buffer byte array, we had an extra 16 bytes being put aside, not including the space for the `rx_buffer` pointer itself. I figured that with all of those variables together we were just over the edge of our SRAM limit.

What was really interesting, and something I hadn't thought of before, was that I never got _any errors_ about this upfront. For example, when compiling a basic Arduino sketch, flash & RAM consumption from globals are reported. This is generated via static analysis, and ideally we should be able to get the same from avr-gcc too via a flag, or at least that's what I thought.

Well, it turns out there's another utility called `avr-size` that does exactly this! I ran it through on my main.elf like so:

```bash
avr-size --mcu=attiny13 -C -x main.elf
```

and with just the two global volatiles added I got the following:

```
AVR Memory Usage
----------------
Device: attiny13

Program:     278 bytes (27.1% Full)
(.text + .data + .bootloader)

Data:         50 bytes (78.1% Full)
(.data + .bss + .noinit)
```

Fantastic! This was exactly what I was missing, and armed with this new information I was able to see that with the ring buffer I was topping out at 66 bytes for SRAM (103.1% full), definitely not viable. Just to further validate this was the case I trimmed down the buffer by 2 to fit into 64 bytes. That re-flashed with no problems and I was getting the correct serial output again.

After re-enabling the RX logic and slimming down that longer test string I was writing out, I had a program which weighed in around 472 bytes flash and 38 bytes data. Not too bad, plus the receive logic was working finally too for just a single byte at a time. Not the most efficient, but that's still a functional half duplex UART along with some other logic for around 472 bytes.

That'll cap this one off, as it was getting quite long. But I already I was having quite a lot of fun working through this & seeing what I can get setup on this little microcontroller. I think I'll probably conditionally compile out the RX handling going forward, unless I really need it, especially since I'm just getting 1 byte at a time, and the program space could definitely be used for something else.
