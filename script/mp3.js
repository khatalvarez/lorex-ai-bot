module.exports.config = {
  name: 'mp3',
  version: '1.1.14',
  role: 0,
  hasPrefix: true,
  aliases: ['music', 'searchmp3'],
  description: 'Search for songs, fetch song URL, fetch lyrics, and play in the voice channel',
};

const axios = require('axios');
const { MessageAttachment } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ffmpeg = require('fluent-ffmpeg');  // Used to stream .m3u8 file

module.exports.run = async (bot, message, args) => {
  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) {
    return message.reply("You need to join a voice channel first!");
  }

  // Check for a search term (query)
  const query = args.join(' ');
  if (!query) {
    return message.reply("Please provide a song or stream name to search for.");
  }

  try {
    // Fetch song data using the search query
    const songData = await searchSong(query);

    // If no songs are found
    if (!songData || songData.length === 0) {
      return message.reply("Sorry, no songs found for your search.");
    }

    // Send the song search results to the channel
    let songList = '';
    songData.forEach((song, index) => {
      songList += `${index + 1}. **${song.title}**\nID: ${song.id}\nImage: ${song.img}\n\n`;
    });

    message.channel.send(`Here are the search results for your query: **${query}**\n\n${songList}`);

    // Ask user to choose a song from the list
    message.channel.send('Please type the number of the song you want to play (e.g., 1, 2, 3, etc.)');

    // Wait for the user to pick a song
    const filter = (response) => !isNaN(response.content) && response.content > 0 && response.content <= songData.length;
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });

    const songChoice = parseInt(collected.first().content) - 1;
    const selectedSong = songData[songChoice];

    // Fetch the URL for the selected song and lyrics
    const songDetails = await fetchSongDetails(selectedSong.id);
    const lyricsData = await fetchLyrics(selectedSong.title);

    // Prepare the lyrics to display (truncate if too long)
    const lyricsText = lyricsData ? lyricsData : "Lyrics not available.";

    // Send song info and lyrics to the channel
    message.channel.send(`Now playing: **${selectedSong.title}**\nURL: ${songDetails.url}\n\n**Lyrics**:\n${lyricsText}`);

    // Play the song or stream in the voice channel
    playStream(songDetails.url, voiceChannel);

  } catch (error) {
    console.error(error);
    message.reply("Something went wrong while searching for the song.");
  }
};

async function searchSong(query) {
  try {
    // Fetch song data from the API using the search query
    const response = await axios.get(`https://musicapi.x007.workers.dev/search`, {
      params: {
        q: query,  // Search query
        searchEngine: 'gaama',  // Specify search engine (you can adjust if needed)
      },
    });

    // Check if the response contains valid song data
    if (response.data && response.data.response) {
      return response.data.response;  // Returns an array of song results
    } else {
      throw new Error('No songs found');
    }
  } catch (error) {
    console.error("Error searching songs:", error);
    throw error;
  }
}

async function fetchSongDetails(songId) {
  try {
    // Fetch song details using the song ID
    const response = await axios.get(`https://musicapi.x007.workers.dev/fetch`, {
      params: {
        id: songId,  // Song ID to fetch the URL
      },
    });

    // Check if the response contains a valid URL
    if (response.data && response.data.response) {
      return {
        url: response.data.response,  // The song URL (MP3 or HLS)
        title: response.data.title || 'Unknown Song',
      };
    } else {
      throw new Error('Song details not found');
    }
  } catch (error) {
    console.error("Error fetching song details:", error);
    throw error;
  }
}

async function fetchLyrics(songTitle) {
  try {
    // Fetch lyrics for the song using the song's title
    const response = await axios.get(`https://musicapi.x007.workers.dev/lyrics`, {
      params: {
        q: songTitle,  // Song title to get the lyrics
      },
    });

    // Check if the response contains valid lyrics data
    if (response.data && response.data.response) {
      return response.data.response;  // Lyrics returned as HTML string
    } else {
      throw new Error('Lyrics not found');
    }
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    return null;
  }
}

async function playStream(url, voiceChannel) {
  try {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    // Create an audio player to play the stream
    const player = createAudioPlayer();

    // Check if the URL is an HLS stream (.m3u8) or a direct MP3 URL
    if (url.endsWith('.m3u8')) {
      // Handle HLS Stream (.m3u8) using ffmpeg
      const resource = createAudioResource(
        ffmpeg(url)
          .format('mp3')  // Convert the HLS stream to MP3
          .audioBitrate(128)
          .toFormat('mp3')
          .pipe(),  // Pipe the output of ffmpeg directly into the audio resource
        {
          inputType: 'arbitrary',
        }
      );
      player.play(resource);
    } else {
      // Handle Direct MP3 URL
      const resource = createAudioResource(url, {
        inputType: 'unknown',  // Can handle various formats (MP3, OGG, etc.)
      });
      player.play(resource);
    }

    // Once the player starts playing, handle events
    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy(); // Leave the voice channel when done
    });

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      connection.destroy(); // Ensure the connection is destroyed if disconnected
    });

    connection.subscribe(player); // Subscribe the player to the voice connection

  } catch (error) {
    console.error("Error joining the voice channel or playing the stream:", error);
    voiceChannel.leave();
  }
}
