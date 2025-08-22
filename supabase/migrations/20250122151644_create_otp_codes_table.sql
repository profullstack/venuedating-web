-- Create OTP codes table for phone authentication
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3
);

-- Create index on phone_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_number ON otp_codes(phone_number);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Create index on created_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_otp_codes_created_at ON otp_codes(created_at);

-- Enable Row Level Security
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access (for backend operations)
CREATE POLICY "Service role can manage OTP codes" ON otp_codes
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM otp_codes 
    WHERE expires_at < NOW() OR created_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get valid OTP for phone number
CREATE OR REPLACE FUNCTION get_valid_otp(phone TEXT)
RETURNS TABLE(
    id UUID,
    otp_code TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER,
    max_attempts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oc.id,
        oc.otp_code,
        oc.expires_at,
        oc.attempts,
        oc.max_attempts
    FROM otp_codes oc
    WHERE oc.phone_number = phone
      AND oc.expires_at > NOW()
      AND oc.verified = FALSE
      AND oc.attempts < oc.max_attempts
    ORDER BY oc.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify OTP
CREATE OR REPLACE FUNCTION verify_otp_code(phone TEXT, code TEXT)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    otp_id UUID
) AS $$
DECLARE
    otp_record RECORD;
    result_success BOOLEAN := FALSE;
    result_message TEXT := 'Invalid or expired OTP';
    result_otp_id UUID := NULL;
BEGIN
    -- Get the most recent valid OTP for this phone
    SELECT * INTO otp_record
    FROM get_valid_otp(phone)
    LIMIT 1;
    
    IF otp_record.id IS NULL THEN
        result_message := 'No valid OTP found for this phone number';
    ELSIF otp_record.otp_code = code THEN
        -- OTP is correct, mark as verified
        UPDATE otp_codes 
        SET verified = TRUE, attempts = attempts + 1
        WHERE id = otp_record.id;
        
        result_success := TRUE;
        result_message := 'OTP verified successfully';
        result_otp_id := otp_record.id;
    ELSE
        -- OTP is incorrect, increment attempts
        UPDATE otp_codes 
        SET attempts = attempts + 1
        WHERE id = otp_record.id;
        
        IF otp_record.attempts + 1 >= otp_record.max_attempts THEN
            result_message := 'Maximum verification attempts exceeded';
        ELSE
            result_message := 'Invalid OTP code';
        END IF;
    END IF;
    
    RETURN QUERY SELECT result_success, result_message, result_otp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
