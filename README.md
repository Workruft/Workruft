# Workruft

## About/Testimoanials

> *"Best game ever, in the making." `-` creator*

> *"Workruft is all of the Top 10 Games of 2021 combined!" `-` creator*

> *"First guaranteed cure of the corona." `-` WHO, CDC, Trump, Biden, and Putin, simultaneously, all at once, at the
> same time, in unison, together*

> *"Attack Helicopter, Attack Helicopter, Attack Helicopter!" `-` Attack Helicopter*

> *"I am groot! Also hey, what is this game it's really good!" `-` Groot*

---

## How 2 Play?

Head over to the [Releases](https://github.com/Workruft/Workruft/releases) section and download the latest release.

Workruft is compacted into a single HTML file. You need only open it in your web browser to play!

---

## Media

![](Workruft%20-%20Fridge%203D%20Map%20-%2007-03-20.png?raw=true)

![](Workruft%20-%202020-07-03.gif?raw=true)

---

## Can I help?

Yes.

## How 2 Server? How 2 Develop?

Depending on which you're wanting to do:
  - Server:
    1. Put the following in the same local folder (if not the entire project):
        - /Server/
        - /Common/
        - package.json
  - Development:
    1. Clone the entire repository to your computer. (Btw might wanna [lern](https://rogerdudler.github.io/git-guide) u
      some [git](https://git-scm.com).)

Then:
  2. Install [Node.js](https://nodejs.org/en/download/). Once you can type `npm -v` in your terminal and see the version
     printout, you should be good to go.
  3. With a terminal open at the local Workruft directory, type `npm install` to have Node automatically install
     Workruft's dependencies. Wait for it to finish.

If running the server:

  4. Depending on whether you're using [Visual Studio Code](https://code.visualstudio.com):
      - VSCode:
        - Run the NPM script `start-server` from the sidebar.
      - Not VSCode:
        - Run `node 'Server/index.js'` in the terminal.
  5. You should now see this in the terminal:
      > Server ready and listening! {"address":"::","family":"IPv6","port":1337}<br/>
      > Gettin yo IP...<br/>
      > Yo IP address is: 1.2.3.4

      Once you do, the server is up!

If developing:

  4. Depending on whether you're using [Visual Studio Code](https://code.visualstudio.com):
      - VSCode:
        - Run the NPM script `build-client` from the sidebar.
      - Not VSCode:
        - Run `npx parcel watch Client/Page/index.html --no-hmr --public-url . --out-dir dist/client` in the terminal.
  5. Open up `.../Workruft/Codez/dist/client/index.html` in the browser.
  6. As you develop, whenever you save, ParcelJS (npm package) should monitor the Codez and keep `index.html` up-to-date
     automatically.
  7. Contact Mr. Workruft himself and ask how you can be of help with your miserable lack of skillz.

---

## A.K.A.

- 🍎🍌🍓 "Workfruit" 🍍🍉🍇
- ❄ "Fridge 3D" ❄
- 🏙 "Scam City" 🏙
- [Fragile](http://fragilegame.blogspot.com)
- Glitch Nova
- Glitch 3D