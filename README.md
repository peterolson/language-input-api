# language-input-api

This is the API used by [https://www.languageinput.com/](https://www.languageinput.com/).

# Installation

- Make sure python and node.js are installed
- [Install spaCy](https://spacy.io/usage#installation) with all of the language models. Select pipeline for accuracy.
- Clone this repository and run `npm install`.
- Create a `.env` file in the root directory with values for API keys:

```
# Required for Microsoft Text-to-Speech and Translate API
AZURE_COGNITIVE_SERVICES_KEY=
AZURE_COGNITIVE_SERVICES_REGION=

# Required for getting data from YouTube
YOUTUBE_API_KEY=

# Required for storing data in MongoDB
MONGO_CONNECTION_STRING=

# Required for creating JSON web tokens, can be set to any string
JWT_SECRET=random string goes here

# Required for Google translate
GOOGLE_APPLICATION_CREDENTIALS="google-api-key.json"
GOOGLE_PROJECT_ID=

# Required for sending emails
AWS_SES_REGION=
AWS_SES_ACCESS_KEY=
AWS_SES_SECRET_KEY=
EMAIL_SES_FROM_ADDRESS=
```

# Development

- Run `npm run dev` to start the server.
