#!/usr/bin/env node 

const https = require('https')
const fs = require('fs');

function searchJokesByTerm(term, callback){
    const options = {
        hostname: 'icanhazdadjoke.com',
        path: `/search?term=${term}`,
        method: 'GET',
        headers: {
            'Accept': 'application/json',
          }
    }
    let result = '';
    const req = https.request(options, res => {
        res.on('data', data => {
            result += data.toString()
        })
    })
    req.on('error', error => {
        console.error(error)
    })
    req.on('close', () => {
        result = JSON.parse(result).results;
        callback(result)
    })
    req.end()   
  }

function checkJokes(jokes){
    let msg = 'No jokes were found for that search term';
    if(jokes.length !== 0){
        const randomJoke = getRandomElement(jokes).joke
        msg = `Random joke: ${randomJoke}`
    }
    console.log(msg) // output random joke
    saveDataToJsonFile('jokes', jokes)
}

function saveDataToJsonFile(fileName, data){
    const file = fs.createWriteStream(`./${fileName}.json`)
    file.write(JSON.stringify(data, null, 4))
    file.end()
}

const getRandomElement = array => array[Math.floor(Math.random() * array.length)];

function getArgs () {
    const args = {};
    process.argv
        .slice(2, process.argv.length)
        .forEach( arg => {
            if (arg.slice(0,2) === '--') {
                args["longArgFlag"] = arg.slice(2, arg.length);
            }
            else {
                args["term"] = arg
            }
    });
    return args;
}

function start(){
    const args = getArgs();

    if(args["longArgFlag"] === 'searchTerm'){
        searchJokesByTerm(args["term"], checkJokes)
    } else if(args["longArgFlag"] == 'leaderboard'){
        console.log("leaderboard command")
    } else {
        console.log("Unknown command");
    }
}

start()