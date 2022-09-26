const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const { Octokit } = require('@octokit/rest');


try {
    // Get the issue body of which triggered this event
    const issueBody = github.context.payload.issue.body;


    // Get value inbetween "</summary>"" and "</details>"" tags by splitting
    var issueBodyDetails = issueBody.split("</summary>")[1].split("</details>")[0];

    // Remove codeblock in markdown
    issueBodyDetails = issueBodyDetails.replace(/```/g, "");

    // Trim "json" at the beginning of the string
    issueBodyDetails = issueBodyDetails.trim().substring(4);


    console.log(issueBodyDetails);
    // TODO Verify the JSON is valid and isnt fucking up stuff

    if (issueBodyDetails.length < 2000) {
        // Verify the json fields are valid

        /*var newJson = {
            "teamName": json.teamName,
        }*/

    } else {
        core.setFailed("The issue body is too long. Please shorten it to 2000 characters or less.");
        //return; 
    }

    const jsonObject = JSON.parse(issueBodyDetails);


    var dataFile = "data.json";
    fs.readFile(dataFile, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        var content = data;

        console.log("data.json: " + content);

        var jsonData = JSON.parse(content);

        jsonData.push(jsonObject);

        var jsonContent = JSON.stringify(jsonData);

        // Write the file back to github and commit the changes
        /*fs.writeFile(dataFile, jsonContent, 'utf8', (err) => {
            if (err) {
                console.error(err);
                return;
            }
        });*/


        // Create markdown leaderboard table for each project 
        var markdownTable = "# ETH Compiler Design HS22 Leaderboard\n\n";
        // Get best score for each time in each project and order by score

        // Get all projects
        var publishedProjectIds = [1]; // TODO add peridically the other projectIds

        for (var i = 0; i < publishedProjectIds.length; i++) {
            var projectName = "n/a";
            var projectId = publishedProjectIds[i];
            switch (projectId) {
                case 1:
                    projectName = "Hellocaml";
                    break;
                case 2:
                    projectName = "x86Lite";
                    break;
                case 3:
                    projectName = "Compiling LLVM";
                    break;
                case 4:
                    projectName = "Compiling Oat v.1";
                    break;
                case 5:
                    projectName = "Compiling Full Oat";
                    break;
                case 6:
                    projectName = "Dataflow Analysis and Register Allocation";
                    break;

                default:
                    projectName = "undefined";
                    break;

            }

            markdownTable += "## " + projectName + "\n\n";

            // Get all teams
            var teams = [];
            for (var i = 0; i < jsonData.length; i++) {
                var team = jsonData[i].teamName;
                if (!teams.includes(team)) {
                    teams.push(team);
                }
            }

            // Loop trough data


            // Get best score for each team in each project
            var bestScores = [{ projectId: -1, teamName: "n/a", score: 0 }];
            for (var i = 0; i < jsonData.length; i++) {
                var projects = jsonData[i].projects;
                var currentProject = projects.find(x => x.projectId == projectId);
                if (currentProject != undefined) {
                    continue; // Skip if the team didnt submit a score for this project
                }

                // Find if ther exits a bestScore for the currentTeam
                var currentTeam = jsonData[i].teamName;
                var currentScore = currentProject.score;
                var bestScore = bestScores.find(x => x.teamName == currentTeam);
                if (bestScore == undefined) {
                    bestScores.push({
                        projectId: projectId,
                        teamName: currentTeam,
                        score: currentScore,
                        passing: currentProject.passing,
                        failing: currentProject.failing
                    });
                } else {
                    if (currentScore > bestScore.score) {
                        bestScore.score = currentScore;
                    }
                }
            }

            // Sort the best scores by score
            bestScores.sort(function (a, b) {
                return b.score - a.score;
            });

            // Create markdown table
            markdownTable += "| Position | Team | Score | % Score | Passing | Failing |\n";
            markdownTable += "| --- | --- | --- | --- | --- | --- |\n";
            for (var i = 0; i < bestScores.length; i++) {
                var percentScore = (bestScores[i].score / 100).toFixed(2);
                markdownTable += "| " + (i + 1) + "| " + bestScores[i].teamName + " | " + bestScores[i].score + " | " + percentScore + " | " + bestScores[i].passing + " | " + bestScores[i].failing + " |\n";
            }

            markdownTable += "\n\n";
        }

        // Commit the changes
        const token = core.getInput('github-token');
        //const octokit = github.getOctokit(token);
        const octokit = new Octokit({ auth: token });

        // Get sha of the data.json file

        octokit.repos.getContent({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            path: dataFile,
        }).then((response) => {
            console.log(response.data.sha);

            octokit.repos.createOrUpdateFileContents({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                path: dataFile,
                message: "Added new team to the list",
                content: Buffer.from(jsonContent).toString('base64'),
                sha: response.data.sha
            });

            octokit.repos.getContent({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                path: "README.md",
            }).then((response) => {
                console.log(response.data.sha);

                octokit.repos.createOrUpdateFileContents({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    path: "README.md",
                    message: "Update global leaderboard",
                    content: Buffer.from(markdownTable).toString('base64'),
                    sha: response.data.sha
                });
            }).catch((error) => {
                console.error(error);
            });
        }).catch((error) => {
            console.error(error);
        });





    });


    // Get the JSON webhook payload for the event that triggered the workflow
    //const payload = JSON.stringify(github.context.payload, undefined, 2)
    //console.log(`The event payload: ${payload}`);
} catch (error) {
    core.setFailed(error.message);
}