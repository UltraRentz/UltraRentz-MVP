// server/index.js
const express = require('express');
const bodyParser = require('body-parser');
const accountAbstractionRoutes = require('./routes/accountAbstractionRoutes');
const approvalActionRoutes = require('./routes/approvalActionRoutes');
const apiSendDepositNotification = require('./apiSendDepositNotification');
const email = require('./email');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// API routes
app.use('/api', accountAbstractionRoutes);
app.use('/api', approvalActionRoutes);
app.use('/api', apiSendDepositNotification);
app.use('/api', email);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
