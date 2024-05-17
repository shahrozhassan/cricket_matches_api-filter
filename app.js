document.addEventListener('DOMContentLoaded', () => {
    const teams = [
        "Afghanistan", "Australia", "Bangladesh", "Zimbabwe", "Canada", "England", "India", 
        "Ireland", "Namibia", "Nepal", "Netherlands", "New Zealand", "Oman", "Pakistan", 
        "Papua New Guinea", "Scotland", "South Africa", "Sri Lanka", "Uganda", 
        "United States of America", "West Indies", "South Africa Women", "Australia Women", 
        "India Under-19s", "Australia Under-19s", "Pakistan Under-19s", "Islamabad United", 
        "Karachi Kings", "Lahore Qalandars", "Multan Sultans", "Peshawar Zalmi", 
        "Quetta Gladiators", "Boost Region", "Speen Ghar Region", "Band-e-Amir Region", 
        "Mis Ainak Region", "Amo Region", "India Women", "Bangladesh Women"
    ];

    fetch('match_data.json')
        .then(response => response.json())
        .then(data => {
            populateSelectors(teams);
            displayMatchData(data);
            
            document.getElementById('filterButton').addEventListener('click', () => {
                const team1 = document.getElementById('team1').value;
                const team2 = document.getElementById('team2').value;
                const filteredData = filterMatches(data, team1, team2);
                displayMatchData(filteredData);
            });
        })
        .catch(error => console.error('Error fetching the JSON data:', error));
});

function populateSelectors(teams) {
    const team1Selector = document.getElementById('team1');
    const team2Selector = document.getElementById('team2');

    teams.forEach(team => {
        const option1 = document.createElement('option');
        option1.value = team;
        option1.textContent = team;
        team1Selector.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = team;
        option2.textContent = team;
        team2Selector.appendChild(option2);
    });
}

function filterMatches(data, team1, team2) {
    return data.filter(match => 
        (match.team_1 === team1 && match.team_2 === team2) || 
        (match.team_1 === team2 && match.team_2 === team1)
    );
}

function displayMatchData(data) {
    const container = document.getElementById('match-container');
    container.innerHTML = ''; // Clear previous content

    if (data.length === 0) {
        container.innerHTML = '<p>No matches found for the selected teams.</p>';
        return;
    }

    data.forEach(match => {
        const matchDiv = document.createElement('div');
        matchDiv.classList.add('match-item');

        const matchString = `
            ${match.team_1} vs ${match.team_2} ${match.match_title.split(',')[0]}
            ${match.team_1} ${match.team_1_Score} over ${match.team_1_overs.split(' ')[1]}
            ${match.batsman_1_name} ${match.batsman_1_score} (${match.batsman_1_balls_played})
            ${match.batsman_2_name} ${match.batsman_2_score} (${match.batsman_2_balls_played})
            ${match.bowler_1_name} ${match.bowler_1_wickets_taken}/${match.bowler_1_runs}, ${match.bowler_2_name} ${match.bowler_2_wickets_taken}/${match.bowler_2_runs}
            ${match.status}
        `;

        matchDiv.textContent = matchString.trim().replace(/\n\s+/g, '\n');
        container.appendChild(matchDiv);
    });
}
