//
// 「缶たたき機 mini for MFT2018」
// 
// (CCby) 2018 D.F.Mac. @TripArts Music
// 
// [ClientApp]->(WebSocket:"can")->[Server]->[App:num=1]->(NoteOn:random)->[Can]
// [mi:muz:touch]->(NoteOn:0x90:1-6:100)->[App:num=2]->(NoteOn:random)->[Can]

var CHICKEN_COUNT = 80;

///////////////////////////////////////////////////////////////////////
// MIDI

var touch_notes_min = 20;                    // mi:muz:touchから来るNote Number
var touch_notes_max = 25;                    // mi:muz:touchから来るNote Number
var out_notes = [0,1,2,3,4,5,6,7];           // 缶へ出力するNote Number (mi:muz:can-i2c)

var cannames = [
'./img/can-n5.png',
'./img/can-n4.png',
'./img/can-n9.png',
'./img/can-n6.png',
'./img/can-n8.png',
'./img/can-n10.png',
'./img/can-n3.png',
'./img/can-n1.png'
];

// mi:muz:can #1
// 36 : can-n1.png
// 38 : can-n3.png
// 40 : can-n4.png
// 43 : can-n5.png
// 45 : can-n8.png
// 48 : can-n10.png

var midi = new poormidi();

var mes = {};
var u8arr = new Uint8Array(4);
var isPatLampPlay = [0,0];
var speedData = [20,30,40,60];
var speedCnt = [0,0];

midi.onMidiEvent = function(e){
  var message = e.data[0];
  if(message == 0x90){  // mi:muz:touch or PatLamp
    var note = e.data[1];
    switch (note){
    case 20:
    case 21:
    case 22:
    case 23:
    case 24:
    case 25:
      var canNum = e.data[1]-20;
      playCan(canNum);
      startFace(1);
      addCan(canNum,1);
      break;
    case 100:
      startChicken();
      break;       
    case 127:
      startCheen();
      break;    
    }
  }
}

function checkTouchNote(num){
  if((num >= touch_notes_min)&&(num <= touch_notes_max)){
    return(Math.floor(Math.random() * 6));
  }else{
    return -1;
  }
}

function playCan(num){
  console.log("num:"+num);
  midi.sendNoteOn(1,out_notes[num],100);
}

/////////
// Test (key)
// リターンキーに反応させる
$(document.body).keydown(function(ev){
  console.log("keydown: "+ev.keyCode);
  if(ev.keyCode == 13){  // リターンキー
    //test
    startFace(0);
    startFace(1);
    startFace(2);
    startFace(3);
  }
  index = -1;
  if((ev.keyCode >= 49) && (ev.keyCode <= 56)){  // 1-8
//  if((ev.keyCode >= 48) && (ev.keyCode <= 57)){  // 0-9
    var index = ev.keyCode - 49; // 1->0 2->1 ..
  }
/*
  if(ev.keyCode == 81){ // q
    var index = 10; 
  }
  if(ev.keyCode == 87){ // w
    var index = 11; 
  }
  if(ev.keyCode == 69){ // e
    var index = 12; 
  }
  if(ev.keyCode == 82){ // r
    var index = 13; 
  }
  if(ev.keyCode == 84){ // t
    var index = 14; 
  }
  if(ev.keyCode == 89){ // t
    var index = 15; 
  }
*/
/*
  if(ev.keyCode == 65){
    if(isPatLampPlay[0]){
      stopPatLamp(0);
      isPatLampPlay[0] = 0;
    }else{
      isPatLampPlay[0] = 1;
      playPatLamp(0);
    }
  }
  if(ev.keyCode == 83){
    if(isPatLampPlay[1]){
      stopPatLamp(1);
      isPatLampPlay[1] = 0;
    }else{
      isPatLampPlay[1] = 1;
      playPatLamp(1);
    }
  }
*/
  if(index != -1){
    startFace(1);
    playCan(index);
    addCan(index,1);
  }
});
/*
 0: 48
 1: 49
 2: 50
 3: 51
 4: 52
 5: 53
 6: 54
 7: 55
 8: 56
 9: 57
 q: 81
 w: 87
 e: 69
 r: 82
 t: 84
 y: 89
*/

///////////////////////////////////////////////////////////////////////
// ws
var host = "ws://mz4u.net:3003";
var ws = new poorws(host);
var status = 0;

ws.onStatusChange = function(sts){
  status = sts;
  if(sts == 0){
    $("#status").text("Connecting...");
  }else if(sts == 1){
    $("#status").text("Connected!");
    ws.ws.binaryType = 'arraybuffer';
  }else if(sts == 2){
    $("#status").text("Disconnecting...");
  }else if(sts == 3){
    $("#status").text("Re-Connecting...");
  }
};

ws.onOpen = function(e){
  ws.send("master");
};

ws.onMessage = function(mes){
  if(mes.data == "master ack"){
//    console.log("master ack received");
  }else{
    if(mes.data == "can"){
      var chk = Math.floor(Math.random() * out_notes.length);
      playCan(chk);
      startFace(2);
      addCan(chk,2);
    }      
  }
};

function getRandomInt(min, max) {
  return Math.floor( Math.random() * (max - min + 1) ) + min;
}

///////////////////////////////////////////////////////////////////////
// Pixi.js
// 
// Front Layer : title.spr      (Title) 
//       Layer : cansContainer  (缶) 
//       Layer : faceContainer  (顔) 
//       Layer : duckContainer  (あひる) 
// back  Layer : linesContainer (background Lines)
// 
// Animation
var stage = new PIXI.Container();
var width = window.innerWidth;
var height = window.innerHeight;
var renderer = PIXI.autoDetectRenderer(width, height, {autoResize: true});
renderer.backgroundColor = 0xc92a7a;
renderer.antialias = true;
document.getElementById("pixiview").appendChild(renderer.view);

///////////////////////////////////////////////////////////////////////
// Background Lines 

var linesContainer = new PIXI.Container();
var colorMatrix =  [0.5,1,0,0,0,0.5,0,1,0,0,0.8,0.4,0,0,0,0.3]; // default
stage.addChild(linesContainer);

var colors = [
  0xFF0080,
  0xFFBA00,
  0x1CDB1C,
  0xFF3A00,
  0x4768E6,
  0x00B3FF,
  0xAE0BBF
];

var line = {};
line.grp = new PIXI.Graphics();
linesContainer.addChild(line.grp);

function initLine(){
  // direction: 1. left->right 2. right->left 3. top->bottom 4. bottom->top
  line.colornum = Math.floor(Math.random() * colors.length);
  line.width = Math.floor(30 + (Math.random() * 170));
  line.opacity = (Math.random() + 3) / 4;
  line.grp.lineStyle(line.width,colors[line.colornum],line.opacity);
  line.direction = Math.floor(Math.random() * 4);

//  console.log("initLine(colornum:"+line.colornum+", linewidth:"+ line.width +", direction:"+line.direction+")");

  if(line.direction == 1){
   line.x = -50;
   line.y = Math.random() * height;
  }else if(line.direction == 2){
   line.x = width + 50;
   line.y = Math.random() * height;
  }else if(line.direction == 3){
   line.x = Math.random() * width;
   line.y = -50;
  }else{
   line.x = Math.random() * width;
   line.y = height + 50;
  }
  line.grp.moveTo(line.x,line.y);
}

function updateLine(){
  var isRenew = 0;
  line.grp.moveTo(line.x,line.y);
  if(line.direction == 1){
    line.x += Math.random() * 100;
    line.y += (Math.random() - 0.5) * 200;
    if(line.x > width){
      isRenew = 1;
    }
  }else if(line.direction == 2){
    line.x -= Math.random() * 100;
    line.y += (Math.random() - 0.5) * 200;
    if(line.x < 0){
      isRenew = 1;
    }
  }else if(line.direction == 3){
    line.x += (Math.random() - 0.5) * 200;
    line.y += Math.random() * 100;
    if(line.y > width){
      isRenew = 1;
    }
  }else{
    line.x += (Math.random() - 0.5) * 200;
    line.y -= Math.random() * 100;
    if(line.y < 0){
      isRenew = 1;
    }
  }
  line.grp.lineTo(line.x, line.y);
  if(isRenew == 1){
    initLine();
    isRenew = 0;
  }
}

initLine();


///////////////////////////////////////////////////////////////////////
// あひる

var duckContainer = new PIXI.Container();
stage.addChild(duckContainer);

var ducknames = [
  ['./img/duck1-front-small.png','./img/duck1-left-small.png','./img/duck1-right-small.png'],
  ['./img/duck2-front-small.png','./img/duck2-left-small.png','./img/duck1-right-small.png'],
  ['./img/duck3-front-small.png','./img/duck3-left-small.png','./img/duck1-right-small.png'],
  ['./img/duck4-front-small.png','./img/duck4-left-small.png','./img/duck1-right-small.png'],
  ['./img/duck5-front-small.png','./img/duck5-left-small.png','./img/duck1-right-small.png']
];

function addDuck(){
  // direction: 1. left->right 2. right->left 3. top->bottom 4. bottom->top

  if(duckContainer.children.length > 4){
    return;
  }

  var direction = Math.floor(Math.random() * 4);
  var num = Math.floor(Math.random() * ducknames.length);
  var texrec = 0;
  if(direction == 2){
    texrec = 1;
  }else if(direction == 1){
    texrec = 2;
  }
  var ftex = PIXI.Texture.fromImage(ducknames[num][texrec]);
  var spr = new PIXI.Sprite(ftex);
  spr.anchor.x = 0.5;
  spr.anchor.y = 0.5;
  spr.direction = direction;

  if(direction == 1){
   spr.position.x = -50;
   spr.position.y = Math.random() * height;
  }else if(direction == 2){
   spr.position.x = width + 50;
   spr.position.y = Math.random() * height;
  }else if(direction == 3){
   spr.position.x = Math.random() * width;
   spr.position.y = -50;
  }else{
   spr.position.x = Math.random() * width;
   spr.position.y = height + 50;
  }
  spr.speed = (Math.random()*20) + 5;
  duckContainer.addChild(spr);
}

function updateDucks(){
  for(var cnt=0;cnt < duckContainer.children.length; cnt ++){
    var child = duckContainer.children[cnt];
    var isDelete = 0;
    child.rotation += 0.1;

    switch(child.direction){
    case 1: // left->right
      child.position.x += child.speed;
      child.position.y += (Math.random() - 0.5) * 5;
      if(child.position.x > (width+50)){
        isDelete = 1;
      }
      break;
    case 2: // right->left
      child.position.x -= child.speed;
      child.position.y += (Math.random() - 0.5) * 5;
      if(child.position.x < -50){
        isDelete = 1;
      }
      break;
    case 3: // top->bottom
      child.position.x += (Math.random() - 0.5) * 5;
      child.position.y += child.speed;
      if(child.position.y > (height+50)){
        isDelete = 1;
      }
      break;
    default: // bottom->top
      child.position.x += (Math.random() - 0.5) * 5;
      child.position.y -= child.speed;
      if(child.position.y < -50){
        isDelete = 1;
      }
      break;
    }
    if(isDelete == 1){
      duckContainer.removeChild(child);
    }
//    console.log("duck length:"+duckContainer.children.length)
  }
}

///////////////////////////////////////////////////////////////////////
// 顔
// direction: 1. left->right 2. right->left 3. top->bottom 4. bottom->top

var faceContainer = new PIXI.Container();
stage.addChild(faceContainer);

var faces = [
{
  "url":'./img/china4face.png',
  "x":(width/4),
  "y":80,
  "rotation":0,
  "eyes":[
    {"x":-61,"y":8,"radius":0,"angle":0},
    {"x":57,"y":8,"radius":0,"angle":0}
  ],
  "lookaway":{"x":0,"y":height+80}
},
{
  "url":'./img/china2face.png',
  "x":(width-80),
  "y":(height-130),
  "rotation":0.5,
  "eyes":[
    {"x":-114,"y":31,"radius":0,"angle":0},
    {"x":-65,"y":31,"radius":0,"angle":0}
  ],
  "lookaway":{"x":-80,"y":0}

},
{
  "url":'./img/china1face.png',
  "x":80,
  "y":(height-130),
  "rotation":-0.3,
  "eyes":[
    {"x":50,"y":15,"radius":0,"angle":0},
    {"x":127,"y":26,"radius":0,"angle":0}
  ],
  "lookaway":{"x":width+80,"y":0}
},
{
  "url":'./img/face-5.png',
  "x":((width/4)*3),
  "y":80,
  "rotation":0,
  "eyes":[
    {"x":-72,"y":-4,"radius":0,"angle":0},
    {"x":57,"y":-16,"radius":0,"angle":0}
  ],
  "lookaway":{"x":0,"y":height+80}
}

];

function initFaces(){
  for(var cnt = 0;cnt < faces.length; cnt ++){
    var ftex = PIXI.Texture.fromImage(faces[cnt].url);
    var spr = new PIXI.Sprite(ftex);
    spr.anchor.x = 0.5;
    spr.anchor.y = 0.5;
    spr.scale.x = 0.7;
    spr.scale.y = 0.7;

    spr.position.x = faces[cnt].x;
    spr.position.y = faces[cnt].y;
    spr.rotation = faces[cnt].rotation;
    spr.visibleTime = 0;
    spr.faceAnimCnt = 0;

//    spr.visible = false;
    faceContainer.addChild(spr);
  }

  initLaser();

  //test
  startFace(0);
  startFace(1);
  startFace(2);
  startFace(3);

}

function updateFacePoints(){
  faceContainer.children[0].position.x = faces[0].x = width/4;
  faces[0].lookaway.y = height+80;
  faceContainer.children[1].position.x = faces[1].x = width-80;
  faceContainer.children[1].position.y = faces[1].y = height-80;
  faceContainer.children[2].position.y = faces[2].y = height-80;
  faces[2].lookaway.x = width+80;
  faceContainer.children[3].position.x = faces[3].x = (width/4)*3;
  faces[3].lookaway.y = height+80;
}


function getRadius(xa,ya,xb,yb){
  var distanceX = (xb - xa)*(xb - xa);
  var distanceY = (yb - ya)*(yb - ya);
  var radius = Math.sqrt(distanceX + distanceY);
//  console.log("radius:"+radius);
  return(radius);
}

function getAngle(xa,ya,xb,yb){
  var angle = Math.atan2(xb-xa,yb-ya);

//  console.log("angle:"+angle);
  return(angle);
}

function getMovePoint(basex,basey,radius,scale,angle){
  var point = {};
  point.x = basex + ((radius * scale) * Math.sin(angle));
  point.y = basey + ((radius * scale) * Math.cos(angle));
  return point;
}

////////
// Laser

var laserContainer = new PIXI.Container();
stage.addChild(laserContainer);

function initLaser(){
  for(var cnt = 0;cnt < faces.length;cnt ++){
    faces[cnt].eyes[0].radius = getRadius(0,0,faces[cnt].eyes[0].x,faces[cnt].eyes[0].y);
    faces[cnt].eyes[1].radius = getRadius(0,0,faces[cnt].eyes[1].x,faces[cnt].eyes[1].y);
    faces[cnt].eyes[0].angle = getAngle(0,0,faces[cnt].eyes[0].x,faces[cnt].eyes[0].y);
    faces[cnt].eyes[1].angle = getAngle(0,0,faces[cnt].eyes[1].x,faces[cnt].eyes[1].y);
    var gr2 = new PIXI.Graphics();
    laserContainer.addChild(gr2);
  }
}

function drawLaser(num){

  var child = faceContainer.children[num];
  var gr2 = laserContainer.children[num];
  var color = colors[Math.floor(Math.random() * colors.length)];

  for(var cnt= 0;cnt < 2; cnt ++){

    gr2.beginFill(color,0.4);

    var eye_point = getMovePoint(
      faces[num].x,
      faces[num].y,
      faces[num].eyes[cnt].radius,
      child.scale.x,
      faces[num].eyes[cnt].angle - child.rotation //faces[0].eyes[0].angle
    );

    var lookaway = {};
    var lookaway2 = {};
    if(faces[num].lookaway.x == 0){
      lookaway.x = Math.random() * width;
      lookaway2.x = Math.random() * width;
      lookaway.y = faces[num].lookaway.y;
      lookaway2.y = faces[num].lookaway.y;
    }else{
      lookaway.y = Math.random() * height;
      lookaway2.y = Math.random() * height;
      lookaway.x = faces[num].lookaway.x;
      lookaway2.x = faces[num].lookaway.x;
    }
    var param = [lookaway.x,lookaway.y,lookaway2.x,lookaway2.y,eye_point.x,eye_point.y];
    gr2.drawPolygon(param);
    gr2.endFill();
  }
}

function clearLaser(num){
  var gr2 = laserContainer.children[num];
  gr2.clear();
}

function startFace(num){
  if(num < faceContainer.children.length){
    var child = faceContainer.children[num];
    child.visibleTime = 16;
    child.alpha = 1;
    child.visible = true;
    clearLaser(num);
    drawLaser(num);
  }
}

function updateFaces(){
  for(var cnt = 0;cnt < faceContainer.children.length; cnt ++){
    var child = faceContainer.children[cnt];
    if(child.visibleTime > 0){
      child.faceAnimCnt ++;
      child.faceAnimCnt %= 60;
      if(child.scale.x < 4){
        child.scale.x += 0.08;
        child.scale.y += 0.08;
      }
      if(child.faceAnimCnt % 2){
        child.rotation += 0.2;
      }else{
        child.rotation -= 0.2;
      }
      if(child.visibleTime > 14){
        clearLaser(cnt);
        drawLaser(cnt);
      }
      if(child.visibleTime == 14){
        clearLaser(cnt);
      }
      if(child.visibleTime < 8){
        child.alpha -= 0.2;
      }
      child.visibleTime --;
      if(child.visibleTime == 0){
        child.visible = false;
        child.scale.x = 0.7;
        child.scale.y = 0.7;
        child.alpha = 1;  
      }else{
      }
    }
  }  
}

initFaces();


///////////////////////////////////////////////////////////////////////
// 缶

var cansContainer = new PIXI.Container();
stage.addChild(cansContainer);

function addCan(cnt,face){
//  var margin = width / 11;
  var ftex = PIXI.Texture.fromImage(cannames[cnt%cannames.length]);
  var spr = new PIXI.Sprite(ftex);
  spr.anchor.x = 0.5;
  spr.anchor.y = 0.5;
  spr.scale.x = 0.3;
  spr.scale.y = 0.3;

  var child = faceContainer.children[face];
  switch (face){

  case 2 :
    spr.position.x = child.position.x + (100*child.scale.x);
    spr.position.y = child.position.y - (60 + (20*child.scale.x));
    spr.direc = {};
    spr.direc.x = (Math.random() - 0.5) * 50;
    spr.direc.y = -20;
    break;
  case 1 :
    spr.position.x = child.position.x - (100*child.scale.x);
    spr.position.y = child.position.y - (60 + (20*child.scale.x));
    spr.direc = {};
    spr.direc.x = (Math.random() - 0.5) * 50;
    spr.direc.y = -20;
    break;
  case 0 :
  case 3 :
    spr.position.x = child.position.x; //  - (100*child.scale.x);
    spr.position.y = child.position.y + (80 + (70*child.scale.x));
    spr.direc = {};
    spr.direc.x = (Math.random() - 0.5) * 50;
    spr.direc.y = 20;
    break;
  case 4 :
    spr.position.x = width / 2; //  - (100*child.scale.x);
    spr.position.y = height / 2;
    spr.direc = {};
    spr.direc.x = (Math.random() - 0.5) * 300;
    spr.direc.y = (Math.random() - 0.5) * 300;
    if(spr.direc.y > 0){
      spr.direc.y += 20;
    }else{
      spr.direc.y -= 20;
    }
    break;
  }
  spr.face = face;
  spr.num = cnt;
  cansContainer.addChild(spr);
}

function updateCans(){
  for(var cnt=0;cnt < cansContainer.children.length; cnt ++){
    var child = cansContainer.children[cnt];
    child.position.y += child.direc.y;
    child.position.x += child.direc.x;
    child.scale.y += 0.05;
    child.scale.x += 0.05;
    child.rotation += 0.1;

    if(child.position.y < -50){
      cansContainer.removeChild(child);
    }
  }
}

///////////
// Chicken
///////////

var chickenContainer = new PIXI.Container();
stage.addChild(chickenContainer);

function initChicken(){
  var ftex = PIXI.Texture.fromImage("./img/chicken.png");
  var spr = new PIXI.Sprite(ftex);
  spr.anchor.x = 0.5;
  spr.anchor.y = 0.1;
  spr.scale.x = 5;
  spr.scale.y = 5;

  spr.position.x = width/2;
  spr.position.y = height/2;
  spr.visible = false;
  spr.count = 0;
  chickenContainer.addChild(spr);
}

function startChicken(){
  var spr = chickenContainer.children[0];
  spr.visible = true;
  spr.count = CHICKEN_COUNT;
}

function updateChicken(){
  var spr = chickenContainer.children[0];
  if(spr.count > 0){
  	if((spr.count % 2) == 0){
  	  addChickenCan();
    }
    spr.scale.x -= 0.1  	
    spr.scale.y -= 0.3 	
    spr.rotation += 0.2;
    spr.count --;
    if(spr.count == 0){
      spr.visible = false;
      spr.scale.x = 5;
      spr.scale.y = 5;
//      spr.rotation = 0;
    }
  }
}

function updateChickenPoint(){
  var spr = chickenContainer.children[0];
  spr.position.x = width/2;
  spr.position.y = height/2;

  var spr2 = cheenContainer.children[0];
  spr2.position.x = width/2;
  spr2.position.y = height/2;
}

function addChickenCan(){
  var chk = Math.floor(Math.random() * 6)
  playCan(chk);
  addCan(chk,4);
}

initChicken();

///// cheen

var cheenContainer = new PIXI.Container();
stage.addChild(cheenContainer);

function initCheen(){
  var ftex = PIXI.Texture.fromImage("./img/cheen.png");
  var spr = new PIXI.Sprite(ftex);
  spr.anchor.x = 0.5;
  spr.anchor.y = 0.5;
  spr.scale.x = 0.4;
  spr.scale.y = 0.4;

  spr.position.x = width/2;
  spr.position.y = height/2;
  spr.visible = false;
  spr.count = 0;
  cheenContainer.addChild(spr);
}

function startCheen(){
  var spr = cheenContainer.children[0];
  spr.rotation = 0;
  spr.scale.x = 0.4;
  spr.scale.y = 0.4;
  spr.visible = true;
  spr.count = 64;
}

function updateCheen(){
  var spr = cheenContainer.children[0];
  if(spr.count > 0){
    if((spr.count % 8) == 0){
      addChickenCan();
    }
    spr.scale.x += 0.1    
    spr.scale.y += 0.1  
    spr.rotation += 0.1;
    spr.count --;
    if(spr.count == 0){
      spr.visible = false;
      spr.scale.x = 0.4;
      spr.scale.y = 0.4;
      spr.rotation = 0;
    }
  }
}

initCheen();


///////////////////////////////////////////////////////////////////////
// Title
var titleContainer = new PIXI.Container();
stage.addChild(titleContainer);

var title = {};
var rpoints = [];
var beat = 0;
var flag = 0;
var BEAT_RES = 24;
var IMAGE_WIDTH = 814;
var IMAGE_HEIGHT = 130;

function initTitle(){

  var ppwidth = IMAGE_WIDTH/BEAT_RES;
  for (var rcnt = 0; rcnt < BEAT_RES; rcnt++) {
    rpoints.push(new PIXI.Point(rcnt * ppwidth, 0));
  }
  title.spr = new PIXI.mesh.Rope(PIXI.Texture.fromImage("img/logo.png"),rpoints);
  title.spr.pivot.x = IMAGE_WIDTH / 2;
  title.spr.pivot.y = IMAGE_HEIGHT / 2;

  resetTitle();
  titleContainer.addChild(title.spr);
}

function resetTitle(){
  title.spr.scale.x = width / (IMAGE_WIDTH + 200);
  title.spr.scale.y = title.spr.scale.x;
  title.spr.position.x = (width / 2);
  title.spr.position.y = (height / 2) + ((IMAGE_HEIGHT * title.spr.scale.x) / 2);
}

function updateTitle(){
  rpoints[beat].y -= 40;
  if(flag == 1){
    if(beat != 0){
      rpoints[beat-1].y += 40;
    }else{
      rpoints[BEAT_RES-1].y += 40;
    }
  }
  flag = 1;
  beat ++;
  beat %= BEAT_RES;
}

initTitle();


////////
// QR Code
var remtex = PIXI.Texture.fromImage("./img/remocon.png");
var rem = new PIXI.Sprite(remtex);
var qrtex = PIXI.Texture.fromImage("./img/qr.gif");
var qr = new PIXI.Sprite(qrtex);
var crtex = PIXI.Texture.fromImage("./img/credit.png");
var credit = new PIXI.Sprite(crtex);
var evttex = PIXI.Texture.fromImage("./img/budge.png");
var evtlogo = new PIXI.Sprite(evttex);

//var twistFilter = new PIXI.filters.TwistFilter();

function initQrCode(){
  qr.position.x = 50;
  qr.position.y = 120;
  qr.anchor.x = 0.5;
  qr.anchor.y = 0.5;
  qr.scale.x = 0.6;
  qr.scale.y = 0.6;
  titleContainer.addChild(qr);

  rem.position.x = 100;
  rem.position.y = 120;
  rem.anchor.x = 0;
  rem.anchor.y = 0.5;
  rem.scale.x = 0.5;
  rem.scale.y = 0.5;
  titleContainer.addChild(rem);

  credit.position.x = width/2;
  credit.position.y = height-40;
  credit.anchor.x = 0.5;
  credit.anchor.y = 0.5;
  titleContainer.addChild(credit);

  evtlogo.position.x = width/2;
  evtlogo.position.y = height-140;
  evtlogo.anchor.x = 0.5;
  evtlogo.anchor.y = 0.5;
  evtlogo.scale.x = 0.2;
  evtlogo.scale.y = 0.2;
  titleContainer.addChild(evtlogo);
}

function updateQrCode(){
  if(fcount == 0){
    rem.position.x -= 4;
    credit.scale.x -= 0.06;
    credit.scale.y -= 0.06;
//　　 evtlogo.scale.x += 0.1;
//　　 evtlogo.scale.y += 0.1;
  }else if(fcount == 3){
    rem.position.x += 4;
    credit.scale.x += 0.06;
    credit.scale.y += 0.06;
//　　 evtlogo.scale.x += 0.1;
//　　 evtlogo.scale.y += 0.1;
  }else if(fcount == 6){
    rem.position.x += 4;
    credit.scale.x += 0.06;
    credit.scale.y += 0.06;
//　　 evtlogo.scale.x -= 0.1;
//　　 evtlogo.scale.y -= 0.1;
  }else if(fcount == 9){
    rem.position.x -= 4;
    credit.scale.x -= 0.06;
    credit.scale.y -= 0.06;
//　　 evtlogo.scale.x -= 0.1;
//　　 evtlogo.scale.y -= 0.1;
  }
  evtlogo.rotation += 0.1;
}

function resetQrCode(){
  credit.position.x = width/2;
  credit.position.y = height-40;
  evtlogo.position.x = width/2;
  evtlogo.position.y = height-130;
}

initQrCode();


///////////////////////////////////////////////////////////////////////
// Animation Frame

requestAnimationFrame(animate);

var sprites_num = 0;
var frames = 0;
var fcount = 0;
var isFilter = false;

function animate(){
  requestAnimationFrame(animate);

  if((frames % 6) == 1){
    updateCans();
  }
  if((frames % 12) == 3){
    updateLine();
  }
  if((frames % 12) == 5){
    updateTitle();
    updateQrCode();
    fcount ++;
    fcount %= 12;
  }
  if((frames % 12 == 7)){
    updateDucks();
  }

  if((frames % 30) == 1){
    if(Math.random() > 0.5){
      addDuck();
    }
  }

  if((frames % 9) == 3){
    updateFaces();
  }

  if((frames % 4) == 3){
  	updateChicken();
    updateCheen();
  }

  if((frames % 3) == 0){
    renderer.render(stage);
  }
  frames ++;
  frames %= 120;
}

///////////////////////////////////////////////////////////////////////
// resizeing

var resizeTimer = false;
$(window).resize(function() {
    if (resizeTimer !== false) {
        clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(function() {
      width = window.innerWidth;
      height = window.innerHeight;
      renderer.resize(width, height);

      resetTitle();
      resetQrCode();
      updateFacePoints();
      updateChickenPoint();

    }, 200);
});


