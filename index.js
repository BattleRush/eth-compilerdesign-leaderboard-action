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

    if(issueBodyDetails.length < 2000) {
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

        // Commit the changes
        const token = core.getInput('github-token');
        //const octokit = github.getOctokit(token);
        const octokit = new Octokit({ auth: token });

        octokit.repos.createOrUpdateFileContents({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            path: dataFile,
            message: "Added new team to the list",
            content: Buffer.from(jsonContent).toString('base64'),
        });
    });


    // Get the JSON webhook payload for the event that triggered the workflow
    //const payload = JSON.stringify(github.context.payload, undefined, 2)
    //console.log(`The event payload: ${payload}`);
} catch (error) {
    core.setFailed(error.message);
}