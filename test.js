// const { defaultHead } = require('next/head');
// const { Client } = require('whatsapp-web.js');

// const client = new Client();

// client.on('qr', (qr) => {
//     // Generate and scan this code with your phone
//     console.log('QR RECEIVED', qr);
// });

// client.on('ready', () => {
//     console.log('Client is ready!');
// });

// client.on('message', msg => {
//     if (msg.body == '!ping') {
//         msg.reply('pong');
//     }
// });

// client.initialize();
function sendmessage(){
    var request = require('request');
    var options = {
      'method': 'POST',
      'url': 'https://webhook-test.com/8b1a9814aa31218d68a54569f6000e5c',
      'headers': {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        " name": "admin-portal"
      })
    
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
    });
}

sendmessage();