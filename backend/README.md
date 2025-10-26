# UltraRentz Backend API

A Node.js + Express + PostgreSQL backend for the UltraRentz blockchain-based rent deposit platform.

## Features

- **Wallet-based Authentication**: MetaMask signature verification with JWT tokens
- **Smart Contract Event Monitoring**: Real-time blockchain event listening
- **RESTful API**: Complete CRUD operations for deposits, yields, and disputes
- **WebSocket Support**: Real-time updates via Socket.io
- **PostgreSQL Database**: Robust data persistence with Sequelize ORM
- **TypeScript**: Full type safety and modern JavaScript features

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Blockchain**: Ethers.js v5.8.0
- **Real-time**: Socket.io
- **Language**: TypeScript
- **Authentication**: JWT + MetaMask signatures

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- MetaMask or compatible wallet

## Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up PostgreSQL database**:

   ```sql
   CREATE DATABASE ultrarentz;
   ```

3. **Configure environment variables**:
   Create a `.env` file in the backend directory:

   ```env
   # Server
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5174

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ultrarentz
   DB_USER=postgres
   DB_PASSWORD=your_password

   # Blockchain
   MOONBASE_RPC=https://rpc.api.moonbase.moonbeam.network
   ESCROW_CONTRACT_ADDRESS=0x...
   URZ_TOKEN_ADDRESS=0x...
   CHAIN_ID=1287

   # Auth
   JWT_SECRET=your_secret_key_change_this_in_production
   JWT_EXPIRY=24h
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `GET /api/auth/nonce?address=0x...` - Get nonce for wallet signature
- `POST /api/auth/verify` - Verify signature and get JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get current user profile

### Deposits

- `GET /api/deposits` - Get all deposits (with filters)
- `GET /api/deposits/:id` - Get deposit details
- `GET /api/deposits/user/:address` - Get deposits by user
- `GET /api/deposits/stats` - Get deposit statistics
- `POST /api/deposits/sync/:chainId` - Sync deposit from blockchain

### Yields

- `GET /api/yields/:address` - Get yield history for user
- `GET /api/yields/summary/:address` - Get yield summary
- `GET /api/yields/chart/:address` - Get yield chart data
- `GET /api/yields/stats` - Get overall yield statistics

### Disputes

- `GET /api/disputes` - Get all disputes
- `GET /api/disputes/:depositId` - Get dispute by deposit ID
- `GET /api/disputes/active` - Get active disputes count
- `GET /api/disputes/user/:address` - Get disputes by user
- `GET /api/disputes/stats` - Get dispute statistics

## WebSocket Events

### Client → Server

- `subscribe:deposit` - Subscribe to deposit updates
- `subscribe:yields` - Subscribe to yield updates
- `unsubscribe:deposit` - Unsubscribe from deposit
- `unsubscribe:yields` - Unsubscribe from yields

### Server → Client

- `deposit:created` - New deposit created
- `deposit:updated` - Deposit status changed
- `vote:cast` - New vote registered
- `dispute:triggered` - Dispute initiated
- `dispute:resolved` - Dispute resolved
- `yield:accrued` - New yield accrued
- `yield:claimed` - Yield claimed

## Database Schema

### Users

- `id` (UUID, primary key)
- `wallet_address` (VARCHAR, unique)
- `nonce` (VARCHAR)
- `created_at`, `updated_at`

### Deposits

- `id` (UUID, primary key)
- `chain_deposit_id` (INTEGER, unique)
- `tenant_address` (VARCHAR)
- `landlord_address` (VARCHAR)
- `token_address` (VARCHAR)
- `amount` (DECIMAL)
- `status` (ENUM)
- `released` (BOOLEAN)
- `in_dispute` (BOOLEAN)
- `tx_hash` (VARCHAR)
- `created_at`, `updated_at`

### Signatories

- `id` (UUID, primary key)
- `deposit_id` (UUID, foreign key)
- `address` (VARCHAR)
- `signatory_index` (INTEGER)

### Votes

- `id` (UUID, primary key)
- `deposit_id` (UUID, foreign key)
- `signatory_address` (VARCHAR)
- `vote_choice` (ENUM)
- `tx_hash` (VARCHAR)
- `created_at`

### Disputes

- `id` (UUID, primary key)
- `deposit_id` (UUID, foreign key)
- `triggered_by` (VARCHAR)
- `status` (ENUM)
- `resolution` (TEXT)
- `tenant_amount` (DECIMAL)
- `landlord_amount` (DECIMAL)
- `created_at`, `resolved_at`

### YieldHistory

- `id` (UUID, primary key)
- `deposit_id` (UUID, foreign key)
- `user_address` (VARCHAR)
- `yield_amount` (DECIMAL)
- `apy` (DECIMAL)
- `claimed` (BOOLEAN)
- `tx_hash` (VARCHAR)
- `created_at`, `claimed_at`

## Smart Contract Events

The backend monitors the following events from the Escrow contract:

- `DepositReceived` - New deposit created
- `SignatoryVote` - Signatory cast vote
- `DepositReleased` - Deposit released
- `DepositReleasedToTenant` - Deposit released to tenant
- `DepositReleasedToLandlord` - Deposit released to landlord
- `DisputeTriggered` - Dispute initiated
- `DAOResolved` - Dispute resolved by DAO

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

### Project Structure

```
src/
├── config/          # Database and blockchain configuration
├── controllers/     # Route handlers
├── middleware/      # Authentication and error handling
├── models/          # Database models (Sequelize)
├── routes/          # API routes
├── services/        # Business logic and event listeners
├── utils/           # Utility functions
└── server.ts        # Main server file
```

## Production Deployment

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Use PM2 for process management**:

   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name ultrarentz-backend
   ```

4. **Set up PostgreSQL with connection pooling**

5. **Configure reverse proxy (nginx)**

6. **Set up SSL certificates**

## Security Considerations

- JWT tokens expire in 24 hours
- Wallet signatures are verified using ethers.js
- Nonces are regenerated after each authentication
- CORS is configured for specific origins
- Input validation using express-validator
- Error handling prevents information leakage

## Monitoring

- Winston logging for error tracking
- Health check endpoint at `/health`
- Database connection monitoring
- Smart contract event monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License

