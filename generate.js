const { google } = require('googleapis');
const credentials = require('./credentials.json');

const oauth2Client = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Cần để lấy refresh token
  scope: ['https://www.googleapis.com/auth/gmail.send'],
});

console.log('Authorize this app by visiting this url:', authUrl);

const code = '4/0AanRRrvCdjEhykKLHfrlAR9bC4FdjVWW8neus4rJtxSzDkorxqzqS4-U-KkOXur2dRl9HQ'; // Mã từ bước trên

oauth2Client.getToken(code, (err, tokens) => {
  if (err) {
    console.error('Error retrieving access token', err);
    return;
  }
  console.log('Refresh Token:', tokens.refresh_token);
});