#!/usr/bin/env node 

const https = require('https')
const fs = require('fs');

const FILE_NAME = 'jokes'
const FILE_EXTENSION = 'txt'

function searchJokesByTerm(term, page = 1){
    const options = {
        hostname: 'icanhazdadjoke.com',
        path: `/search?term=${term}&page=${page}`,
        method: 'GET',
        headers: {
            'Accept': 'application/json',
          }
    }
    let result = '';
    return new Promise((resolve, reject) => {
        const request = https.request(options, res => {
            res.on('data', data => {
                result += data.toString()
            })
            res.on('error', error => {
                reject(error)
            })
            res.on('end', () => {
                resolve(JSON.parse(result))
            })
        })  
        request.end()
    })  
  }

function findRandomJoke(jokesInfo){
    if(jokesInfo.total_jokes !== 0){
        const jokeNumber = Math.floor(Math.random() * jokesInfo.total_jokes) + 1;
        const jokePage = Math.floor(jokeNumber / jokesInfo.limit + 1)
        const jokeIndex = jokeNumber % jokesInfo.limit - 1;
        return { jokePage, jokeIndex }
    } else {
        return 
        console.log('No jokes were found for that search term')
    }
}


function getFormattedJokesArray(array) {
    let formattedArray = '';
    array.forEach(elem => formattedArray += `${elem.id}|${elem.joke}\n`)
    return formattedArray;
}

function getUnformattedJokesArray(formattedArray){

    if(formattedArray == false){
        return;
    }
    let array = []
    formattedArray.split('\n').forEach(elem => {
        const joke = elem.split('|')
        array.push({
            id: joke[0],
            joke: joke[1]
        })
    })

    return array
}

function saveDataToFile(data, fileName, fileExtension){
    const file = fs.createWriteStream(`./${fileName}.${fileExtension}`)
    file.write(data)
    file.end()
}

async function getDataFromFile(fileName, fileExtension){
    return new Promise((resolve, reject) => {
        const file = fs.createReadStream(`./${fileName}.${fileExtension}`);
        let data = ''
        file.on('data', d => {
            data += d;
        })
        file.on('end', () => {
            let result;
            if(data != false){
                result = data
            }
            resolve(result)
        })
        file.on('error', err => {
            reject(err)
        })
    })
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

    return data.find(elem => elem.id === mostPopularElement[0])
}

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

async function main(){
    const args = getArgs();
    const longArgFlag = args.longArgFlag

    if(longArgFlag === 'searchTerm'){
        if(args.term){
            try {
                const term = args.term
                let jokesInfo = await searchJokesByTerm(term)
                const { jokeIndex, jokePage } = findRandomJoke(jokesInfo) || {}
                if(jokeIndex !== undefined || jokePage !== undefined){
                    const jokes = (await searchJokesByTerm(term, jokePage)).results
                    const randomJokeData = jokes[jokeIndex];
                    console.log(`Random joke: ${randomJokeData.joke}}`)
                    const dataFromFile = await getDataFromFile(FILE_NAME, FILE_EXTENSION);
                    const oldJokes = getUnformattedJokesArray(dataFromFile)
                    console.log(oldJokes)
                    let data;
                    if(oldJokes !== undefined){
                        data = [...oldJokes, randomJokeData]
                    } else {
                        data = new Array(randomJokeData)
                    }
                    saveDataToFile(getFormattedJokesArray(data), FILE_NAME, FILE_EXTENSION)
                }
            } catch(error) {
                console.error(error)
            }
        } else {
            console.log('You should enter a term')
        }
    } else if(longArgFlag === 'leaderboard'){
        try{
            const jokes = getUnformattedJokesArray(await getDataFromFile(FILE_NAME, FILE_EXTENSION));
            let msg = 'Jokes.json is empty';
            if(jokes !== undefined){
                const mostPopularJoke = findMostPopularElement(jokes).joke;
                msg = `The most popular joke: ${mostPopularJoke}`
            }
            console.log(msg);
            
        } catch(error){
            console.error(error)
        }
    } else {
        console.log("Unknown command");
    }
}

main()