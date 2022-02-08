// ******COLOURS******

let colours = ({
    background: '#871F35',
    startScreen: 'rgba(50, 50, 50, 0.75)',
    infoText: 'white',
    loadOff: 'rgb(205, 181, 122)',
    playOff: 'rgb(205, 181, 122)',
    recordOff: 'rgb(205, 181, 122)',
    on: 'rgb(0,255,255)',
    textOff: 'white',
    effectOff: 'rgb(205, 181, 122)',
    effectOn:'rgb(0, 255, 255)',
    stroke: 'rgb(205, 181, 122)',
});

// ******FONTS AND IMAGES*****

let fontRegular;
let fxFont1, fxFont2, fxFont3, fxFont4, fxFont5;
let wigmoreLogo;
let learningLogo;
let wigmoreLogoThickness; // how bold are the buttons
let buttonTextThickness1; // how bold is the text
let sizeOfLogo;
let infoFont;
let introFont;

//******BUTTONS******/

let loadButton; // in setup this becomes an object with all the ingredients for a load button
let playButton; // in setup this becomes an object with all the ingredients for a play button
let recordButton; // as above
let infoButton;
let ctrlButton;
let effectButtons = new Array; //array to store effect buttons objects in
let numberOfEffectButtons = 5; //how many effect buttons?

// ******SOUND****** - i'm using the library Tone.js

// set up the unneffected side of the installation - this drives the left visualisation
// and will not be processed so not connected to destination. However all chain elements
// still need to be present otherwise timing will be off for the visualisation
let theVolume = -4;
const uneffectedAmpEnv = new Tone.AmplitudeEnvelope({
    attack: 0.1,
    decay: 0.2,
    sustain: 1.0,
    release: 0.1
});
const uneffectedSongPlayer = new Tone.Player({
    volume: theVolume,
    loop: true,
});

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
});
const reverb = new Tone.Reverb ({
    decay: 4
});
const pingPong = new Tone.PingPongDelay({
});
const effectedSongPlayer = new Tone.Player({
    volume: theVolume,
    loop: true,
});
const effectedMeter = new Tone.Meter();
effectedMeter.normalRange = true;
// effectedSongPlayer.connect(effectedAmpEnv);
// effectedAmpEnv.connect(effectedMeter);

// uneffectedSongPlayer.set(
//     {
//       "volume": theVolume,
//       "loop": true,
//     }
// );

// effectedSongPlayer.set(
//     {
//       "volume": theVolume,
//       "loop": true,
//     }
// );

let recorderInitialised = false; // we will check to see if we can use the mic
let mic, recorder;
let recordTime; //variable to store time of recording in as other method isn't cross platform compatible

let whichSound; // which of the samples?
let theSample; //current sample
let buffer0;
let buffer1;
let recordBuffer;
let interfaceState = 0; // 0 displays the text loading, 1 is a button, 2 and 5 is info screen, 3 is ctrl screen, 4 is error loading sound to buffer
let usedSounds = new Array;
let bufferToPlay = "start";
let lastBuffer;
let currentBuffer;
let numberOfSamples = 6; // the number of samples that we are
let started = false; //have we invoked Tone.start() and left the info screen?
let initFile = false; // ensure the first file is always the same one
let fileLength; // store the length of a sample in seconds in here
let scheduledRepeatID; // variable to store the scheduleRepeat in (as the function returns this). We can then use this to cancel it later.

// ******DIMENSIONS******

let waveformRatio = 3; // number that sets the waveform size relative to the screen
let buttonRadius; // variable to store the actual buttonRadius in
let visualisationWidth; // how wide each half of the visualisation is
let visualisationHeight; // max height of the visualisation
let visualisationYPosition; // where is the visualistion on the y axis?
let visualisation = new Array(50); // to store the left hand data for visualisation
let visualisationThickness; // how thick is the visualisation
for(let i = 0; i < visualisation.length; i++){ // populate the array
    visualisation[i] = 0;
}
let visualisation2 = new Array(50); // to store the right hand data for visualisation
for(let i = 0; i < visualisation2.length; i++){ // populate the array
    visualisation2[i] = 0;
}
let rectangleX, rectangleY, rectangleWidth, rectangleHeight;
let infoCtrlSquareWidth;
let infoCtrlSquareHeight;


function preload(){
    chooseSample();
    fontRegular = loadFont('assets/Sprat-CondensedLight.otf');
    fxFont1 = loadFont('assets/Half-51.otf');
    fxFont2 = loadFont('assets/Version_0.1_50_skeletor.ttf');
    fxFont3 = loadFont('assets/terminal-grotesque_open.otf');
    fxFont4 = loadFont('assets/wavy.otf');
    fxFont5 = loadFont('assets/GapSans.ttf');
    wigmoreLogo = loadImage('assets/learningLogo.png');
    introFont = loadFont('assets/BAHNSCHRIFT.TTF');
}

function setup() {  // setup p5
    setupCanvas();
    createButtonPositions();
    setvisualisationWidth();
    chain();
    setupTouch();
    // infoCtrlSquareWidth = (textWidth(infoButton.text)*1.5);
    // infoCtrlSquareHeight = (textAscent(infoButton.text)*1.5);
    // pixelDensity(1);
}

function draw() {
    background(colours.background); // background
    if(!started){
        loadScreens();
    }else{
    buildTheLook();
    }
}

function setupTouch(){
    // *** add vanilla JS event listeners for touch which i want to use in place of the p5 ones as I believe that they are significantly faster
    let el = document.getElementById("p5parent");
    el.addEventListener("click", handleClick); // this calls the function handleClick
}

function setupCanvas(){
    let masterDiv = document.getElementById("container");
    let divPos = masterDiv.getBoundingClientRect(); //The returned value is a DOMRect object which is the smallest rectangle which contains the entire element, including its padding and border-width. The left, top, right, bottom, x, y, width, and height properties describe the position and size of the overall rectangle in pixels.
    let masterLeft = divPos.left; // distance from left of screen to left edge of bounding box
    let masterRight = divPos.right; // distance from left of screen to the right edge of bounding box
    let cnv = createCanvas(windowWidth, windowHeight); // create canvas - because i'm now using css size and !important this is really about the ratio between them, so the second number effects the shape. First number will be moved by CSS
    cnv.id('mycanvas'); // assign id to the canvas so i can style it - this is where the css dynamic sizing is applied
    cnv.parent('p5parent'); //put the canvas in a div with this id if needed - this also needs to be sized
}

let effectText = ['RIPPLE', 'DEPTH', 'HALL', 'REFLECT', 'ECHO'];
let effectFont;

function createButtonPositions() {
    effectFont = [fxFont1, fxFont2, fxFont3, fxFont4, fxFont5];
    loadButton = ({
        x: width/4,
        y: height/5,
        state: false,
        colour: colours.loadOff,
        textColour: colours.textOff,
        text: 'LOAD'
    });
    playButton = ({
        x: (width/4) * 2,
        y: (height/7) * 3,
        state: false,
        colour: colours.playOff,
        textColour: colours.textOff,
        text: 'PLAY'
    });
    recordButton = ({
        x: (width/4) * 3,
        y: height/5,
        state: false,
        colour: colours.recordOff,
        textColour: colours.textOff,
        text: 'RECORD'
    });
    infoButton = ({
        x: width/14,
        y: height/10,
        state: false,
        text: 'INFO'
    });
    ctrlButton = ({
        x: (width/14)*13,
        y: height/10,
        state: false,
        text: 'CTRL'
    });
    let bottomButtonsY = (height/5)*4;
    for(let i = 0; i < numberOfEffectButtons; i++){
        effectButtons.push({
            x: (width/(numberOfEffectButtons+1))*(i+1),
            y: bottomButtonsY,
            colour: colours.effectOff,
            textColour: colours.textOff,
            text: effectText[i],
            status: false,
            font: effectFont[1],
        });
    }
    textSize(width/40);
    textFont(fontRegular);
    infoCtrlSquareWidth = (textWidth(infoButton.text)*1.5);
    infoCtrlSquareHeight = (textAscent(infoButton.text)*1.5);
}

function buildTheLook(){
    rectMode(CORNER);
    // stroke(0);
    // stroke(255);
    noStroke();
    fill(loadButton.colour);
    textSize(width/25);
    textFont(fontRegular);
    textAlign(CENTER, CENTER);
    if(interfaceState === 0){ // loading
        fill(255);
        text("LOADING", rectangleX, rectangleY, rectangleWidth, rectangleHeight);// same dimensions as the rectangle above
    }else if(interfaceState === 2){ // info screen
        textSize(infoFont);
        fill(255);
        strokeWeight(buttonTextThickness);
        let textY1 = (rectangleY-rectangleHeight/2);
        let textY2 = ((rectangleY-rectangleHeight/2)+(rectangleHeight/5)*1.5);
        let textY3 = ((rectangleY-rectangleHeight/2)+(rectangleHeight/5)*3.5);
        let textY4 = ((rectangleY-rectangleHeight/2)+(rectangleHeight/5)*4.5);
        text("This is an interactive sound installation by Gawain Hewitt.", rectangleX, textY1, rectangleWidth, rectangleHeight);
        text("Created for the Wigmore Hall Learning Festival, Reflections, this installation invites you to create new musical sounds by manipulating original audio using a series of specially created effects.", rectangleX, textY2, rectangleWidth, rectangleHeight);
        text("Like a droplet on the surface of water changes a reflection, these effects change the sound in endlessly unexpected ways, allowing for hours of musical play!", rectangleX, textY3, rectangleWidth, rectangleHeight);
        textFont('Helvetica');
        text('NEXT', width/2, (height/10)*9);
        rectMode(CENTER);
        noFill();
        stroke(0);
        rect(width/2, (height/10)*9, sizeOfLogo/3, sizeOfLogo/9);
    }else if(interfaceState === 3){ // info screen
        textSize(infoFont);
        fill(255);
        strokeWeight(buttonTextThickness);
        let textY1 = ((rectangleY-rectangleHeight/2)+(rectangleHeight/5)*1.2);
        let textY2 = ((rectangleY-rectangleHeight/2)+(rectangleHeight/5)*2.5);
        let textY3 = ((rectangleY-rectangleHeight/2)+(rectangleHeight/5)*3);
        let textY4 = ((rectangleY-rectangleHeight/2)+(rectangleHeight/5)*3.4);
        text("Press ‘load’ then ‘play’ to begin hearing a snippet of sound from Wigmore Hall Learning’s programme, or press ‘record’ to capture your own sound file using your phone or computer’s microphone.", rectangleX, textY1, rectangleWidth, rectangleHeight);
        text("Use the effect buttons to change the sounds reflection.", rectangleX, textY2, rectangleWidth, rectangleHeight);
        textSize(infoFont/1.5);
        text("Best experienced on Google Chrome.", rectangleX, textY3, rectangleWidth, rectangleHeight);
        text("Remember to switch your side mute button to off if on an iPhone.", rectangleX, textY4, rectangleWidth, rectangleHeight);
        textFont('Helvetica');
        text('NEXT', width/2, (height/10)*9);
        rectMode(CENTER);
        noFill();
        stroke(0);
        rect(width/2, (height/10)*9, sizeOfLogo/3, sizeOfLogo/9);
    }else if(interfaceState === 4){ // network error
        fill(255);
        let textY1 = (rectangleY-rectangleHeight/4);
        let textY2 = rectangleY;
        text("Network Problems", rectangleX, textY1, rectangleWidth, rectangleHeight);
        text("Click to try again", rectangleX, textY2, rectangleWidth, rectangleHeight);
    }else if(interfaceState === 5){ // info screen
        textSize(infoFont);
        fill(255);
        strokeWeight(buttonTextThickness);
        let textY1 = (rectangleY-rectangleHeight/2);
        let textY2 = ((rectangleY-rectangleHeight/2)+(rectangleHeight/5)*1.5);
        let textY3 = ((rectangleY-rectangleHeight/2)+(rectangleHeight/5)*3.5);
        let textY4 = ((rectangleY-rectangleHeight/2)+(rectangleHeight/5)*4.5);
        text("This is an interactive sound installation by Gawain Hewitt.", rectangleX, textY1, rectangleWidth, rectangleHeight);
        text("Created for the Wigmore Hall Learning Festival, Reflections, this installation invites you to create new musical sounds by manipulating original audio using a series of specially created effects.", rectangleX, textY2, rectangleWidth, rectangleHeight);
        text("Like a droplet on the surface of water changes a reflection, these effects change the sound in endlessly unexpected ways, allowing for hours of musical play!", rectangleX, textY3, rectangleWidth, rectangleHeight);
        textFont('Helvetica');
        text('NEXT', width/2, (height/10)*9);
        rectMode(CENTER);
        noFill();
        stroke(0);
        rect(width/2, (height/10)*9, sizeOfLogo/3, sizeOfLogo/9);
    }else if(interfaceState === 1){ // the installation
        textSize(width/40);
        noFill();
        strokeWeight(wigmoreLogoThickness); // how bold are the icons
        stroke(loadButton.colour);
        drawWigmoreLogo(loadButton.x, loadButton.y, buttonRadius);
        // noStroke();
        strokeWeight(buttonTextThickness);
        textFont('Helvetica');
        rectMode(CENTER);
        stroke(255);
        //width needs to be linked to font and word size
        // console.log(`infoCtrlSquareHeight = ${infoCtrlSquareHeight}`);
        // console.log(`infoCtrlSquareWidth = ${infoCtrlSquareWidth}`);
        rect(infoButton.x, infoButton.y, infoCtrlSquareWidth, infoCtrlSquareHeight);
        rect(ctrlButton.x, ctrlButton.y, infoCtrlSquareWidth, infoCtrlSquareHeight);
        fill(255);
        text(infoButton.text, infoButton.x, infoButton.y);
        text(ctrlButton.text, ctrlButton.x, ctrlButton.y);
        textFont(fontRegular);
        fill(loadButton.textColour);
        stroke(loadButton.textColour);
        text(loadButton.text, loadButton.x, loadButton.y + buttonRadius * 0.8);
        if(Tone.UserMedia.supported){
            noFill();
            strokeWeight(wigmoreLogoThickness);
            stroke(recordButton.colour);
            drawWigmoreLogo(recordButton.x, recordButton.y, buttonRadius);
            fill(recordButton.textColour);
            strokeWeight(buttonTextThickness);
            stroke(recordButton.textColour);
            // noStroke();
            text(recordButton.text, recordButton.x, recordButton.y + buttonRadius * 0.8);
        }
        if(effectedSongPlayer.loaded === true){
            noFill();
            strokeWeight(wigmoreLogoThickness);
            stroke(playButton.colour);
            drawWigmoreLogo(playButton.x, playButton.y, buttonRadius*2);
            fill(playButton.textColour);
            strokeWeight(buttonTextThickness);
            stroke(playButton.textColour);
            // noStroke();
            text(playButton.text, playButton.x, playButton.y + buttonRadius *1.4);
        }else{
            interfaceState = 4;
        }
        for(let i = 0; i < numberOfEffectButtons; i++){
            stroke(effectButtons[i].colour);
            strokeWeight(buttonTextThickness);
            textFont(effectFont[i]);
            fill(effectButtons[i].textColour);
            // noStroke();
            stroke(effectButtons[i].textColour);
            text(effectButtons[i].text, effectButtons[i].x, effectButtons[i].y + buttonRadius *0.9);
            noFill();
            stroke(effectButtons[i].colour);
            strokeWeight(wigmoreLogoThickness);
            drawWigmoreLogo(effectButtons[i].x, effectButtons[i].y, buttonRadius);
        }
        audioVisualisation();

    }
}

function loadScreens(){
    textAlign(CENTER, CENTER);
    rectMode(CENTER);
    noFill();
    stroke(0);
    rect(width/2, (height/10)*9, sizeOfLogo/3, sizeOfLogo/9);
    textFont(introFont);
    strokeWeight(buttonTextThickness);
    noStroke();
    fill(255);
    textSize(width/8);
    text('REFLECTIONS', width/2, height/5);
    imageMode(CENTER);
    image(wigmoreLogo, width/2, (height/5)*3, sizeOfLogo, (sizeOfLogo/325)*136);
    textSize(sizeOfLogo/20);
    textFont('Helvetica');
    text('START', width/2, (height/10)*9);

}

function audioVisualisation(){
    stroke(playButton.colour);
    strokeWeight(visualisationThickness);
    let x = ((width/50)*25.16 - visualisationWidth)-buttonRadius;
    let y = visualisationYPosition;
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
    // level = uneffectedMeter.getValue();

    if(effectsOn === 0){
        level = effectedMeter.getValue();
    }else{
        level = uneffectedMeter.getValue();
    }
    visualisation.push(level);
    visualisation.splice(0, 1);
    for(let i = 0; i < visualisation.length-1; i++){

        startY = y + (visualisation[i]*visualisationHeight);
        endX = startX + visualisationWidth/visualisation.length;
        endY = y + (visualisation[i+1]*visualisationHeight);

        line(startX, startY, endX, endY);

        startX = startX + visualisationWidth/visualisation.length;
    }

    let x2 = width/2 + buttonRadius;
    let y2 = y;
    let startX2 = x2;
    let startY2 = y2;
    let endX2;
    let endY2;
    let level2 = effectedMeter.getValue();
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
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    loadButton.x = width/4;
    loadButton.y = height/5;
    playButton.x = (width/4) * 2;
    playButton.y = (height/7) * 2.5;
    recordButton.x = (width/4) * 3;
    recordButton.y = height/5;
    infoButton.x = width/14;
    infoButton.y = height/10;
    ctrlButton.x = (width/14)*13;
    ctrlButton.y = height/10;
    infoCtrlSquareWidth = (textWidth(infoButton.text)*1.5);
    infoCtrlSquareHeight = (textAscent(infoButton.text)*1.5);
    setvisualisationWidth();

    let bottomButtonsY = (height/5)*4;
    for(let i = 0; i < numberOfEffectButtons; i++){
        effectButtons[i].x = (width/(numberOfEffectButtons+1))*(i+1);
        effectButtons[i].y = bottomButtonsY;
    }
}

function setvisualisationWidth() {
    visualisationWidth = (width/waveformRatio);
    visualisationYPosition = playButton.y;
    visualisationThickness = width/400;
    wigmoreLogoThickness = width/200;
    buttonTextThickness = width/800;
    visualisationHeight = height;
    rectangleX = width/6;
    rectangleY = height/6;
    rectangleWidth = width/1.5;
    rectangleHeight = height/1.5;
    if(height > width){
        buttonRadius = visualisationWidth/3.5;
        sizeOfLogo = (width/4)*3;
        infoFont = height/50;
    }else{
        buttonRadius = visualisationWidth/5;
        sizeOfLogo = (height/4)*3;
        infoFont = width/50;
    }
}

function handleClick() {
    if(!started){
        Tone.start();
        started = true;
        interfaceState = 2;
    }else if(interfaceState === 2){
        interfaceState = 3;
    }else if(interfaceState === 3){
        interfaceState = 1;
    }else if(interfaceState === 4){
        console.log("network problems click");
        interfaceState = 0;
        assignSoundToPlayer();
    }else if(interfaceState === 5){
        interfaceState = 1;
    }else{
        let d = dist(mouseX, mouseY, loadButton.x, loadButton.y);
        if (d < buttonRadius/2) {
            debounce(loadButtonPressed(), 200);
            loadButton.state = true;
        }
        if(Tone.UserMedia.supported){
            let d4 = dist(mouseX, mouseY, recordButton.x, recordButton.y);
            if (d4 < buttonRadius/2) {
                debounce(recordButtonPressed(), 200);
            }
        }
        if(uneffectedSongPlayer.loaded === true){
            let d2 = dist(mouseX, mouseY, playButton.x, playButton.y);
            if (d2 < buttonRadius) {
                debounce(playSong(), 200);
            }
        }
        for(let i = 0; i < numberOfEffectButtons; i++){
            let d3 = dist(mouseX, mouseY, effectButtons[i].x, effectButtons[i].y);
            if (d3 < buttonRadius/2) {
                debounce(effectButtonPressed(i), 200);
            }
        }
        if (isMouseInsideText(infoButton.text, infoButton.x, infoButton.y)) {
            interfaceState = 5;
        }
        if (isMouseInsideText(ctrlButton.text, ctrlButton.x, ctrlButton.y)) {
            interfaceState = 3;
        }
    }
}

function loadButtonPressed() {
    uneffectedSongPlayer.stop();
    effectedSongPlayer.stop();
    Tone.Transport.stop();
    playButton.colour = colours.playOff;
    // playButton.textColour = colours.textOff;
    playButton.text = 'PLAY';
    reload();
    lastBuffer = currentBuffer;
    console.log(`lastBuffer = ${lastBuffer}`);
    loadButton.colour = colours.on;
    // loadButton.textColour = colours.on;
    chooseSample();
}

function recordButtonPressed(){
    console.log('in record');
    uneffectedSongPlayer.stop();
    effectedSongPlayer.stop();
    Tone.Transport.stop();
    playButton.colour = colours.playOff;
    playButton.text = 'PLAY';
    if(recordButton.state ===false){
        recordButton.colour = colours.on;
        recordButton.state = true;
        recordButton.text = 'STOP';
        if (!recorderInitialised) {
            mic = new Tone.UserMedia();
            recorder = new Tone.Recorder();
            mic.connect(recorder);
            mic.open();
            initialized = true;
            }
        recorder.start();
        recordTime = Date.now();
    }else{
        let recordingDuration = Date.now() - recordTime;
        recordingDuration = (recordingDuration /1000);
        recordStop(recordingDuration);
    }
}

async function recordStop(duration) {
    recordButton.text = 'RECORD';
    recordButton.colour = colours.recordOff;
    recordButton.state = false;
    let data = await recorder.stop();
    let blobUrl = URL.createObjectURL(data);
    recordBuffer = new Tone.ToneAudioBuffer(blobUrl);
    uneffectedSongPlayer.buffer = recordBuffer;
    effectedSongPlayer.buffer = recordBuffer;
    // for some reason I can't read the length in samples or time of the file in the buffer on chrome, although it does work on firefox, so I'll have to use another method to get file length
    fileLength = duration;
    console.log(`fileLength = ${fileLength}`);
    //playSong();
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
        playButton.text = 'STOP';
    }else{
        uneffectedSongPlayer.stop();
        effectedSongPlayer.stop();
        Tone.Transport.stop();
        playButton.colour = colours.playOff;
        playButton.text = 'PLAY';
    }

    if(effectButtons[0].status === true){
        Tone.Transport.clear(scheduledRepeatID); // clear the repeat above
        effectButtons[0].status = false;
        effect1(0);
    }

    if(recordButton.state === true){
        let recordingDuration = Date.now() - recordTime;
        recordingDuration = (recordingDuration /1000);
        recordStop(recordingDuration);
    }
}

function effectButtonPressed(button){
    console.log(`effect button ${button+1} pressed`);
    // effect1();
    window[`effect${button+1}`](button);// this allows you to create a function name from a string and then call it
}

function effect1(button) {
    if(effectButtons[button].status === false){
        let sampleDivision
        if(fileLength > 10){
            sampleDivision = fileLength/(getRndInteger(4, 64));
        }else if(fileLength > 3){
            sampleDivision = fileLength/(getRndInteger(4, 16));
        }
        else{
            sampleDivision = fileLength/(getRndInteger(1, 8));
        }
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
        chain();
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
        reverb.decay = getRndInteger(6, 20);
        // effectedAmpEnv.connect(reverb);
        //effectedAmpEnv.disconnect(effectedMeter);
        // reverb.connect(effectedMeter);
        effectButtons[button].colour = colours.effectOn;
        effectButtons[button].status = true;
        chain();
    }else{
        //reverb.disconnect(effectedMeter);
        // effectedAmpEnv.connect(effectedMeter);
        effectButtons[button].colour = colours.effectOff;
        effectButtons[button].status = false;
        chain();
        if(effectButtons[4].status === false){
            effectedAmpEnv.disconnect(reverb);
        }else{
            pingPong.disconnect(reverb);
        }
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
        pingPong.delayTime = (Math.random()+0.01)*5;
        //pingPong.delayTime = fileLength/(getRndInteger(4, 64));
        //effectedAmpEnv.connect(pingPong);
        effectButtons[button].colour = colours.effectOn;
        effectButtons[button].status = true;
        chain();
    }else{
        effectedAmpEnv.disconnect(pingPong);
        effectButtons[button].colour = colours.effectOff;
        effectButtons[button].status = false;
        chain();
    }
}

function chain(){
    if(effectButtons[2].status === true && effectButtons[4].status === true){
        console.log("chain1");
        effectedSongPlayer.chain(effectedAmpEnv, pingPong, reverb, effectedMeter, Tone.Destination);
    }else if(effectButtons[2].status === true){
        console.log("chain2");
        //effectedSongPlayer.disconnect();
        effectedSongPlayer.chain(effectedAmpEnv, reverb, effectedMeter, Tone.Destination);
    }else if(effectButtons[4].status === true){
        console.log("chain3");
        //effectedSongPlayer.disconnect();
        effectedSongPlayer.chain(effectedAmpEnv, pingPong, effectedMeter, Tone.Destination);
    }else{
        console.log("chain4");
        //effectedSongPlayer.disconnect();
        effectedSongPlayer.chain(effectedAmpEnv, effectedMeter, Tone.Destination);
    }
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min +1) ) + min;
  }

function chooseSample(){
    if(initFile){
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
    }else{
        whichSound = 6;
        usedSounds.push(whichSound);
        console.log(`whichSound = ${whichSound}`);
        theSample = `audioFile${whichSound}.mp3`;
        console.log(`theSample = ${theSample}`);
        console.log(`usedSounds = ${usedSounds}`);
        assignSoundToPlayer();
        initFile = true;
    }
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
        buffer0 = new Tone.ToneAudioBuffer(`/assets/${theSample}`, () => {
            console.log("buffer 0 loaded");
            bufferToPlay = buffer0;
            currentBuffer = 0;
            loadButton.colour = colours.loadOff;
            console.log(`currentBuffer = ${currentBuffer}`);
            // if (interfaceState === 0){
            //     reload();
            // }
            reload();
            lastBuffer = currentBuffer;
            console.log(`lastBuffer = ${lastBuffer}`);
            chooseSample();
        },
        () => {
            // interfaceState = 4;
            interfaceState = 0;
            assignSoundToPlayer();
            console.log(` if(bufferToPlay === "start") interfaceState = ${interfaceState}`)
        });
            // chooseSample();
    }else if(bufferToPlay === buffer1){
        buffer0 = new Tone.ToneAudioBuffer(`/assets/${theSample}`, () => {
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
            interfaceState = 4;
            console.log(`else if(bufferToPlay === buffer1)interfaceState = ${interfaceState}`)
        });
    }else{
        buffer1 = new Tone.ToneAudioBuffer(`/assets/${theSample}`, () => {
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
            interfaceState = 4;
            console.log(`else interfaceState = ${interfaceState}`)
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
        // interfaceState = 0;
        interfaceState = 4;
    }
    console.log('when we getting here?');
    // buffer0.dispose();
    // chooseSample();
}

function getFileLength(buffer) {
    console.log(`buffer duration = ${buffer.duration}`);
    fileLength = buffer.duration;
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

  function drawWigmoreLogo(x, y, size){
    // so it can be moved and scaled the point is related to x at the original scale - in this case its 5 less, then divided by 100 (which is the size of the circle in this picture at original scale) and multiplied by the new size amount.

    let x1 = x-(5/100)*size;
    let y1 = y-(78/100)*size;
    let x2 = x+(42/100)*size;
    let y2 = y-(36/100)*size;
    let x3 = x-(25/100)*size;
    let y3 = y-(18/100)*size;
    let x4 = x+(2/100)*size;
    let y4 = y+(9/100)*size;
    let x5 = x-(71/100)*size;
    let y5 = y-(4/100)*size;
    let x6 = x+(1/100)*size;
    let y6 = y-(51/100)*size;
    let x7 = x-(5/100)*size;
    let y7 = y-(78/100)*size;
    let x8 = x-(27/100)*size;
    let y8 = y-(25/100)*size;
    let x9 = x+(54/100)*size;
    let y9 = y-(27/100)*size;
    let x10 = x+(44/100)*size;
    let y10 = y+(12/100)*size;
    let x11 = x-(3/100)*size;
    let y11 = y-(24/100)*size;
    let x12 = x+(77/100)*size;
    let y12 = y+(41/100)*size;
    let x13 = x-(19/100)*size;
    let y13 = y+(33/100)*size;
    let x14 = x+(41/100)*size;
    let y14 = y+(27/100)*size;
    let x15 = x-(48/100)*size;
    let y15 = y+(46/100)*size;
    let x16 = x-(31/100)*size;
    let y16 = y-(10/100)*size;
    let x17 = x+(51/100)*size;
    let y17 = y-(4/100)*size;
    let x18 = x+(39/100)*size;
    let y18 = y-(38/100)*size;
    let x19 = x+(12/100)*size;
    let y19 = y-(42/100)*size;

    //circle(x1, y1, 10);

    beginShape();
    vertex(x1,y1);
    bezierVertex(x2, y2, x3, y3, x4, y4);
    bezierVertex(x5, y5, x6, y6, x7, y7);
    endShape(CLOSE);

    beginShape();
    vertex(x4, y4);
    bezierVertex(x8, y8, x9, y9, x10, y10);
    endShape();

    beginShape();
    vertex(x4, y4);
    bezierVertex(x11, y11, x12, y12, x13, y13);
    endShape();

    beginShape();
    vertex(x4, y4);
    bezierVertex(x14, y14, x15, y15, x16, y16);
    endShape();

    beginShape();
    vertex(x10, y10);
    bezierVertex(x17, y17, x18, y18, x19, y19);
    endShape();

    arc(x, y, size, size, 4.97, 4.37);

    // for self drawing circle uncomment below and add global variable ang

    // arc(x, y, size, size, 4.97, ang);
    // if(ang < 4.37-0.1){
    //   ang = ang + 0.1;
    // }else{
    //   ang = 4.37;
    // }
  }

  function isMouseInsideText(message, messageX, messageY) {
    textSize(width/40);
    textFont(fontRegular);
    const messageWidth = textWidth(message);
    const messageTop = messageY - (textAscent()/2);
    const messageBottom = messageY + (textDescent()*2);

    return mouseX > messageX-messageWidth/2 && mouseX < messageX + messageWidth/2 &&
      mouseY > messageTop && mouseY < messageBottom;
  }
