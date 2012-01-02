var express = require('express');
var WebSocketServer = require('ws').Server;
var app = express.createServer();

function getSoundBuffer(samples) {
  // header yanked from
  // http://html5-demos.appspot.com/static/html5-whats-new/template/index.html#30
  var header = new Buffer([
      0x52,0x49,0x46,0x46, // "RIFF"
      0, 0, 0, 0,          // put total size here
      0x57,0x41,0x56,0x45, // "WAVE"
      0x66,0x6d,0x74,0x20, // "fmt "
      16,0,0,0,            // size of the following
      1, 0,                // PCM format
      1, 0,                // Mono: 1 channel
      0x44,0xAC,0,0,       // 44,100 samples per second
      0x88,0x58,0x01,0,    // byte rate: two bytes per sample
      2, 0,                // aligned on every two bytes
      16, 0,               // 16 bits per sample
      0x64,0x61,0x74,0x61, // "data"
      0, 0, 0, 0           // put number of samples here
  ]);
  header.writeUInt32LE(36 + samples.length, 4, true);
  header.writeUInt32LE(samples.length, 40, true);
  var data = new Buffer(header.length + samples.length);
  header.copy(data);
  samples.copy(data, header.length);
  return data;
}

function makeSamples(frequency, duration) {
  var samplespercycle = 44100 / frequency;
  var samples = new Uint16Array(44100 * duration);
  var da = 2 * Math.PI / samplespercycle;
  for (var i = 0, a = 0; i < samples.length; i++, a += da) {
    samples[i] = Math.floor(Math.sin(a / 300000) * 32768);
  }
  return getSoundBuffer(new Buffer(Array.prototype.slice.call(samples, 0)));
}

app.use(express.static(__dirname + '/public'));
app.listen(8080);
var wss = new WebSocketServer({server: app, path: '/data'});

var samples = makeSamples(20000, 10);

wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    ws.send('pong');
  });
  ws.send(samples, {binary: true});
});
