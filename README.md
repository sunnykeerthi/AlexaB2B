# AlexaB2B

## Alexa Setup

### AWS Console

1.  Clone the code into local repo.
3.  Open your favorite IDE and follow the below steps.
	1.  cd [folder name].
	2.  npm install.
	3.  zip the contents. **Note:** Zip the folder contents, not the folder.
4.  Navigate to [AWS Console](https://console.aws.amazon.com/console/home)
5.  Create a new Lambda function.
6.  Create a new function.
7.  Give it a name.
		1.  Use an existing role.
		2.  Select lambda_basic_execution from drop down.
		3.  Create Function.
8.  Now a blank new function is created for us. Click **Add trigger.**
9.  Select Alexa Skills kit from dropdown. and _Disable_ Skill ID verification and Add.  
10. On lambda function page, scroll down select upload zip from the drop down and select the zip that was built in step 3.3.
11.  Create 2 Environment variable and leave it blank, we’ll get back to it later.
		1.  username
		2.  password
		3.  APP_ID
12.  Increase the _Timer_ under _Basic Settings_ to 1min. This is to avoid timeouts during processing.
13.  Save.
14.  Copy the ARN in the top right to a notepad.


### Amazon Developer Console

1. Navigate to [Speech Assets](https://github.com/sunnykeerthi/AlexaB2B/blob/main/InteractionModel.json) for code.
2. Login to [Developer Console](https://developer.amazon.com/).
3. Click Developer console on top right and select Alexa Skills Kit by hovering on *Alexa* in the top ribbon.
4. Click Create Skill, Give a Skill Name and leave the rest to default. Then you would be prompted to Choose a template, Leave it to default and Click Choose. A skill is created now.
5. Select JSON Editor from the left ribbon. 
6. Copy the code from Step 1 and replace the JSON Editor Content with it. and change *invocationName* to your skill name.
7. Click Save Model and the Build Model. Give it a minute to build.
8. Once built Navigate to End Points from left menu. And Select *AWS ARN* radio.
9. Copy *Your Skill ID *on a notepad.
10. under *Default Region*, paste the ARN that you copied in previous section (Step 15).

We are done (Partially) building the skill.

## Updating the Model

1. Navigate back to AWS Console. And let’s fill in the Environment variables that we created earlier.
2. For APP_ID the value should be **Your Skill ID** you copied in the previous step.
3. For username, password use your Salesforce credentials.
4. Save the model.

