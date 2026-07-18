CREATE TABLE feedback (
    feedback_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('problem', 'suggestion')),
    message TEXT NOT NULL CHECK (char_length(message) BETWEEN 5 AND 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
