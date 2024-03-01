const tmi = require("tmi.js");
const config = require("./data/secret_data/config.json");
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
        startGame(channel);
    } else if (command === "!stop") {
        stopGame(channel);
    } else if (gameStarted && command === "!answer") {
        const answer = message.slice("!answer".length).trim();
        checkAnswer(channel, answer, tags.username);
    } else if (gameStarted && command === "!skipquestion" && (tags.mod || tags.username.toLowerCase() === channel.replace("#", ""))) {
        skipQuestion(channel, tags.username);
    } else if (gameStarted && command === "!currentquestion") {
        sendCurrentQuestion(channel);
    }
});

function startGame(channel) {
    if (!gameStarted) {
        gameStarted = true;
        loadQuestions();
        sendQuestion(channel);
    } else {
        client.say(channel, "Das Spiel läuft bereits!");
    }
}

function stopGame(channel) {
    if (gameStarted) {
        gameStarted = false;
        client.say(channel, `Das Spiel wurde vorzeitig beendet!`);
    } else {
        client.say(channel, `Es läuft derzeit kein Spiel!`);
    }
}

function loadQuestions() {
    questions = JSON.parse(fs.readFileSync('data/questions.json', 'utf-8'));
    shuffleArray(questions);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function sendQuestion(channel) {
    if (currentQuestionIndex < questions.length) {
        client.say(channel, `Frage ${currentQuestionIndex + 1}: ${questions[currentQuestionIndex].question}`);
    } else {
        client.say(channel, "Das Quiz ist vorbei!");
    }
}

function checkAnswer(channel, answer, username) {
    if (!answer.trim()) {
        client.say(channel, `Bitte gib eine Antwort ein, ${username}!`);
        return;
    }

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

function skipQuestion(channel, username) {
    if (attemptsLeft > 0 ) {
        
    currentQuestionIndex++;
    attemptsLeft--;
    client.say(channel, `${username} hat eine Frage übersprungen! ${attemptsLeft} Versuche zum Überspringen übrig!`);
    sendQuestion(channel);
    } else {
        client.say(channel, `Du hast bereits alle Versuche für das Überspringen von Fragen aufgebraucht || ${username} ||`)
    }
}

function sendCurrentQuestion(channel) {
    if (currentQuestionIndex < questions.length) {
        client.say(channel, `Aktuelle Frage: ${questions[currentQuestionIndex].question} `);
    } else {
        client.say(channel, "Es gibt keine aktuelle Frage.");
    }
}

client.connect().catch(console.error);
