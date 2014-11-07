localStorage.clear();
/*
 * OUTBOX STUFF
 */
document.getElementById( 'send' ).onclick = function() {

	var outStr = localStorage.getItem( 'outbox' ) || '';
	if (document.getElementById('name').value == ""){
	var namm= "anonymous";
	}
	else{
	var namm= document.getElementById('name').value;
	}
	var mess = document.getElementById('message').value.replace(/\r?\n/g, "<br />");
	var newMsgs ={};
	var ddata= new Date().getTime();
	var contento = {
	"time" : ddata,
	"message" : mess,
	"name" : namm,
	"node" : "local",
	"hops" : "0"
	}
	newMsgs.message = contento;	
	
	localStorage.setItem( 'outbox', JSON.stringify(newMsgs) );
	updateOutboxView();
	checkOutbox();
	document.getElementById('message').value = '';
};
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
	updateOutboxView();
}
function updateOutboxView() {
	var contentString = '';
	var outStr = localStorage.getItem( 'outbox' ) || '';
	var lines = outStr.split( /\n/ );
	for ( var i in lines ) {
		if ( lines[ i ].length === 0 ) {
			continue;
		}
               var obj = JSON.parse(lines[i]);
                var ts = obj.message.time;
                delete obj.message.time;
                var msg = JSON.stringify(obj.message);

		contentString += '<li><b>' + ts + ' </b>' + msg + '</li>';
	}
	document.getElementById( 'outbox' ).innerHTML = contentString;
}

/*
 * INBOX STUFF
 */


function updateInboxView() {
	var localStorageArray = new Array();
	var contentString = '';

	if (localStorage.length>0) {
	for (i=0;i<localStorage.length;i++){

	element=localStorage.getItem(localStorage.key(i));
	
	if ( localStorage.key(i).length < 10 || element === 'outbox' ) {
	continue;
	}
//	alert(element);
	try {
        elementj = JSON.parse(element);
    	} catch (e) {
        continue;
    	}	

	localStorageArray[i] = { time:localStorage.key(i), user:elementj.name, message:elementj.message, node:elementj.node, hops:elementj.hops };
	}
	}
	orderStorage = localStorageArray.sort(function(a,b) { return b.time - a.time } );

	for(var i in orderStorage)
	{
		if ( i.length === 0 || i === 'outbox' ) {
			continue;
		}
		var date = new Date(parseInt(orderStorage[i].time));
//		date.setHours(date.getHours() + 2);
		var datereadable = date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear()+" "+date.getHours()+":"+date.getMinutes();
		contentString += '<li><b>' + datereadable + ' </b>' + ' <i>'+ orderStorage[i].user +'</i><br/> '+orderStorage[i].message+' <span class="node '+orderStorage[i].node+'">'+orderStorage[i].node+'</span> <span class="hops '+orderStorage[i].hops+'">'+orderStorage[i].hops+'</span></li>';
	}
	document.getElementById( 'inbox' ).innerHTML = contentString;
}

function onMessageDownload( msg, filename ) {
	if ( localStorage.getItem( filename ) === null ) {
		localStorage.setItem( filename, msg );
	}
	updateInboxView();
}
function onIndex( index ) {
        var lines = index.split( /\n/ );

	for(var k in localStorage){
		var l = 1;
		for ( var i in lines ) {
			var f = lines[i];
			if (f == k){ l = 0; }
		}
	if (l == 1){
	localStorage.removeItem(k);
	}
	}
updateInboxView();

	for ( var i in lines ) {
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
	}
	xhr.open( "GET", 'msg/'+filename, true);
	xhr.send();

}
function checkInbox() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4 && xhr.status == 200){
            onIndex( xhr.responseText );
        }
    }
    xhr.open( "GET", 'index', true);
    xhr.send();
}

/*
 * INIT
 */

updateInboxView();
updateOutboxView();
window.setInterval( function(){
	checkInbox();
	checkOutbox();
}, 7000 );

