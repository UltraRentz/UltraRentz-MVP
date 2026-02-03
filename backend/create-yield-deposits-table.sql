-- Create yield_deposits table
CREATE TABLE IF NOT EXISTS yield_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL CHECK (LENGTH(user_address) = 42),
    deposit_amount DECIMAL(36, 18) NOT NULL CHECK (deposit_amount > 0),
    duration_days INTEGER NOT NULL CHECK (duration_days >= 1 AND duration_days <= 3650),
    expected_apy DECIMAL(5, 2) NOT NULL CHECK (expected_apy >= 0 AND expected_apy <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    tx_hash VARCHAR(66) NULL CHECK (LENGTH(tx_hash) = 66)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_yield_deposits_user_address ON yield_deposits(user_address);
CREATE INDEX IF NOT EXISTS idx_yield_deposits_status ON yield_deposits(status);
CREATE INDEX IF NOT EXISTS idx_yield_deposits_created_at ON yield_deposits(created_at);

-- Add comments for documentation
COMMENT ON TABLE yield_deposits IS 'Stores yield deposit requests from users';
COMMENT ON COLUMN yield_deposits.id IS 'Unique identifier for the yield deposit';
COMMENT ON COLUMN yield_deposits.user_address IS 'Wallet address of the user creating the deposit';
COMMENT ON COLUMN yield_deposits.deposit_amount IS 'Amount of tokens to be deposited (in URZ)';
COMMENT ON COLUMN yield_deposits.duration_days IS 'Duration of the deposit in days (1-3650)';
COMMENT ON COLUMN yield_deposits.expected_apy IS 'Expected Annual Percentage Yield (0-100%)';
COMMENT ON COLUMN yield_deposits.status IS 'Current status of the deposit';
COMMENT ON COLUMN yield_deposits.created_at IS 'When the deposit request was created';
COMMENT ON COLUMN yield_deposits.activated_at IS 'When the deposit was activated/confirmed';
COMMENT ON COLUMN yield_deposits.completed_at IS 'When the deposit was completed';
COMMENT ON COLUMN yield_deposits.tx_hash IS 'Blockchain transaction hash for the deposit';

-- Insert some sample data for testing
INSERT INTO yield_deposits (user_address, deposit_amount, duration_days, expected_apy, status) VALUES
('0xb83977f0e7c0a2038c5396f6216127353a8bc87a', '1000.000000000000000000', 30, 5.50, 'pending'),
('0xb83977f0e7c0a2038c5396f6216127353a8bc87a', '2500.000000000000000000', 90, 6.25, 'active'),
('0xb83977f0e7c0a2038c5396f6216127353a8bc87a', '5000.000000000000000000', 180, 7.00, 'completed');

-- Verify the table was created successfully
SELECT 'yield_deposits table created successfully' as status;
SELECT COUNT(*) as total_records FROM yield_deposits;
