// server/index.js
const express = require('express');
const bodyParser = require('body-parser');
const accountAbstractionRoutes = require('./routes/accountAbstractionRoutes.cjs');
const approvalActionRoutes = require('./routes/approvalActionRoutes.cjs');
const apiSendDepositNotification = require('./apiSendDepositNotification.cjs');
const email = require('./email.cjs');
const apiResumeReminder = require('./apiResumeReminder.cjs');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// API routes
app.use('/api', accountAbstractionRoutes);
app.use('/api', approvalActionRoutes);
app.use('/api', apiSendDepositNotification);
app.use('/api', email);
app.use('/api', apiResumeReminder);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
