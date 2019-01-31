console.log('this is loaded');

exports.spotify = {
  id: process.env.SPOTIFY_ID || null,
  secret: process.env.SPOTIFY_SECRET || null
};

exports.omdb = process.env.OMDB_KEY;

exports.tmdb = process.env.TMDB_KEY;

exports.bandsInTown = process.env.BANDSINTOWN_KEY;