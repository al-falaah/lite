-- Allow students to self-initiate recitations without a teacher
ALTER TABLE recitations ALTER COLUMN teacher_id DROP NOT NULL;
