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
    var image = new Image(); //create new image holder

    var canvas = document.getElementById('canvas3'); // choose canvas element to convert
    var dataURL = canvas.toDataURL(); // convert cabvas to data url we can handle
    image.src = dataURL;
    image.className = 'photo-message';
    if ( !image.src || image.src === "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAACEUlEQVR4nO3TMQEAIAzAsPk3DQrWF45EQZ/OAVbzOgB+ZhAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBYBAIBoFgEAgGgWAQCAaBcAEODrNzcVUZ+gAAAABJRU5ErkJggg==" ) { /* prevent sending of empty messages (data url of blank, thus white, canvas)*/
      return false;
    }

    var namm = document.getElementById('photo-name').value;
    if( !namm || namm == "" ){
      namm = "anonymous";
    }
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
    context.fillStyle = 'white';
    context.fill();
    // context.lineWidth = 7;
    // context.strokeStyle = 'black';
    // context.stroke();
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
