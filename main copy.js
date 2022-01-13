// ******COLOURS******

let colours = ({
    background: 'rgb(255, 255, 0)',
    startScreen: 'rgba(50, 50, 50, 0.75)',
    infoText: 'white',
    loadOff: 'rgb(0, 255, 0)',
    playOff: 'rgb(255, 0, 0)',
    on: 'rgb(0,255,255)',
    effectOff: 'rgb(0, 255, 0)',
    effectOn:'rgb(255, 0, 0)',
});

//******BUTTONS******/

let loadButton; // in setup this becomes an object with all the ingredients for a load button
let playButton; // in setup this becomes an object with all the ingredients for a play button
let effectButtons = new Array; //array to store effect buttons objects in
let numberOfEffectButtons = 5; //how many effect buttons?

// ******SOUND****** - i'm using the library Tone.js

// set up the unneffected side of the installation - this drives the left visualisation
// and will not be processed so not connected to destination. However all chain elements
// still need to be present otherwise timing will be off for the visualisation
const uneffectedAmpEnv = new Tone.AmplitudeEnvelope({
    attack: 0.1,
    decay: 0.2,
    sustain: 1.0,
    release: 0.1
});
const uneffectedSongPlayer = new Tone.Player();
const uneffectedMeter = new Tone.Meter();
uneffectedMeter.normalRange = true; // display volume as a number between 0 and 1 rather than as decibels
uneffectedSongPlayer.connect(uneffectedAmpEnv);
uneffectedAmpEnv.connect(uneffectedMeter);

// set up the effected side which is what we hear
const effectedAmpEnv = new Tone.AmplitudeEnvelope({
    attack: 0.1,
    decay: 0.2,
    sustain: 1.0,
    release: 0.1
}).toDestination();
const reverb = new Tone.Reverb ({
    decay: 4
}).toDestination();
const phaser = new Tone.Phaser({
	frequency: 15,
	octaves: 5,
	baseFrequency: 1000
});
const effectedSongPlayer = new Tone.Player();
const effectedMeter = new Tone.Meter();
effectedMeter.normalRange = true;
effectedSongPlayer.connect(effectedAmpEnv);
effectedAmpEnv.connect(effectedMeter);

let whichSound; // which of the samples?
let theSample; //current sample
let theVolume = -6;
let buffer0;
let buffer1;
let interfaceState = 0; // 0 displays the text loading, 1 is a button, 2 is a visualisation of the sound, 3 is error loading sound to buffer
let usedSounds = new Array;
let bufferToPlay = "start";
let lastBuffer;
let currentBuffer;
let numberOfSamples = 5; // the number of samples that we are
let started = false; //have we invoked Tone.start() and left the info screen?
let fileLength; // store the length of a sample in seconds in here
let scheduledRepeatID; // variable to store the scheduleRepeat in (as the function returns this). We can then use this to cancel it later.

// ******DIMENSIONS******

let cnvDimension; // how big is the canvas?
let waveformRatio = 3; // number that sets the waveform size relative to the screen
let buttonRadius; // variable to store the actual buttonRadius in
let visualisationWidth; // how wide each half of the visualisation is
let visualisationHeight; // max height of the visualisation
let visualisation = new Array(100); // to store the left hand data for visualisation
for(let i = 0; i < visualisation.length; i++){ // populate the array
    visualisation[i] = 0;
}
let visualisation2 = new Array(100); // to store the right hand data for visualisation
for(let i = 0; i < visualisation2.length; i++){ // populate the array
    visualisation2[i] = 0;
}
let rectangleX, rectangleY, rectangleWidth, rectangleHeight;

function preload(){
    chooseSample();
}

function setup() {  // setup p5

    let masterDiv = document.getElementById("container");
    let divPos = masterDiv.getBoundingClientRect(); //The returned value is a DOMRect object which is the smallest rectangle which contains the entire element, including its padding and border-width. The left, top, right, bottom, x, y, width, and height properties describe the position and size of the overall rectangle in pixels.
    let masterLeft = divPos.left; // distance from left of screen to left edge of bounding box
    let masterRight = divPos.right; // distance from left of screen to the right edge of bounding box
    cnvDimension = masterRight - masterLeft; // size of div -however in some cases this is wrong, so i am now using css !important to set the size and sca;ing - but have kept this to work out size of other elements if needed

    console.log("canvas size = " + cnvDimension);

    noStroke(); // no stroke on the drawings

    let cnv = createCanvas(windowWidth, windowHeight); // create canvas - because i'm now using css size and !important this is really about the ratio between them, so the second number effects the shape. First number will be moved by CSS
    cnv.id('mycanvas'); // assign id to the canvas so i can style it - this is where the css dynamic sizing is applied
    cnv.parent('p5parent'); //put the canvas in a div with this id if needed - this also needs to be sized

    // *** add vanilla JS event listeners for touch which i want to use in place of the p5 ones as I believe that they are significantly faster
    let el = document.getElementById("p5parent");
    el.addEventListener("click", handleClick);

    setvisualisationWidth();

    uneffectedSongPlayer.set(
        {
          "mute": false,
          "volume": 0,
          "autostart": false,
          "fadeIn": 0,
          "fadeOut": 0,
          "loop": true,
          "playbackRate": 1,
          "reverse": false
        }
    );

    effectedSongPlayer.set(
        {
          "mute": false,
          "volume": 0,
          "autostart": false,
          "fadeIn": 0,
          "fadeOut": 0,
          "loop": true,
          "playbackRate": 1,
          "reverse": false,
        }
    );
    visualisationHeight = height;
    loadButton = ({
        x: width/3,
        y: height/5,
        state: false,
        colour: colours.loadOff
    });
    playButton = ({
        x: (width/3) * 2,
        y: height/5,
        state: false,
        colour: colours.playOff,
        text: 'play'
    });
    let bottomButtonsY = (height/5)*4;
    createButtonPositions(bottomButtonsY);
}

function createButtonPositions(bottomButtonsY) {
    for(let i = 0; i < numberOfEffectButtons; i++){
        effectButtons.push({
            x: (width/(numberOfEffectButtons+1))*(i+1),
            y: bottomButtonsY,
            colour: colours.effectOff,
            text: `fx${i+1}`,
            status: false,
        });
    }
}

function draw() {
    rectangleX = loadButton.x - buttonRadius/2;
    rectangleY = loadButton.y - buttonRadius/4;
    rectangleWidth = buttonRadius;
    rectangleHeight = buttonRadius/2;
    background(colours.background); // background
    //imageMode(CENTER);
    if(interfaceState === 0){
        noStroke();
        fill(loadButton.colour);
        //rect(rectangleX, rectangleY, rectangleWidth, rectangleHeight);
        fill(150);
        textAlign(CENTER, CENTER);
        textSize(cnvDimension/20);
        text("Loading", loadButton.x, loadButton.y);
    }else if(interfaceState === 1){
        textAlign(CENTER, CENTER);
        textSize(cnvDimension/40);
        noStroke();
        fill(loadButton.colour);
        ellipse(loadButton.x, loadButton.y, buttonRadius);
        fill(0);
        text("Load", loadButton.x, loadButton.y);
        if(effectedSongPlayer.loaded === true){
            fill(playButton.colour);
            ellipse(playButton.x, playButton.y, buttonRadius);
            fill(0);
            text(playButton.text, playButton.x, playButton.y);
        }
        for(let i = 0; i < numberOfEffectButtons; i++){
            fill(effectButtons[i].colour);
            ellipse(effectButtons[i].x, effectButtons[i].y, buttonRadius);
            fill(0);
            text(effectButtons[i].text, effectButtons[i].x, effectButtons[i].y);
        }
    }else if(interfaceState === 3){
        noStroke();
        fill(loadButton.colour);
        rect(rectangleX, rectangleY, rectangleWidth, rectangleHeight);
        fill(150);
        textAlign(CENTER, CENTER);
        textSize(cnvDimension/30);
        text("Network Problems, click to try again", rectangleX, rectangleY, rectangleWidth, rectangleHeight);// same dimensions as the rectangle above
    }
    stroke(0);
    strokeWeight(3);
    let x = width/2 - visualisationWidth;
    let y = height/3;
    let startX = x;
    let startY = y;
    let endX;
    let endY;
    let effectsOn = 0;
    let level;
    for(let i = 0; i < numberOfEffectButtons; i++){
        if(effectButtons[i].status === true){
            effectsOn++;
        }
    }
    if(effectsOn === 0){
        level = effectedMeter.getValue();
    }else{
        level = uneffectedMeter.getValue();
    }
    let level2 = effectedMeter.getValue();
    visualisation.push(level);
    visualisation.splice(0, 1);
    for(let i = 0; i < visualisation.length-1; i++){

        startY = y + (visualisation[i]*visualisationHeight);
        endX = startX + visualisationWidth/visualisation.length;
        endY = y + (visualisation[i+1]*visualisationHeight);

        line(startX, startY, endX, endY);

        startX = startX + visualisationWidth/visualisation.length;
    }

    let x2 = width/2;
    let y2 = height/3;
    let startX2 = x2;
    let startY2 = y2;
    let endX2;
    let endY2;
    visualisation2.push(level2);
    visualisation2.splice(0, 1);
    if(effectButtons[3].status === false){
        for(let i = visualisation2.length-1; i > 0 ; i--){

            startY2 = y2 + (visualisation2[i]*visualisationHeight);
            endX2 = startX2 - visualisationWidth/visualisation2.length;
            endY2 = y2 + (visualisation2[i+1]*visualisationHeight);

            line(startX2, startY2, endX2, endY2);

            startX2 = startX2 + visualisationWidth/visualisation2.length;
        }
    }else{
        for(let i = 0; i < visualisation2.length-1; i++){

            startY2 = y2 + (visualisation2[i]*visualisationHeight);
            endX2 = startX2 + visualisationWidth/visualisation2.length;
            endY2 = y2 + (visualisation2[i+1]*visualisationHeight);

            line(startX2, startY2, endX2, endY2);

            startX2 = startX2 + visualisationWidth/visualisation2.length;
        }
    }
    if(!started){
        fill(colours.startScreen); // background
        rect(0, 0, width, height);
        fill(colours.infoText);
        text('click to start', width/2, height/2);
    }
}

function windowResized() {
    setvisualisationWidth();
    resizeCanvas(windowWidth, windowHeight);
}

function setvisualisationWidth() {
    visualisationWidth = (width/waveformRatio);
    if(height > width){
        buttonRadius = visualisationWidth/3.5;
    }else{
        buttonRadius = visualisationWidth/5;
    }
}

function handleClick() {
    if(!started){
        Tone.start();
        started = true;
    }else if(interfaceState === 3){
        console.log("network click");
        interfaceState = 0;
        assignSoundToPlayer();
    }else{
        let d = dist(mouseX, mouseY, loadButton.x, loadButton.y);
        if (d < buttonRadius/2) {
            debounce(loadButtonPressed(), 200);
            loadButton.state = true;
        }
        if(uneffectedSongPlayer.loaded === true){
            let d2 = dist(mouseX, mouseY, playButton.x, playButton.y);
            if (d2 < buttonRadius/2) {
                debounce(playSong(), 200);
            }
        }
        for(let i = 0; i < numberOfEffectButtons; i++){
            let d3 = dist(mouseX, mouseY, effectButtons[i].x, effectButtons[i].y);
            if (d3 < buttonRadius/2) {
                debounce(effectButtonPressed(i), 200);
            }
        }
    }
}

function effectButtonPressed(button){
    console.log(`effect button ${button+1} pressed`);
    // effect1();
    window[`effect${button+1}`](button);// this allows you to create a function name from a string and then call it
}

function effect1(button) {
    if(effectButtons[button].status === false){
        let sampleDivision = fileLength/(getRndInteger(4, 64));
        let sustain = sampleDivision/2;
        // effectedAmpEnv.triggerRelease();
        //effectedAmpEnv.triggerAttackRelease(1);
        console.log(`in effect1`);
        scheduledRepeatID = Tone.Transport.scheduleRepeat(() => {
            console.log("testing");
            effectedAmpEnv.triggerAttackRelease(sustain);
        }, sampleDivision);
        effectButtons[button].colour = colours.effectOn;
        effectButtons[button].status = true;
        console.log(`id of transport = ${scheduledRepeatID}`);
    }else{
        Tone.Transport.clear(scheduledRepeatID); // clear the repeat above
        effectedAmpEnv.triggerAttack();
        effectButtons[button].colour = colours.effectOff;
        effectButtons[button].status = false;
    }
}

function effect2(button) {
    console.log(`in effect2`);
    if(effectButtons[button].status === false){
        effectedSongPlayer.playbackRate = (Math.random()+0.01)*2;
        effectButtons[button].colour = colours.effectOn;
        effectButtons[button].status = true;
    }else{
        effectedSongPlayer.playbackRate = 1;
        effectButtons[button].colour = colours.effectOff;
        effectButtons[button].status = false;
    }
}

function effect3(button) {
    console.log('in effect3');
    if(effectButtons[button].status === false){
        reverb.decay = getRndInteger(2, 10);
        effectedAmpEnv.connect(reverb);
        effectedAmpEnv.disconnect(effectedMeter);
        reverb.connect(effectedMeter);
        effectButtons[button].colour = colours.effectOn;
        effectButtons[button].status = true;
    }else{
        effectedAmpEnv.disconnect(reverb);
        reverb.disconnect(effectedMeter);
        effectedAmpEnv.connect(effectedMeter);
        effectButtons[button].colour = colours.effectOff;
        effectButtons[button].status = false;
    }
}

function effect4(button) {
    console.log(`in effect4`);
    if(effectButtons[button].status === false){
        effectedSongPlayer.reverse = true;
        effectButtons[button].colour = colours.effectOn;
        effectButtons[button].status = true;
    }else{
        effectedSongPlayer.reverse = false;
        effectButtons[button].colour = colours.effectOff;
        effectButtons[button].status = false;
    }
}

function effect5(button) {
    console.log(`in effect5`);
    if(effectButtons[button].status === false){
        effectedAmpEnv.connect(phaser);
        effectButtons[button].colour = colours.effectOn;
        effectButtons[button].status = true;
    }else{
        effectedAmpEnv.disconnect(phaser);
        effectButtons[button].colour = colours.effectOff;
        effectButtons[button].status = false;
    }
}

function playSong() {
    console.log(`uneffectedSongPlayer.state = ${uneffectedSongPlayer.state}`);

    if(uneffectedSongPlayer.state === "stopped"){
        uneffectedSongPlayer.start();
        effectedSongPlayer.start();
        uneffectedAmpEnv.triggerAttack();
        effectedAmpEnv.triggerAttack();
        //effectedAmpEnv.triggerRelease("+0.1");
        Tone.Transport.start();
        playButtonState = true;
        playButton.colour = colours.on;
        playButton.text = 'stop';
    }else{
        uneffectedSongPlayer.stop();
        effectedSongPlayer.stop();
        Tone.Transport.stop();
        playButton.colour = colours.playOff;
        playButton.text = 'start';
    }

    if(effectButtons[0].status === true){
        Tone.Transport.clear(scheduledRepeatID); // clear the repeat above
        effectButtons[0].status = false;
        effect1(0);
    }
}

function loadButtonPressed() {
    uneffectedSongPlayer.stop();
    effectedSongPlayer.stop();
    Tone.Transport.stop();
    playButton.colour = colours.playOff;
    playButton.text = 'start';
    reload();
    lastBuffer = currentBuffer;
    console.log(`lastBuffer = ${lastBuffer}`);
    loadButton.colour = colours.on;
    chooseSample();
    }


function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min +1) ) + min;
  }

function chooseSample(){
    console.log(`usedSounds = ${usedSounds}`);
    if (usedSounds.length === numberOfSamples){
        console.log(`array full`);
        usedSounds = [];
    }

    do{
        whichSound = getRndInteger(1, numberOfSamples);
    }while(haveWeUsedSound(whichSound));

    usedSounds.push(whichSound);
    console.log(`whichSound = ${whichSound}`);
    theSample = `audioFile${whichSound}.mp3`;
    console.log(`theSample = ${theSample}`);
    console.log(`usedSounds = ${usedSounds}`);
    assignSoundToPlayer();
}

function haveWeUsedSound(comparer) {
    for(let i=0; i < usedSounds.length; i++) {
        if(usedSounds[i] === comparer){
            return true;
        }
    }
    return false;
};

function assignSoundToPlayer() {
    if(bufferToPlay === "start"){
        buffer0 = new Tone.ToneAudioBuffer(`/sounds/${theSample}`, () => {
            console.log("buffer 0 loaded");
            bufferToPlay = buffer0;
            currentBuffer = 0;
            loadButton.colour = colours.loadOff;
            console.log(`currentBuffer = ${currentBuffer}`);
            if (interfaceState === 0){
                reload();
            }
            reload();
            lastBuffer = currentBuffer;
            console.log(`lastBuffer = ${lastBuffer}`);
            chooseSample();
        },
        () => {
            interfaceState = 3;
            console.log(`interfaceState = ${interfaceState}`)
        });
    }else if(bufferToPlay === buffer1){
        buffer0 = new Tone.ToneAudioBuffer(`/sounds/${theSample}`, () => {
            console.log("buffer 0 loaded");
            bufferToPlay = buffer0;
            currentBuffer = 0;
            loadButton.colour = colours.loadOff;
            console.log(`currentBuffer = ${currentBuffer}`);
            if (interfaceState === 0){
                reload();
            }
        },
        () => {
            interfaceState = 3;
            console.log(`interfaceState = ${interfaceState}`)
        });
    }else{
        buffer1 = new Tone.ToneAudioBuffer(`/sounds/${theSample}`, () => {
            console.log("buffer 1 loaded");
            bufferToPlay = buffer1;
            currentBuffer = 1;
            loadButton.colour = colours.loadOff;
            console.log(`currentBuffer = ${currentBuffer}`);
            if (interfaceState === 0){
                reload();
            }
        },
        () => {
            interfaceState = 3;
            console.log(`interfaceState = ${interfaceState}`)
        });
    }
}

function reload() {
    console.log(`in reload`);
    if(lastBuffer !== currentBuffer){
        let thisBuff = bufferToPlay.get();
        uneffectedSongPlayer.buffer = thisBuff;
        effectedSongPlayer.buffer = thisBuff;
        getFileLength(thisBuff);
        interfaceState = 1;
    }else{
        interfaceState = 0;
    }
    console.log('when we getting here?');
    // buffer0.dispose();
    // chooseSample();
}

function getFileLength(buffer) {
    let lengthInSamples = buffer.length; // how many samples are in the buffer?
    console.log(`lengthInSamples = ${lengthInSamples}`);
    let sampleTime = effectedSongPlayer.sampleTime; // what is the duration of the sample in the buffer in seconds?
    let lengthInSeconds = lengthInSamples*sampleTime;
    console.log(`lengthInSeconds = ${lengthInSeconds}`);
    fileLength = lengthInSeconds;
}

function debounce(func, wait, immediate) {
    // 'private' variable for instance
    // The returned function will be able to reference this due to closure.
    // Each call to the returned function will share this common timer.
    var timeout;

    // Calling debounce returns a new anonymous function
    return function() {
      // reference the context and args for the setTimeout function
      var context = this,
        args = arguments;

      // Should the function be called now? If immediate is true
      //   and not already in a timeout then the answer is: Yes
      var callNow = immediate && !timeout;

      // This is the basic debounce behaviour where you can call this
      //   function several times, but it will only execute once
      //   [before or after imposing a delay].
      //   Each time the returned function is called, the timer starts over.
      clearTimeout(timeout);

      // Set the new timeout
      timeout = setTimeout(function() {

        // Inside the timeout function, clear the timeout variable
        // which will let the next execution run when in 'immediate' mode
        timeout = null;

        // Check if the function already ran with the immediate flag
        if (!immediate) {
          // Call the original function with apply
          // apply lets you define the 'this' object as well as the arguments
          //    (both captured before setTimeout)
          func.apply(context, args);
        }
      }, wait);

      // Immediate mode and no wait timer? Execute the function..
      if (callNow) func.apply(context, args);
    }
  }
