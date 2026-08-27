# Heat Check — Build Log

## Project goal

Build a polished browser game for an entrepreneurial finance class in which the player shoots basketballs, earns as many points as possible in either 30 or 60 seconds, and tries to beat a saved personal record.

## Features completed

- Created a responsive, dependency-free browser game using HTML, CSS, JavaScript, and Canvas.
- Added two selectable game modes: Quick Fire (30 seconds) and Full Court (60 seconds).
- Added drag-to-aim and release-to-shoot controls that work with mouse, trackpad, and touch.
- Implemented basketball physics, including gravity, rim collisions, floor bounces, and trajectory guidance.
- Added scoring, shot totals, shooting accuracy, current streak, and best-streak statistics.
- Added separate personal records for each timed mode using browser storage.
- Added the “on fire” mechanic after two consecutive made baskets.
- Fire-streak baskets display a flame trail, glow, particles, animated messages, and are worth 3 points instead of 2.
- Added sound effects with an on/off control.
- Added pause, resume, replay, mode selection, and final-results screens.
- Designed a responsive arcade presentation with a custom court, scoreboard, hoop, basketball, and mobile layout.
- Raised the starting ball position and added responsive bottom clearance so players have enough room to pull back and aim on smaller screens.
- Rebalanced launch power based on viewport width so shots comfortably reach the hoop on a 13-inch laptop without becoming uncontrollable on phones.
- Shifted the ball and hoop positions for compact laptop screens and synchronized the dotted trajectory preview with the actual physics.
- Removed the fixed-height court overflow that could push the ball below the visible play area on 13-inch laptops; the game now fits the available browser viewport.
- Rebuilt the hoop presentation with a substantially larger glass backboard, high-contrast frame, inner glass border, regulation-style target square, mounting plate, pole, and support braces while preserving the existing rim collision physics.
- Converted the basket to a true side profile, enlarged the ball and rim, and added a solid backboard collision surface so bank shots rebound naturally toward the hoop. Rim endpoint collisions and scoring behavior were retained.
- Reduced the made-basket respawn delay to 260 milliseconds, allowing the next shot to begin almost immediately while preserving enough time to see the ball clear the net and receive scoring feedback.
- Replaced the single-ball cycle with rapid-fire multi-ball play: a fresh ball is ready immediately after every release while previous shots continue through their complete flight, collision, and scoring paths.
- Increased responsive launch velocity by roughly 17–20% for quicker shot travel, with the aiming preview using the same updated speed.
- Added a responsive, stocked basketball cart behind the shooting position with wheels, frame, basketball rack, and feed rail leading to each newly available ball.
- Added a one-time in-game personal-record celebration that triggers the instant the saved score is surpassed, featuring five timed multicolor firework bursts, glowing trails, sound, and an animated “NEW RECORD!” announcement.
- Expanded the sound design with distinct procedural shot whooshes, hardwood bounces, metallic rim clangs, backboard thuds, net swishes, and layered crowd reactions for streaks and records.
- Replaced the box-shaped ball holder with a realistic sloped open-wire gym cart featuring tubular framing, mesh panels, push handle, lower chassis, swivel casters, return rail, and basketballs resting inside the basket.
- Replaced the basket-style cart after reviewing real courtside equipment references. The new professional rack uses three exposed angled steel rails, individual ball positions, twin uprights, a broad non-tip base, equipment placard, and locking casters—with no basket, mesh enclosure, or shopping-cart handle.
- Added a styled startup notice recommending a windowed browser tab because viewport width determines the ball-to-hoop distance and affects aiming consistency.

## Scoring rules

- Normal made basket: 2 points.
- Second consecutive basket and every basket while the streak continues: 3 points.
- A missed shot resets the streak.

## Quality checks

- Kept the project self-contained and free of package-install requirements.
- Added responsive sizing for desktop and mobile screens.
- Added accessible labels to icon controls and the game court.
- Limited high-density canvas rendering for stable performance.
- Stored records locally so refreshing the page does not erase them.

## Name ideas

1. Heat Check
2. Rim Rush
3. Net Inferno
4. Hot Hand Hoops
5. Swish Streak
6. Buzzer Blaze
7. Full Court Fire
8. Nothing But Heat
9. Hoop Hustle
10. Flame Game

## How to run

Open `index.html` directly in a modern browser, or serve this folder with any basic local web server. During development, the game was served at `http://localhost:8080`.
