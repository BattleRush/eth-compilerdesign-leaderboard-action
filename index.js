const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs')

try {
    // Get the issue body of which triggered this event
    const issueBody = github.context.payload.issue.body;

    


    // Get the JSON webhook payload for the event that triggered the workflow
    //const payload = JSON.stringify(github.context.payload, undefined, 2)
    //console.log(`The event payload: ${payload}`);
} catch (error) {
    core.setFailed(error.message);
}