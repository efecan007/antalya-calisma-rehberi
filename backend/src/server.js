require('dotenv').config();
const { createApp } = require('./shared/infrastructure/http/expressApp');

const app = createApp();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Work From Hotel API listening on port ${PORT}`);
});
