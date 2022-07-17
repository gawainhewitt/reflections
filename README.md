# Reflections

This is an [interactive sound installation](https://www.wigmoreinteractive.com/) by [Gawain Hewitt](https://gawainhewitt.co.uk/).

Created for the [Wigmore Hall Learning](https://wigmore-hall.org.uk/learning/learning-landing-page) Festival, Reflections, this installation invites you to create new musical sounds by manipulating original audio using a series of specially created effects.

Like a droplet on the surface of water changes a reflection, these effects change the sound in endlessly unexpected ways, allowing for hours of musical play!

The featured Wigmore Hall Learning sounds are: an excerpt of Daniel Fardon's 'Six Movements' performed by the Bloomsbury Quartet at Wigmore Hall, as well as recordings from [Chamber Tots](https://wigmore-hall.org.uk/learning/chamber-tots), [Singing With Friends](https://wigmore-hall.org.uk/learning/music-for-life), [Chestnuts Primary School](https://wigmore-hall.org.uk/learning/partner-schools-programme) and [Come and Create](https://wigmore-hall.org.uk/learning/come-and-create). 

## User Instructions

## About the design and piece

I was commissioned by Wigmore Hall Learning to make a piece that celebrated the music made on their community programme, and also allowed the audience to create music themselves. The theme of the festival was reflections, and they wanted this to feature in the piece as well.<br><br>

### The brief

An online interactive installation on the theme of the Learning Festival, Reflections.
Mirror, mirror on the wall … Join us for our annual Learning Festival as we explore the realm of reflections through a series of creative workshops and concerts for all ages. Together we’ll take a journey through the looking glass to discover musical mirrors, distortions, refractions and re-imaginings.   
We’ll also reflect and celebrate the work of artists and participants from across the Learning programme, sharing their voices, creativity and music; and we invite you to join us in sharing your own musical moments.

Later conversations added the following:

* an aesthetic that suggested reflections in some way, perhaps through mirrored image or ripples in water or both.

* Needs to fit with Wigmore Hall aesthetic and brand

* Include the option to add new content

* Stretch goal - user can record their own content

<br>

My suggestion was to make a piece that contained recordings of pieces from the learning programme but also allowed audience to record themselves. Additionally this piece could also be a musical instrument itself and used within workshops. 
<br><br>
I built the piece using JavaScript. [P5.js](https://p5js.org/) was used for the graphics and [tone.js](https://tonejs.github.io/) for sound. 
<br> <br>
Aesthetically I worked with the producer to explore ways to make it link to Widmore Hall which I did with the colour and making the main button a version of the flame from the original logo. Creating this flame as a lightweight scaleable image was a challenge, and I wrote a helper application to enable me to trace the image and turn it into a vector which can be found [here](https://github.com/gawainhewitt/graphicsSketcher).
<br> <br>
The visualisation is coded directly and measures the amplitude, turning this into graphics in real time. One side showing the uneffected audio and the other the effected audio.
<br><br>