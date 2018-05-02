//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const fb = require('fbgraph');
const PAGE_ACCESS_TOKEN = 'EAAbrXGzPUL0BAMsL3EmHQd1G3RIFtmaCe35e1ZAT7RCdrdUMVxZAdYd92b2loCPO6CXFZC80dPXiWpdQsaItYeloR7lkdl6IxDuVWB0CFZCZCKin8TRZBmQpaMShrO8uklkz7mCeG7Lpb8vDZCSSqMD388sqj4N9HGyY6MovuFWE5YYbbkukhpI6BKUTZA6auabaTS0eEIhARAZDZD';
const VERIFY_TOKEN='HackDay';
// The rest of the code implements the routes for our Express server.
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Webhook validation
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }
});

app.get('/', function(req, res) {
  res.send('Hello F8!')
});

app.get('/rules', (req,res) =>{
    res.send("<html><body>¡Bienvenid@! Este es un foro para desarrolladores en la Ciudad de México y alrededores que están interesados en desarrollar sobre la plataforma de Facebook y en colaborar con otros desarrolladores con intereses similares. Las herramientas que aquí se discuten incluyen todos los productos listados en: https://developers.facebook.com/products Este grupo no es para hacer preguntas sobre un perfil personal de Facebook, para pedir likes para una aplicación o página, anunciar productos/servicios, subir fotos personales, etc. Ese tipo de entradas podrán ser eliminadas del grupo junto con su autor. Por favor recuerda siempre ser respetuoso y considerado de los otros miembros del grupo. No dudes en participar por medio de posts frescos, de tus comentarios y de tus preguntas. Si vas a hacer una pregunta, recuerda primero buscar dentro del grupo para asegurarte que la pregunta no ha sido respondida en el pasado. Let's connect, share and build! Visita https://developers.facebook.com/ para estar al día con todas las novedades de Facebook, así como acceder a toda la documentación de los productos para desarrolladores. </body></html>");
} );

app.get('/feed', (req, res) => {
  fb.get("476463749198108/feed",{ access_token: PAGE_ACCESS_TOKEN }, (err, feed) => {
    console.log(JSON.stringify(feed)); 
    res.send(JSON.stringify(feed));
  });  
});


// Message processing
app.post('/webhook', function (req, res) {
  console.log(req.body);
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);   
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });
    res.sendStatus(200);
  }
});

// Incoming events handling
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;
      case 'nlp':
        sendTextMessage(senderID, "duda resuelta");
      break;
      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;
  switch(payload){
    case "GET_STARTED_PAYLOAD":
      
    break;
    case "Joim":
        sendTextMessage(senderID, "join"); 
    break;
  }
  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

//////////////////////////
// Sending helpers
//////////////////////////
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function sendRules(recipientId){
    let response = {
        attachment: {
            type: "template",
            payload: {
                template_type: "button",
                text: "Welcome, please read the rules",
                buttons: [{
                    type: "web_url",
                    url:  "http://104.131.69.49:3000/",
                    title: "Rules",
                    webview_height_ratio: "compact",
                    messenger_extensions: false
                }]
            }
        }
    };
    callSendAPI(response);
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", server.address().port);
});