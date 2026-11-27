-- Copyright (c) 2026 Arka Prava Ghosh
-- SPDX-License-Identifier: Apache-2.0

--liquibase formatted sql

--changeset agent-discovery:018-agent-discovery-status
ALTER TABLE agents ADD COLUMN IF NOT EXISTS discovery_status TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS parse_health TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS queue_depth INTEGER;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS auto_discovery BOOLEAN;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS buffer_dropped_total BIGINT;
