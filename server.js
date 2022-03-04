#!/usr/bin/env node 

const https = require('https')
const fs = require('fs');
const _ = require("lodash");
require('dotenv').config();

const FILE_NAME = 'jokes'
const FILE_EXTENSION = 'txt'

function executeCommand(command){
    const commands = {
        searchTerm: executeSearchTermCommand,
        leaderboard: executeLeaderboardCommand,
    }

    return commands[command]?.()
}

async function executeSearchTermCommand(){
    try {
        term = getArgs().term
        if(!term) throw new Error("Enter a term for searching")
    
        const randomJoke = await getRandomJokeByTerm(term)
        printRandomJoke(randomJoke.joke)
        appendJokeToFile(randomJoke, FILE_NAME, FILE_EXTENSION)
    } catch (error) {
        console.log(error.message)
    }
}

async function executeLeaderboardCommand(){
    try {
        const jokes = await getJokesFromFile(FILE_NAME, FILE_EXTENSION)
        const mostPopularJoke = getMostPopularJoke(jokes)

        printLeaderboard(mostPopularJoke)

    } catch (error) {
        console.log(error.message)
    }
}

const getRandomNumberByRange = range => Math.floor(Math.random() * range) + 1

async function getRandomJokeByTerm(term){
    if(!term) throw new Error('Incorrect term!')

    const jokesMetadata = await getJokesMetadataByTerm(term)
    if(jokesMetadata.results.length === 0) throw new Error('Joke was not found')

    const randomPage = getRandomPage(jokesMetadata.total_pages)
    const randomNumberFromPage = getRandomNumberFromPage(jokesMetadata)
    const jokes = await getJokesFromPageByTerm(term, randomPage)
    const randomJoke = jokes[randomNumberFromPage];

    return randomJoke
}

function getRandomPage(totalPages) {
    if(!totalPages) throw new SyntaxError('Incorrect total pages value')

    if(totalPages === 1) return 1

    return getRandomNumberByRange(totalPages)
}

function getRandomNumberFromPage(metadata) {
    if(!metadata) throw new SyntaxError('Incorrect metadata')

    if(metadata.total_pages === 1) return getRandomNumberByRange(metadata.total_jokes-1)

    return getRandomNumberByRange(metadata.limit)
}

function printRandomJoke(randomJokeText){
    if(!randomJokeText) throw new Error('Random joke is null')

    console.log(`Random joke: ${randomJokeText}`)
}

function printLeaderboard(mostPopularJokeText){
    if(!mostPopularJokeText) throw new Error('The most popular joke is null')

    console.log(`The most popular joke: ${mostPopularJokeText}`)
}

async function getJokesMetadataByTerm(term){
    if(!term) throw new Error('Incorrect term!')

    const apiPath = `/search?term=${term}`
    const jokesMetadata = await getDataFromApi(apiPath)

    return jokesMetadata
}

async function getJokesFromPageByTerm(term, jokeApiPage){
    if(!term) throw new Error('Incorrect term!')

    const apiPath = `/search?term=${term}&page=${jokeApiPage}`
    const jokes = (await getDataFromApi(apiPath)).results
    
    return jokes
}

function getDataFromApi(apiPath){
    if(!apiPath) throw new Error('Incorrect path!')

    const options = {
        hostname: process.env.HOSTNAME,
        path: apiPath,
        method: 'GET',
        headers: {
            'Accept': 'application/json',
          }
    }

    const result = new Promise((resolve, reject) => {
        const request = https.request(options, res => {
            let resultData = ''
            res.on('data', data => {
                resultData += data.toString()
            })
            res.on('error', error => {
                reject(error)
            })
            res.on('end', () => {
                try{
                    resolve(JSON.parse(resultData))
                } catch (error){
                    console.log(error.message)
                }
            })
        })  
        request.end()
    })

    return result
}

const getFormattedJoke = unformattedJoke => `${unformattedJoke.id}|${unformattedJoke.joke}\n`

function getUnformattedJoke(formattedJoke){
    if(!formattedJoke) throw new SyntaxError("Incorrect value")

    const jokeData = formattedJoke.split('|')
    const unformattedJoke = {
        id: jokeData[0],
        joke: jokeData[1]
    }

    return unformattedJoke
}

function getUnformattedJokesArray(formattedJokes){
    if(!formattedJokes) throw new SyntaxError("Incorrect jokes value")

    let unformattedJokes = []
    formattedJokes
        .split('\n')
        .forEach(formattedJoke => {
            if(formattedJoke){
                unformattedJokes.push(getUnformattedJoke(formattedJoke))
            }
        })
    return unformattedJokes
}

function appendJokeToFile(joke, fileName, fileExtension){
    if(!joke || !fileName, !fileExtension) throw new SyntaxError('Incorrect value')

    const formattedJoke = getFormattedJoke(joke)
    appendDataToFile(formattedJoke, fileName, fileExtension)
}

function appendDataToFile(data, fileName, fileExtension){
    const filePath = `${fileName}.${fileExtension}`

    fs.appendFile(filePath, data, function (error) {
        if (error) throw error;
    });

}

async function getJokesFromFile(fileName, fileExtension){
    if(!fileName || !fileExtension) throw new SyntaxError('Incorrect file info')

    const formattedJokes = await getDataFromFile(fileName, fileExtension)
    const unformattedJokes = getUnformattedJokesArray(formattedJokes)

    return unformattedJokes
}

function getDataFromFile(fileName, fileExtension){
    if(!fileName || !fileExtension) throw new SyntaxError('Incorrect file info')

    const result = new Promise((resolve, reject) => {
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

    return result
}

function getMostPopularJoke(jokes){
    let jokesTexts = jokes.map(element => element.joke)

    return getMostPopularElement(jokesTexts)
}

function getMostPopularElement(array){
    if(!array || !Array.isArray(array)) throw new SyntaxError('Incorrect value')

    const mostPopularElement = _.head(_(array)
        .countBy()
        .entries()
        .maxBy(_.last));

    return mostPopularElement
}

function getArgs () {
    const args = {};
    process.argv
        .slice(2, process.argv.length)
        .forEach(arg => {
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
    const command = getArgs().longArgFlag
    executeCommand(command)
}

main()