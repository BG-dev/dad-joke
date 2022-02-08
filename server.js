#!/usr/bin/env node 

const https = require('https')
const fs = require('fs');

const FILE_NAME = 'jokes'

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

function checkJokesData(jokes){
    let msg = 'No jokes were found for that search term';
    if(jokes.length !== 0){
        const randomJoke = getRandomElement(jokes).joke
        msg = `Random joke: ${randomJoke}`
    }
    console.log(msg) // output random joke
    getDataFromJsonFile(FILE_NAME, uploadDataInJsonFile.bind(null, jokes, FILE_NAME))
}

function saveDataToJsonFile(data, fileName){
    const file = fs.createWriteStream(`./${fileName}.json`)
    file.write(JSON.stringify(data, null, 4))
    file.end()
}

function getDataFromJsonFile(fileName, callback){
    const file = fs.createReadStream(`./${fileName}.json`);
    let data = ''
    file.on('data', d => {
        data += d;
    })

    file.on('close', () => {
        data = JSON.parse(data)
        callback(data);
    })
}

function uploadDataInJsonFile(newData, fileName, data){
    let updatedData = newData
    if(data != false){
        updatedData = [...data, ...newData]
    }
    saveDataToJsonFile(updatedData, fileName)
}

function findMostPopularElement(data){
    let map = new Map();
    data.forEach(elem => {
        if(map.has(elem.id)){
            map.set(elem.id, map.get(elem.id) + 1)
        } else{
            map.set(elem.id, 1)
        }
    })
    
    const mostPopularElement = Array.from(map).sort((a,b) => b[1] - a[1])[0];
    console.log(data.find(elem => elem.id === mostPopularElement[0]).joke);
}


const getRandomElement = array => array[Math.floor(Math.random() * array.length)];

function getArgs () {
    const args = {};
    process.argv
        .slice(2, process.argv.length)
        .forEach( arg => {
            if (arg.slice(0,2) === '--') {
                args.longArgFlag = arg.slice(2, arg.length);
            }
            else {
                args.term = arg
            }
    });
    return args;
}

function main(){
    const args = getArgs();
    const longArgFlag = args.longArgFlag

    if(longArgFlag === 'searchTerm'){
        if(args.term){
            searchJokesByTerm(args.term, checkJokesData)
        } else {
            console.log('You should enter a term')
        }
    } else if(longArgFlag === 'leaderboard'){
        getDataFromJsonFile(FILE_NAME, findMostPopularElement);
    } else {
        console.log("Unknown command");
    }
}

main()