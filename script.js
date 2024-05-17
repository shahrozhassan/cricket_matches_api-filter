const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

const PORT = 3001;
const baseURL = 'https://www.espncricinfo.com/';

async function extractTeamData(linkedPageData) {
    const team_1 = linkedPageData('span.ds-text-tight-l.ds-font-bold.ds-text-typo.hover\\:ds-text-typo-primary.ds-block.ds-truncate').first().text().trim();
    const team_2 = linkedPageData('.ds-text-tight-l.ds-font-bold.ds-text-typo.hover\\:ds-text-typo-primary.ds-block.ds-truncate').eq(1).text().trim();
    
    return { team_1, team_2 };
}

async function extractMatchStatus(linkedPageData) {
           // const match_status = linkedPageData('div.ds-text-raw-red strong.ds-uppercase.ds-text-tight-m').text().trim();
    const status = linkedPageData('.ds-flex p.ds-text-tight-s.ds-font-medium.ds-truncate.ds-text-typo span').text().trim();
    const match_status = linkedPageData('div.ds-text-raw-red strong.ds-uppercase.ds-text-tight-m').text().trim();
    const match_title = linkedPageData('div.ds-grow .ds-text-tight-m.ds-font-regular.ds-text-typo-mid3').first().text().trim(); 

     const team_1_Score = linkedPageData('div.ds-text-compact-m.ds-text-typo.ds-text-right.ds-whitespace-nowrap strong').first().text().trim();
     const team_1_score_split = team_1_Score.split('/');
     const team_1_overs = linkedPageData('div.ds-text-compact-m span').text().trim();
     const team_1_runs = team_1_score_split[0].trim();
     const team_1_wickets = team_1_score_split[1] ? team_1_score_split[1].trim() : ''; // Wickets
   

     const team_2_Score = linkedPageData('div.ds-text-compact-m.ds-text-typo.ds-text-right.ds-whitespace-nowrap strong').eq(1).text().trim();
    
     const team_2_score_split = team_2_Score.split('/');
     const team_2_runs = team_2_score_split[0].trim();
     const team_2_wickets = team_2_score_split[1]? team_2_score_split[1].trim() : '';
     const team_2_overs = linkedPageData('div.ds-text-compact-m span').text().trim();
    
     return {status,match_status,match_title,team_1_Score,team_1_score_split,team_1_overs,team_1_runs,team_1_wickets,
        team_2_Score,team_2_score_split,team_2_runs,team_2_wickets,team_2_overs
    };
}
async function extractBatsmenData(linkedPageData) {

     const batsman_1_name = linkedPageData('.ds-flex tbody.ds-text-right td.ds-min-w-max.ds-text-left.ds-flex.ds-items-center .ds-popper-wrapper.ds-inline').first().text().trim();
     const batsman_1_score = linkedPageData('td.ds-min-w-max.ds-text-typo strong').first().text().trim();
     const batsman_1_balls_played = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(2).text().trim();
     const batsman_1_fours = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(3).text().trim();
     const batsman_1_sixes = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(4).text().trim();
     const batsman_2_name = linkedPageData('.ds-flex tbody.ds-text-right td.ds-min-w-max.ds-text-left.ds-flex.ds-items-center .ds-popper-wrapper.ds-inline').eq(1).text().trim();
     const batsman_2_score = linkedPageData('td.ds-min-w-max.ds-text-typo strong').eq(1).text().trim();
     const batsman_2_balls_played = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(10).text().trim();
     const batsman_2_fours = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(11).text().trim();
     const batsman_2_sixes = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(12).text().trim();

    return { batsman_1_name, batsman_1_score,batsman_1_balls_played,batsman_1_fours,batsman_1_sixes,
        batsman_2_name,batsman_2_score,batsman_2_balls_played,batsman_2_fours,batsman_2_sixes
    };
}

async function extractBowlersData(linkedPageData) {       
    const bowler_1_name = linkedPageData('.ds-min-w-max.ds-text-left.ds-flex.ds-items-center.ds-border-none').first().text().trim();
    const bowler_1_overs_bowled = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(17).text().trim();
    const bowler_1_maiden = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(18).text().trim();
    const bowler_1_runs = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(19).text().trim();
    const bowler_1_wickets_taken = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(20).text().trim();

    const bowler_2_name = linkedPageData('.ds-min-w-max.ds-text-left.ds-flex.ds-items-center.ds-border-none').eq(1).text().trim();
    const bowler_2_overs_bowled = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(27).text().trim();
    const bowler_2_maiden = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(28).text().trim();
    const bowler_2_runs = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(29).text().trim();
    const bowler_2_wickets_taken = linkedPageData('tbody.ds-text-right tr.ds-border-none td.ds-min-w-max').eq(30).text().trim();

    return { bowler_1_name, bowler_1_overs_bowled,bowler_1_maiden,bowler_1_runs,bowler_1_wickets_taken,
        bowler_2_name,bowler_2_overs_bowled,bowler_2_maiden,bowler_2_runs,bowler_2_wickets_taken
    };
}

async function scrapeMatchData(baseURL, targetURL, teams) {
    try {
        const response = await axios.get(targetURL);
        const $ = cheerio.load(response.data);

        const anchorTags = $('a.ds-no-tap-higlight');
        const scrapedData = [];
        const uniqueMatches = new Set(); // Store unique match identifiers

        await Promise.all(anchorTags.map(async (i, element) => {
            try {
                const href = $(element).attr('href');
                const fullURL = new URL(href, targetURL).href;

                const linkedPageResponse = await axios.get(fullURL);
                const linkedPageData = cheerio.load(linkedPageResponse.data);

                const teamData = await extractTeamData(linkedPageData);
                if (teamData.team_1 && teamData.team_2 && teams.includes(teamData.team_1) && teams.includes(teamData.team_2)) {
                    const matchStatusData = await extractMatchStatus(linkedPageData);
                    const matchIdentifier = `${teamData.team_1}_${matchStatusData.team_1_Score}_${matchStatusData.team_1_wickets}_${teamData.team_2}_${matchStatusData.team_2_Score}_${matchStatusData.team_2_wickets}`;
                    
                    // Check if the match is already scraped
                    if (!uniqueMatches.has(matchIdentifier)) {
                        uniqueMatches.add(matchIdentifier); // Add match identifier to set
                        const batsmenData = await extractBatsmenData(linkedPageData);
                        const bowlersData = await extractBowlersData(linkedPageData);
                        const matchData = {
                            ...teamData,
                            ...matchStatusData,
                            ...batsmenData,
                            ...bowlersData
                        };
                        scrapedData.push(matchData);
                    }
                }
            } catch (error) {
                console.error('Error scraping linked page:', error);
            }
        }));

        return scrapedData;
    } catch (error) {
        console.error('Error fetching webpage:', error);
        return null;
    }
}

const targetURL = 'https://www.espncricinfo.com/live-cricket-score';

const teams = [
    "Afghanistan",
    "Australia",
    "Bangladesh",
    "Zimbabwe",
    "Canada",
    "England",
    "India",
    "Ireland",
    "Namibia",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Oman",
    "Pakistan",
    "Papua New Guinea",
    "Scotland",
    "South Africa",
    "Sri Lanka",
    "Uganda",
    "United States of America",
    "West Indies",
    "South Africa Women",
    "Australia Women",
    "India Under-19s",
    "Australia Under-19s",
    "Pakistan Under-19s",
    "Islamabad United",
    "Karachi Kings",
    "Lahore Qalandars",
    "Multan Sultans",
    "Peshawar Zalmi",
    "Quetta Gladiators",
    "Boost Region",
    "Speen Ghar Region",
    "Band-e-Amir Region",
    "Mis Ainak Region",
    "Amo Region",
    "Boost Region",
    "India Women",
    "Bangladesh Women"
];

scrapeMatchData(baseURL, targetURL, teams)
    .then(scrapedData => {
        const timestampedData = scrapedData.map(data => ({
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
            ...data
        }));
        fs.writeFile('match_data.json', JSON.stringify(timestampedData, null, 2), err => {
            if (err) {
                console.error('Error writing JSON file:', err);
            } else {
                console.log('Scraped data overwritten in match_data.json');
            }
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });


const jsonFilePath = path.join(__dirname, 'match_data.json');
app.get('/cricket', (req, res) => {
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).json({ error: 'Error reading data file' });
            return;
        }
        try {
            const cricket = JSON.parse(data);
            res.json(cricket);
        } catch (error) {
            res.status(500).json({ error: 'Error parsing JSON data' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
