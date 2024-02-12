const tmi = require("tmi.js");
const config = require("./data/config.json");
const fs = require('fs');

const client = new tmi.Client({
    options: {
      debug: true,
    },
    connection: {
      reconnect: true,
      secure: true,
    },
    identity: config.identify,
  
    channels: config.channels,
  });


let gameStarted = false;
let questions = [];
let currentQuestionIndex = 0;
let attemptsLeft = 3; // Anzahl versuche (anpassbar) [Default: 3]


client.on('message', (channel, tags, message, self) => {
    if (self) return; 
    const command = message.split(" ")[0]; 
    if (command === "!start") {
        if (!gameStarted) {
            gameStarted = true;
            loadQuestions();
            sendQuestion(channel);
        } else {
            client.say(channel, "Das Spiel läuft bereits!");
        }
    }

    if (command === "!stop") {
        if (gameStarted) {
            gameStarted = false;
            client.say(channel, `Das Spiel wurde vorzeitig beendet!`);
        } else {
            client.say(channel, `Es läuft derzeit kein Spiel!`);
        }
    }

    if (gameStarted && command === "!answer") {
        const answer = message.slice("!answer".length).trim();
        checkAnswer(channel, answer, tags.username);
    }
});

function loadQuestions() {
    questions = JSON.parse(fs.readFileSync('questions.json', 'utf8'));
}

function sendQuestion(channel) {
    if (currentQuestionIndex < questions.length) {
        client.say(channel, `Frage ${currentQuestionIndex + 1}: ${questions[currentQuestionIndex].question}`);
    } else {
        client.say(channel, "Das Quiz ist vorbei!");
    }
}

function checkAnswer(channel, answer, username) {
    if (currentQuestionIndex < questions.length && attemptsLeft > 0) {
        const correctAnswer = questions[currentQuestionIndex].answer.toLowerCase();
        if (answer.toLowerCase() === correctAnswer) {
            client.say(channel, `Richtig, ${username}! ${correctAnswer} war die richtige Antwort!`);
            currentQuestionIndex++;
            sendQuestion(channel);
        } else {
            attemptsLeft--;
            if (attemptsLeft === 0) {
                client.say(channel, `Falsch, ${username}. Die richtige Antwort war ${correctAnswer}. Keine Versuche mehr übrig.`);
                currentQuestionIndex++;
                sendQuestion(channel);
            } else {
                client.say(channel, `Falsch, ${username}. Versuche es erneut! Du hast noch ${attemptsLeft} Versuche übrig.`);
            }
        }
    }
}

  client.connect().catch(console.error);