/////////////////////////////////////////////////////////
// midi2osc Bridge
// (CCby) 2018 D.F.Mac. @TripArts Music
// MIDI Note ON(0-7) → OSC message ["/con/push1","f",[0.0]]-["/con/push8","f",[0.0]]
/////////////////////////////////////////////////////////

// var ADDR = "IPADDR";
var IPADDR = "172.20.10.2";
var PORTNUMBER = 9000;

var midi = require('midi');
var oscsender = require('omgosc').UdpSender;
var sender = new oscsender(IPADDR, PORTNUMBER);
var input = new midi.input();
var input_port = null;

var midiPortsNum = input.getPortCount();
//console.log("num"+midiPortsNum);

for(var cnt=0;cnt<midiPortsNum;cnt++){
  var name = input.getPortName(cnt);
//  console.log("name:"+name);
  if(name.indexOf("IAC") == 0){
    input_port = cnt;
  }
}

input.on('message', function(deltaTime, message) {
//  console.log("[0x"+Number(message[0]).toString(16)+"] [0x"+Number(message[1]).toString(16)+"] [0x"+Number(message[2]).toString(16)+"]");
  if((message[0] & 0xF0) == 0x90){ // Note ON
    var tag = "/con/push"+(message[1]+1);
    sender.send(tag,'f',[0.0]);
  }
});
 
if(input_port != null){
  input.openPort(input_port);
}
