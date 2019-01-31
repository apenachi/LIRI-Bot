'use strict';
// read-set env vars
require("dotenv").config();

// import modules
const fs = require('fs');
const inquirer = require('inquirer');
const axios = require("axios");
const moment = require('moment');
const Spotify = require('node-spotify-api');

// import keys from the env
const keys = require('./keys.js');
const spotify = new Spotify(keys.spotify);
const omdbKey = keys.omdb;
const tmdbKey = keys.tmdb;
const bandsInTown = keys.bandsInTown;
//console.log(keys);

// declare some global vars
let command;
let keyword;
let printOutput;

const surpriseFile = 'random.txt'
const logFile = 'log.txt';

// Build Question list
const questionsArray = [{
        'main': 'Concert',
        'followup': 'What is the artist/band name?'
    },
    {
        'main': 'Song',
        'followup': 'What is the song name?'
    },
    {
        'main': 'Movie',
        'followup': 'What is the movie name?'
    },
    {
        'main': 'Surprise me',
        'followup': ''
    }
];
// console.log(questionsArray.map(a => a.main));
// console.log(questionsArray.map(a => a.followup));

// Ask for user preference
inquirer
    .prompt([{
        type: 'rawlist',
        name: 'command',
        message: 'What can I help you search for?',
        choices: questionsArray.map(a => a.main)
    }])
    .then(mainAnswer => {
        command = Object.values(mainAnswer).toString();

        if (questionsArray.find(o => o.main === command).followup !== '') {
            inquirer
                .prompt([{
                    type: 'input',
                    name: 'keyword',
                    message: questionsArray.find(o => o.main === command).followup,
                    validate: function validateAnswer(name) {
                        return name !== '';
                    }
                }]).then(followupAnswer => {
                    keyword = Object.values(followupAnswer).toString();
                    callAPI(command, keyword);
                });
        } else {
            surpriseUser();
        }
    });

// Driver fx
const callAPI = (command, keyword) => {
    console.log(`Calling API for ${command}`);

    switch (command) {
        case 'Concert':
        case 'concert-this':
            logSearches(command, keyword);
            callBandsInTown(command, keyword);
            break;
        case 'Song':
        case 'spotify-this-song':
            logSearches(command, keyword);
            callSpotify(command, keyword);
            break;
        case 'Movie':
        case 'movie-this':
            logSearches(command, keyword);
            callOMDB(command, keyword);
            break;
        default:
            console.warn('Please choose a valid command');
    };
};

// Bands In Town API call fx
const callBandsInTown = (command, keyword) => {
    axios.get(`https://rest.bandsintown.com/artists/${keyword}/events?`, {
            params: {
                app_id: bandsInTown
            }
        })
        .then((response) => {
            //console.log(response.data);
            printOutput = `\n\n***********************************`;
            printOutput += `\nHere's the upcoming Concert(s) list`
            printOutput += `\n***********************************`;
            response.data.forEach((element) => {
                printOutput += `\n-----------------------------------`;
                printOutput += `\nVenue Name: ${element.venue.name}`;
                printOutput += `\nLocation: ${element.venue.city}${element.venue.region !== '' ? + `' - ' ` + element.venue.region : ''}, ${element.venue.country}`;
                printOutput += `\nDate: ${moment(element.datetime).format('MM/DD/YYYY')}`;
                printOutput += `\n-----------------------------------`;
            });
            console.log(printOutput);
        })
        .catch((err) => {
            console.error(`Bands in Town API ${err}`);
        });
};

// Spotify API call fx
const callSpotify = (command, keyword) => {
    spotify
        .search({
            type: 'track',
            query: keyword,
            limit: 10
        })
        .then((response) => {
            //console.log(response.tracks.items);
            printOutput = `\n\n***********************************`;
            printOutput += `\nHere's the Song(s) list`
            printOutput += `\n***********************************`;
            response.tracks.items.forEach((element) => {
                printOutput += `\n-----------------------------------`;
                printOutput += `\nArtist(s): ${element.artists.map(a => a.name).join()}`;
                printOutput += `\nSong: ${element.name}`;
                printOutput += `\nLink: ${element.preview_url}`;
                printOutput += `\nAlbum: ${element.album.name}`;
                printOutput += `\n-----------------------------------`;
            });
            console.log(printOutput);
        })
        .catch((err) => {
            console.error(`Spotify API ${err}`);
        });
};

// TMDB API call fx
// const callTMDB = (command, keyword) => {
//     axios.get(`https://api.themoviedb.org/3/search/movie?`, {
//             params: {
//                 api_key: tmdbKey,
//                 query: keyword
//             }
//         })
//         .then( (response) => {
//             console.log(response.data.results);
//         })
//         .catch( (err) => {
//             console.error(`TMDB API ${err}`);
//         });
// };

// OMDB API call fx
const callOMDB = (command, keyword) => {
    axios.get(`https://www.omdbapi.com/?`, {
            params: {
                apikey: omdbKey,
                t: keyword
            }
        })
        .then((response) => {
            //console.log(response.data);
            printOutput = `\n***********************************`;
            printOutput += `\nHere's the Movie info`
            printOutput += `\n***********************************`;
            printOutput += `\n-----------------------------------`;
            printOutput += `\nTitle: ${response.data.Title}`;
            printOutput += `\nYear: ${response.data.Year}`;
            printOutput += `\nIMDB Rating: ${response.data.Ratings.find( a => a.Source === 'Internet Movie Database') ? response.data.Ratings.find( a => a.Source === 'Internet Movie Database').Value : 'N/A'}`
            printOutput += `\nRotten Tomatoes Rating: ${response.data.Ratings.find( a => a.Source === 'Rotten Tomatoes') ? response.data.Ratings.find( a => a.Source === 'Rotten Tomatoes').Value : 'N/A'}`
            printOutput += `\nCountry: ${response.data.Country}`;
            printOutput += `\nLanguage: ${response.data.Language}`;
            printOutput += `\nPlot: ${response.data.Plot}`;
            printOutput += `\nActors: ${response.data.Actors}`;
            printOutput += `\n-----------------------------------`;
            console.log(printOutput);
        })
        .catch((err) => {
            console.error(`OMDB API ${err}`);
        });
};

// Surprise user fx
const surpriseUser = () => {
    fs.readFile(surpriseFile, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
        } else {
            let randomArray = data.split('\r\n');
            let randomCMDArray = [];
            let randomKWArray = [];
            randomArray.forEach((element) => {
                randomCMDArray.push(element.split(',')[0])
                randomKWArray.push(element.split(',')[1])
            });
            let possibleCMDArray = ['concert-this', 'spotify-this-song', 'movie-this'];
            let areAllValidCMDs = randomCMDArray.every((val) => possibleCMDArray.includes(val))
            if (areAllValidCMDs) {
                randomArray.forEach((element, index) => {
                    callAPI(randomCMDArray[index], randomKWArray[index].replace(/["']/g, ''))
                });
            } else {
                console.error(`${surpriseFile} has invalid commands!`)
            }
        }
    })
}

// Logging fx
const logSearches = (command, keyword) => {
    // Create log file if it does not exist
    fs.access(logFile, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(
                `${logFile} does not exist`);
                fs.writeFile(logFile, `${moment().format('MM/DD/YYYY h:mm:ss a')} : Captain's Log`, (err) => {
                    if (err) {
                        console.error(err);
                    }
                console.log(`${logFile} is created`);
            });
        }
    });

    // Append search queries
    const text = `\n${moment().format('MM/DD/YYYY h:mm:ss a')} : Search Option = ${command} | Search Keyword = ${keyword}`
    fs.appendFile(logFile, text, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Your query is logged`);
        }
    });
}
