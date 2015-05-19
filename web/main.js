localStorage.clear();


//These need to be obtained from the node
var ownId, ownColor, ownAlias;

/*
 * INIT
 */

document.addEventListener('DOMContentLoaded', function(){

  function update(){
    if ( !ownId ){
      getOwnId();
    }
    if ( !ownAlias){
   getOwnAlias();
    }
    checkInbox();
    // also check for outbox items on interval,
    // necessary in case connection is lost and messages are not yet sent
    checkOutbox();
  }

  document.getElementById('message-form').onsubmit = onSubmitMessage;

  //update everything to initialize
  updateInboxView();
  update();

  //check for new messages every 7 seconds
  window.setInterval( update, 7000 );

  initState();
  initPhotoStuff();
});

/*
 * STATE CHANGES
 */

function initState(){
  showOverview();

  document.getElementById('new-photo').onclick = showNewPhoto;
  document.getElementById('new-message').onclick = showNewMessage;
  document.getElementById('message-back').onclick = showOverview;
  document.getElementById('photo-back').onclick = showOverview;
}

function showNewPhoto(){
  document.getElementById('photo-page').style.display = "block";
  document.getElementById('overview-page').style.display = "none";
  document.getElementById('message-page').style.display = "none";
  document.getElementById('fileInput').click();
}

function showNewMessage(){
  document.getElementById('photo-page').style.display = "none";
  document.getElementById('overview-page').style.display = "none";
  document.getElementById('message-page').style.display = "block";
}

function showOverview(){
  document.getElementById('photo-page').style.display = "none";
  document.getElementById('overview-page').style.display = "block";
  document.getElementById('message-page').style.display = "none";
}

/*
 * OUTBOX STUFF
 */
function onSubmitMessage(){
  var msg = document.getElementById('message').value.replace(/\r?\n/g, "<br />");
  var namm =  document.getElementById('name').value || "anonymous";
  addOutboxItem( namm, msg );
}

function addOutboxItem( namm, message ){
  var outStr = localStorage.getItem( 'outbox' ) || '';
  var newMsgs = {};
  var ddata = new Date().getTime();
  var alias = ownAlias;
  if ( alias === ownId ) {
    alias = "local";
  }
  var contento = {
    "time" : ddata,
    "message" : message,
    "name" : namm,
    "node" : alias,
    "hops" : "0"
  };
  newMsgs.message = contento;

  localStorage.setItem( 'outbox', JSON.stringify(newMsgs) );
  checkOutbox();
  document.getElementById('message').value = '';

  showOverview();
  return false;
}

function checkOutbox() {
        var outStr = localStorage.getItem( 'outbox' );
  if ( ! outStr ) {
    return;
  }
  var lines = outStr.split( /\n/ );
  for ( var i in lines ) {
    if ( lines[i].length === 0 ) {
      continue;
    }
    var obj = JSON.parse(lines[i]);
    var ts = obj.message.time;
    delete obj.message.time;
    var msg = JSON.stringify(obj.message);
    sendMessage( ts, msg );
  }
}
function sendMessage( timestamp, message ) {
  var xhr = new XMLHttpRequest();
  var data = 'time=' + encodeURIComponent( timestamp ) +
    '&message=' + encodeURIComponent( message );

  xhr.onreadystatechange = function(){
    if ( xhr.readyState == 4){
        if ( xhr.status == 200 ) {
          removeOutboxItem( timestamp );
        }
    }
  };

  xhr.open('POST', 'send', true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.setRequestHeader('If-Modified-Since', 'Sat, 1 Jan 2005 00:00:00 GMT');
  xhr.send(data);
}
function removeOutboxItem( timestamp ) {
  var outStr = localStorage.getItem( 'outbox' ) || '';
  var lines = outStr.split( /\n/ );
  for ( var i in lines ) {
                var obj = JSON.parse(lines[i]);
    var ts = obj.message.time;
    if ( ts === timestamp ) {
      lines.splice( i, 1 );
      break;
    }
  }
  var newOutStr = lines.join('\n');
  localStorage.setItem('outbox', newOutStr);
}

/*
 * INBOX STUFF
 */


function updateInboxView() {
var localStorageArray = [];
  var contentString = '';

  if (localStorage.length>0) {
    for (i=0;i<localStorage.length;i++){

      element=localStorage.getItem(localStorage.key(i));

      if ( localStorage.key(i).length < 10 || element === 'outbox' ) {
        continue;
      }
      try {
        elementj = JSON.parse(element);
      } catch (e) {
        continue;
      }

      localStorageArray[i] = {
        time:localStorage.key(i),
        user:elementj.name,
        message:elementj.message,
        node:elementj.node,
        hops:elementj.hops
      };
    }
  }
  orderStorage = localStorageArray.sort(function(a,b) { return b.time - a.time; } );

  for(var i in orderStorage) {
    if ( i.length === 0 || i === 'outbox' ) {
            continue;
    }
    var datereadable = getReadableDate( new Date(parseInt(orderStorage[i].time)) );
    var color = getNodeColor( orderStorage[i].node );
    contentString += '<li><div class="message-block" style="background-color:'+color+'">'+
      '<div class="date-sender">On ' + datereadable +
      ' <b>' + orderStorage[i].user +'</b> wrote:</div>' +
      '<div class="message-text">' + orderStorage[i].message + '</div>' +
      ' <span class="node '+orderStorage[i].node+'">from '+orderStorage[i].node + '</span>' +
      ' <span class="hops '+orderStorage[i].hops+'">via '+orderStorage[i].hops+' nodes</span></div></li>';
  }
  document.getElementById( 'inbox' ).innerHTML = contentString;
}
function getReadableDate( date ) {
  var day = date.getDate();
  if (day < 10) day = '0' + day;
  var month = date.getMonth()+1;
  if (month < 10) month = '0' + month;
  var year = date.getFullYear();
  var hrs = date.getHours();
  if (hrs < 10) hrs = '0' + hrs;
  var min = date.getMinutes();
  if (min < 10) min = '0' + min;

  return day + '/' + month + '/' + year + ' ' + hrs + ':' + min;
}
function getNodeColor( nodeId ) {
  if( nodeId === 'local' ) {
    return ownColor || '#fff';
  }
  return colorLuminance(nodeId.substr(0,6), 0.5);
}
function colorLuminance(hex, lum) {

  // validate hex string
  hex = String(hex).replace(/[^0-9a-f]/gi, '');
  if (hex.length < 6) {
    hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  }
  lum = lum || 0;

  // convert to decimal and change luminosity
  var rgb = "#", c, i;
  for (i = 0; i < 3; i++) {
    c = parseInt(hex.substr(i*2,2), 16);
    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
    rgb += ("00"+c).substr(c.length);
  }

  return rgb;
}

function onMessageDownload( msg, filename ) {
  if ( localStorage.getItem( filename ) === null ) {
    localStorage.setItem( filename, msg );
  }
  updateInboxView();
}
function onIndex( index ) {
  var lines = index.split( /\n/ );
  var k,i,l,f;
  for( k in localStorage){
    l = 1;
    for ( i in lines ) {
      f = lines[i];
      if (f == k){ l = 0; }
    }
    if (l == 1){
      localStorage.removeItem(k);
    }
  }
  updateInboxView();

  for ( i in lines ) {
    var fname = lines[i];
    if ( localStorage.getItem( fname ) === null ) {
      //localStorage.setItem( ts, lines[i].substr(lines[i].indexOf(' ')) );
      downloadMessage( fname );
    }

  }

}
function downloadMessage(filename) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4 && xhr.status == 200){
      onMessageDownload( xhr.responseText, filename );
    }
  };
  xhr.open( "GET", 'msg/'+filename, true);
  xhr.send();

}
function checkInbox() {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4 && xhr.status == 200){
      onIndex( xhr.responseText );
    }
  };
  xhr.open( "GET", 'index', true);
  xhr.send();
}
function getOwnId() {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4 && xhr.status == 200){
      ownId = xhr.responseText;
      ownColor = getNodeColor( ownId );
    }
  };
  xhr.open( "GET", 'id', true);
  xhr.send();
}

function getOwnAlias() {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4 && xhr.status == 200){
      ownAlias = xhr.responseText;
    }
  };
  xhr.open( "GET", 'alias', true);
  xhr.send();
}

/*
 * PHOTO STUFF
 */
var imgDim = 200;
var canvas1;
var context1;
var canvas2;
var context2;
var imgObj;
var fileReader;
var rotation = 0;

var sourceImage = document.getElementById('sourceImage'); // get reference to img
var fileInput = document.getElementById('fileInput'); // get reference to file select
var progressEl = document.getElementById('progress');
var totalEl = document.getElementById('total');


function initPhotoStuff(){
    canvas1 = document.getElementById('canvas1');
    context1 = canvas1.getContext('2d');
    canvas2 = document.getElementById('canvas2');
    context2 = canvas2.getContext('2d');
    canvas3 = document.getElementById('canvas3');
    context3 = canvas3.getContext('2d');
    initCanvas(context1);
    initCanvas(context2);
    initCanvas(context3);

    fileInput.onchange = onFileInputChange;

    document.getElementById('rot-left').onclick = onRotateLeft;
    document.getElementById('rot-right').onclick = onRotateRight;
    document.getElementById('submit-photo').onclick = submitImage;

}


function submitImage(){

    // convert canvas to html/base64 image
    var image = new Image(); //create new image holder
    image.id = "outputImage"; //id it

    var canvas = document.getElementById('canvas3'); // choose canvas element to convert
    var dataURL = canvas.toDataURL(); // convert cabvas to data url we can handle
    image.src = dataURL;
    //var outputImg = document.createElement("img"); // create img tag
    //outputImg.src = dataURL; // assign dataurl to image tag 'src' option
    //document.body.appendChild(outputImg); // append img to body (to be assigned to place holder div)

    // append data to text area...not working yet..
    //var photo = document.getElementById('message'); // add data url to message field... not working yet
    //outputImg.src = "<img src='"+ outputImg.src; +"'/>" // construct image tag + img data...
        //photo += outputImg.src;
    //photo.innerHTML += outputImg.src;

    //sendMessage( new Date().getTime(), dataURL );
    //sendMessage( new Date().getTime(), "random "+Math.random()*1000 );
    var namm = document.getElementById('photo-name').value || "anonymous";
    addOutboxItem( namm, image.outerHTML );
    showOverview();
    return false;
}

function initCanvas(context){
    // Debug filling
    context.fillStyle ="#dbbd7a";
    context.fill();
    context.beginPath();
    context.rect(0,0, imgDim, imgDim);
    context.fillStyle = 'yellow';
    context.fill();
    context.lineWidth = 7;
    context.strokeStyle = 'black';
    context.stroke();
}

// create file reader
function onFileInputChange(){
    var file = fileInput.files[0]; // get selected file (camera capture)
    fileReader = new FileReader();
    fileReader.onload = onFileReaderLoad; // add onload listener
    fileReader.onprogress = onFileReaderProgress; // add progress listener
    fileReader.readAsDataURL( file ); // get captured image as data URI
}

function onFileReaderProgress(e) {
  if (e.lengthComputable) {
    var progress = parseInt( ((e.loaded / e.total) * 100), 10 );
    console.log(progress);
    progressEl.innerHTML = e.loaded;
    totalEl.innerHTML = e.total;
  }
}
function onFileReaderLoad() {
    imgObj = new Image();
    imgObj.src = fileReader.result;
    imgObj.onload = onImageLoad;

    //for debugging: show image on screen, will be squashed
    sourceImage.src = fileReader.result;
}

function onImageLoad() {
    var w,h;
    var xOffset = 0;
    var yOffset = 0;
    if ( imgObj.width > imgObj.height ) {
      h = imgDim;
      w = imgDim * imgObj.width / imgObj.height;
      xOffset = (imgDim - w) / 2;
    } else {
      w = imgDim;
      h = imgDim * imgObj.height / imgObj.width;
      yOffset = (imgDim - h) / 2;
    }
    context1.drawImage(imgObj, xOffset, yOffset, w, h);
    var imageData  = context1.getImageData( 0, 0, canvas1.width, canvas1.height);
    context2.putImageData( monochrome(imageData,128,"atkinson"), 0, 0);
    drawRotated();
}

function onRotateRight(){
  rotation += 90;
  drawRotated();
}
function onRotateLeft(){
  rotation -= 90;
  drawRotated();
}
function drawRotated(){

    context3.clearRect(0,0,canvas3.width,canvas3.height);
    context3.save();
    context3.translate(canvas3.width/2,canvas3.height/2);
    context3.rotate(rotation * Math.PI / 180);
    context3.translate(-canvas3.width/2,-canvas3.height/2);
    context3.drawImage( canvas2, 0, 0 );
    context3.restore();
}



var bayerThresholdMap = [
  [  15, 135,  45, 165 ],
  [ 195,  75, 225, 105 ],
  [  60, 180,  30, 150 ],
  [ 240, 120, 210,  90 ]
];

var lumR = [];
var lumG = [];
var lumB = [];
for (var i=0; i<256; i++) {
  lumR[i] = i*0.299;
  lumG[i] = i*0.587;
  lumB[i] = i*0.114;
}

function monochrome(imageData, threshold, type){

  var imageDataLength = imageData.data.length;

  // Greyscale luminance (sets r pixels to luminance of rgb)
  for (var i = 0; i <= imageDataLength; i += 4) {
    imageData.data[i] = Math.floor(lumR[imageData.data[i]] + lumG[imageData.data[i+1]] + lumB[imageData.data[i+2]]);


  }
  var w = imageData.width;
  var newPixel, err;

  for (var currentPixel = 0; currentPixel <= imageDataLength; currentPixel+=4) {

    if (type === "none") {
      // No dithering
      imageData.data[currentPixel] = imageData.data[currentPixel] < threshold ? 0 : 255;
    } else if (type === "bayer") {
      // 4x4 Bayer ordered dithering algorithm
      var x = currentPixel/4 % w;
      var y = Math.floor(currentPixel/4 / w);
      var map = Math.floor( (imageData.data[currentPixel] + bayerThresholdMap[x%4][y%4]) / 2 );
      imageData.data[currentPixel] = (map < threshold) ? 0 : 255;
    } else if (type === "floydsteinberg") {
      // Floyd–Steinberg dithering algorithm
      newPixel = imageData.data[currentPixel] < 129 ? 0 : 255;
      err = Math.floor((imageData.data[currentPixel] - newPixel) / 16);
      imageData.data[currentPixel] = newPixel;

      imageData.data[currentPixel       + 4 ] += err*7;
      imageData.data[currentPixel + 4*w - 4 ] += err*3;
      imageData.data[currentPixel + 4*w     ] += err*5;
      imageData.data[currentPixel + 4*w + 4 ] += err*1;
    } else {
      // Bill Atkinson's dithering algorithm
      newPixel = imageData.data[currentPixel] < 129 ? 0 : 255;
      err = Math.floor((imageData.data[currentPixel] - newPixel) / 8);
      imageData.data[currentPixel] = newPixel;

      imageData.data[currentPixel       + 4 ] += err;
      imageData.data[currentPixel       + 8 ] += err;
      imageData.data[currentPixel + 4*w - 4 ] += err;
      imageData.data[currentPixel + 4*w     ] += err;
      imageData.data[currentPixel + 4*w + 4 ] += err;
      imageData.data[currentPixel + 8*w     ] += err;
    }

    // Set g and b pixels equal to r
    imageData.data[currentPixel + 1] = imageData.data[currentPixel + 2] = imageData.data[currentPixel];
  }
  // Alpha: make white pixels transparent!
  var newColor = {r:0,g:0,b:0, a:0};

  for ( i = 0, n = imageData.data.length; i <n; i += 4) {
  var r = imageData.data[i],
          g = imageData.data[i+1],
          b = imageData.data[i+2];

      // If its white, or close to white then change it
      if(r >=200 && g >= 200 && b >= 200){
          // Change the white to whatever.
          imageData.data[i] = newColor.r;
          imageData.data[i+1] = newColor.g;
          imageData.data[i+2] = newColor.b;
          imageData.data[i+3] = newColor.a;
      }
   }

  return imageData;
}
