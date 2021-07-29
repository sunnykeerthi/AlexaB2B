// This is template files for developing Alexa skills

'use strict';

var AWS = require('aws-sdk');
var jsforce = require('jsforce');
var intentHandlers = {}; 
const uname = process.env.username;
const pwd = process.env.password;

exports.handler = function (event, context) {
    try {

        if (APP_ID !== '' && event.session.application.applicationId !== APP_ID) {
            context.fail('Invalid Application ID');
        }

        if (!event.session.attributes) {
            event.session.attributes = {};
        }


        if (event.session.new) {
            onSessionStarted({
                requestId: event.request.requestId
            }, event.session);
        }


        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request, event.session, new Response(context, event.session));
        } else if (event.request.type === 'IntentRequest') {
            var response = new Response(context, event.session);
            if (event.request.intent.name in intentHandlers) {
                intentHandlers[event.request.intent.name](event.request, event.session, response, getSlots(event.request));
            } else {
                response.speechText = 'Unknown intent';
                response.shouldEndSession = true;
                response.done();
            }
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail('Exception: ' + getError(e));
    }
};

function getSlots(req) {
    var slots = {};
    for (var key in req.intent.slots) {
        slots[key] = req.intent.slots[key].value;
    }
    return slots;
}

var Response = function (context, session) {
    this.speechText = '';
    this.shouldEndSession = true;
    this.ssmlEn = true;
    this._context = context;
    this._session = session;

    this.done = function (options) {

        if (options && options.speechText) {
            this.speechText = options.speechText;
        }

        if (options && options.repromptText) {
            this.repromptText = options.repromptText;
        }

        if (options && options.ssmlEn) {
            this.ssmlEn = options.ssmlEn;
        }

        if (options && options.shouldEndSession) {
            this.shouldEndSession = options.shouldEndSession;
        }

        this._context.succeed(buildAlexaResponse(this));
    };

    this.fail = function (msg) {
        this._context.fail(msg);
    };

};

function createSpeechObject(text, ssmlEn) {
    if (ssmlEn) {
        return {
            type: 'SSML',
            ssml: '<speak>' + text + '</speak>'
        };
    } else {
        return {
            type: 'PlainText',
            text: text
        };
    }
}

function buildAlexaResponse(response) {
    var alexaResponse = {
        version: '1.0',
        response: {
            outputSpeech: createSpeechObject(response.speechText, response.ssmlEn),
            shouldEndSession: response.shouldEndSession
        }
    };

    if (response.repromptText) {
        alexaResponse.response.reprompt = {
            outputSpeech: createSpeechObject(response.repromptText, response.ssmlEn)
        };
    }

    if (response.cardTitle) {
        alexaResponse.response.card = {
            type: 'Simple',
            title: response.cardTitle
        };

        if (response.imageUrl) {
            alexaResponse.response.card.type = 'Standard';
            alexaResponse.response.card.text = response.cardContent;
            alexaResponse.response.card.image = {
                smallImageUrl: response.imageUrl,
                largeImageUrl: response.imageUrl
            };
        } else {
            alexaResponse.response.card.content = response.cardContent;
        }
    }

    if (!response.shouldEndSession && response._session && response._session.attributes) {
        alexaResponse.sessionAttributes = response._session.attributes;
    }
    return alexaResponse;
}

function getError(err) {
    var msg = '';
    if (typeof err === 'object') {
        if (err.message) {
            msg = ': Message : ' + err.message;
        }
        if (err.stack) {
            msg += '\nStacktrace:';
            msg += '\n====================\n';
            msg += err.stack;
        }
    } else {
        msg = err;
        msg += ' - This error is not object';
    }
    return msg;
}


//--------------------------------------------- Skill specific logic starts here ----------------------------------------- 

//Add your skill application ID from amazon devloper portal
var APP_ID = process.env.APP_ID;

function onSessionStarted(sessionStartedRequest, session) {
    // add any session init logic here

}

function onSessionEnded(sessionEndedRequest, session) {
    // Add any cleanup logic here

}

function onLaunch(launchRequest, session, response) {
    response.speechText = `Hi there, I'm your e-commerce buddy. What can I help you today with?`;
    response.shouldEndSession = false;
    response.done();
}

intentHandlers['SuggestMeAMobIntent'] = function (request, session, response, slots) {
    if (!session.attributes.product) {
        session.attributes.product = [];
    }

    var conn = new jsforce.Connection();
    conn.login(uname, pwd, function (err, res) {
        if (err) {
            console.log(err);
            return console.error(err);
        }
        conn.query(`SELECT Id, Price__c, Category__c, Model__c, Model_withoutUS__c, Brand__c, isFlagship__c, ScreenSize__c, Ram__c, Processor__c, Memory__c, Year__c FROM B2B_Products_Object__c limit 5 `,
            function (err, result) {
                if (err) {
                    return console.error(err, ret);
                } else {
                    var spechText, cardText;
                    if (result.totalSize == 0) {
                        spechText = `I cannot find and top orders for given period.`;
                        cardText = `I cannot find and top orders for given period.`;
                    } else {
                        spechText = `Here are top 5 phones based on the user ratings. <break time="1s"/> `;
                        cardText = "";
                        for (var i = 0; i < result.records.length; i++) {
                            spechText += `${result.records[i].Model__c}, `;
                            cardText += `${result.records[i].Model__c}  \n `;
                        }
                    }
                    response.speechText = spechText + `. which one are you interested in?,  or, shall I list more?`;
                    response.shouldEndSession = false;
                    response.cardTitle = `Top 5 Phones`;
                    response.cardContent = `Here are top 5 phones based on the user ratings. \n ${cardText}`;
                    response.done();
                }
            });
    });

}


intentHandlers['ListMoreMobIntent'] = function (request, session, response, slots) {
    response.speechText = `Here are the next best phones. Reno 10x, OnePlus 7 Pro, Honor View 20, Asus Zenfone 6. which one are you interested in?`;
    response.shouldEndSession = false;
    response.done();
}

intentHandlers['AddItemToCartIntent'] = function (request, session, response, slots) {
    if (!session.attributes.product) {
        session.attributes.product = [];
    }
    var custCart = slots.custCart;
    var conn = new jsforce.Connection();
    conn.login(uname, pwd, function (err, res) {
        if (err) {
            return console.error(err);
        }

        conn.query(`SELECT Id, Price__c, Category__c, Model__c, Model_withoutUS__c, Brand__c, isFlagship__c, ScreenSize__c, Ram__c, Processor__c, Memory__c, Year__c FROM B2B_Products_Object__c where Model_withoutUS__c = '${custCart.replace(/ /g,'').toLowerCase()}'`,
            function (err, result) {
                if (err) {
                    return console.error(err, ret);
                } else {
                    var spechText, cardText;
                    if (result.totalSize == 0) {
                        spechText = `I cannot find and top orders for given period.`;
                        cardText = `I cannot find and top orders for given period.`;
                    } else {
                        session.attributes.product.push(result.records[0]);
                        spechText = `Ok. I added ${custCart} to your cart. Should proceed to checkout, or, add anything else? `;
                        cardText = "";
                    }
                    response.speechText = spechText;
                    response.shouldEndSession = false;
                    response.cardTitle = `Top 5 Phones`;
                    response.cardContent = `Here are top 5 phones based on the user ratings. \n ${cardText}`;
                    response.done();
                }
            });
    });
}

intentHandlers['OTPIntent'] = function (request, session, response, slots) {
    var otp = slots.otp;
    var reentry = 1;
    var data = session.attributes.product;
    console.log(session.attributes.product.length);
    console.log(JSON.stringify(data));
    if (!session.attributes.reentry) {
        session.attributes.reentry = reentry;
    }
    if (otp == '1234') {

        response.speechText = `Voice purchase Successful. I've texted you the details.`;
        var conn = new jsforce.Connection();
        conn.login(uname, pwd, function (err, res) {
            if (err) {
                console.log(err);
                return console.error(err);
            }
            conn.sobject("Alexa_Transaction__c").create({
                'Date_of_Purchase__c': new Date
            }, function (err, ret) {
                if (err || !ret.success) {
                    console.log(err);
                    return console.error(err, ret);
                }
                return ret;
            }).then((trxId) => {
                for (var i = 0; i < data.length; i++) {
                    console.log(data[i]);
                    conn.sobject("Alexa_Jn__c").create({
                        'Alexa_Transaction__c': `${trxId.id}`,
                        'B2B_Products_Object__c': `${data[i].Id}`
                    }, function (err, ret1) {
                        if (err || !ret1.success) {
                            console.log(err);
                            return console.error(err, ret1);
                        }
                        console.log(ret1);
                    }).then(() => {
                        response.shouldEndSession = true;
                        response.done();
                    })

                }
            }).catch(error => {
                console.log(error);

            });
        });

    } else {
        if (session.attributes.reentry <= 3) {

            response.speechText = `OTP doesn't match with the one sent. Please say the OTP.`;
            response.shouldEndSession = false;
            session.attributes.reentry += 1;
            response.done();
        } else {
            response.speechText = `Maximum tries reached. One of out customer service representativess shall get in touch with you shortly.`;
            response.shouldEndSession = false;
            session.attributes.reentry += 1;
            response.done();
        }
    }
}



intentHandlers['AMAZON.YesIntent'] = function (request, session, response, slots) {
    if (session.attributes.selectedPhone) {
        session.attributes.product.push(session.attributes.selectedPhone);
        session.attributes.selectedPhone = {};
        response.speechText = `Added. Should I proceed to checkout or do you want me to add more products your cart?`;
        response.reprompt = `Should I add it to your cart?`;
        response.shouldEndSession = false;
        response.done();
    }
}

intentHandlers['checkout'] = function (request, session, response, slots) {
    var arr = session.attributes.product;
    let counter = arr.reduce((acc, val) => (acc[val.Brand__c] = (acc[val.Brand__c] || 0) + 1, acc), {});
    let strings = Object.keys(counter).map(k => `${counter[k]} ${k}`);
    let sum = arr.reduce((sum, prod) => (sum = sum + parseInt(prod.Price__c)), 0);

    response.speechText = `You have ${strings.join(' and ')} ready to checkout. And the cart total is $${sum}. `;
    response.speechText += `For this transaction to be secure, I've Initiated a one time password. Please read it out.`;
    response.shouldEndSession = false;
    response.done();
}


intentHandlers['freeFormTextIntent'] = function (request, session, response, slots) {
    var freeFormTextSlot = slots.freeFormTextSlot;


    var conn = new jsforce.Connection();
    conn.login(uname, pwd, function (err, res) {
        if (err) {

            return console.error(err);
        }

        conn.query(`SELECT Id, Price__c, Category__c, Model__c, Model_withoutUS__c, Brand__c, isFlagship__c, ScreenSize__c, Ram__c, Processor__c, Memory__c, Year__c FROM B2B_Products_Object__c where Model_withoutUS__c = '${freeFormTextSlot.replace(/ /g,'').toLowerCase()}'`,
            function (err, result) {
                if (err) {
                    return console.error(err, ret);
                } else {
                    var speechText, cardText;
                    if (result.totalSize == 0) {
                        speechText = `I cannot find and top orders for given period.`;
                        cardText = `I cannot find and top orders for given period.`;
                    } else {
                        var res = result.records[0];
                        session.attributes.selectedPhone = res;
                        speechText = `${freeFormTextSlot} is `;
                        if (res.isFlagship__c === 'true')
                            speechText += ` a flagship model`;
                        speechText += ` by ${res.Brand__c},`;
                        speechText += ` released on ${res.Year__c}.`;
                        speechText += ` It is priced at $${res.Price__c}. Should I add it to your cart?`;
                        response.speechText = speechText;
                        response.reprompt = `Should I add it to your cart?`;
                        response.shouldEndSession = false;
                        response.done();
                    }

                }
            });
    });
}


intentHandlers['AMAZON.NoIntent'] = function (request, session, response, slots) {
    session.attributes.selectedPhone = {};
    response.speechText = `Ok. Item not added to cart. What do you want to add to your cart?`;
    response.shouldEndSession = false;
    response.done();
}

intentHandlers['AMAZON.CancelIntent'] = function (request, session, response, slots) {
    response.speechText = `Thank you for using our service. Have a good day!!!`;
    response.shouldEndSession = true;
    response.done();
}


intentHandlers['AMAZON.StopIntent'] = function (request, session, response, slots) {
    response.speechText = `Thank you for using our service. Have a good day!!!`;
    response.shouldEndSession = true;
    response.done();
}