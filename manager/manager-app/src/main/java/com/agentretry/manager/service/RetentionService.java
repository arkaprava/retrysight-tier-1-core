/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

package com.agentretry.manager.service;

import com.agentretry.manager.config.RetentionProperties;
import com.agentretry.manager.domain.RetentionSettingsEntity;
import com.agentretry.manager.graphql.RetentionSettings;
import com.agentretry.manager.repository.RetentionSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/** Tier Core — retention settings without archive orchestration. */
@Service
public class RetentionService {
    private static final UUID SINGLETON_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final RetentionProperties properties;
    private final RetentionSettingsRepository settingsRepository;

    public RetentionService(RetentionProperties properties, RetentionSettingsRepository settingsRepository) {
        this.properties = properties;
        this.settingsRepository = settingsRepository;
    }

    @Transactional(readOnly = true)
    public RetentionSettings getSettings() {
        RetentionSettingsEntity entity = settingsRepository.findById(SINGLETON_ID).orElse(null);
        if (entity != null) {
            return new RetentionSettings(entity.getTaskEventsDays(), entity.getUpdatedAt());
        }
        return new RetentionSettings(properties.getTaskEventsDays(), Instant.EPOCH);
    }

    @Transactional
    public RetentionSettings updateSettings(int taskEventsDays) {
        RetentionSettingsEntity entity = settingsRepository.findById(SINGLETON_ID)
                .orElseGet(() -> {
                    RetentionSettingsEntity created = new RetentionSettingsEntity();
                    created.setId(SINGLETON_ID);
                    return created;
                });
        entity.setTaskEventsDays(taskEventsDays);
        entity.setUpdatedAt(Instant.now());
        settingsRepository.save(entity);
        return new RetentionSettings(entity.getTaskEventsDays(), entity.getUpdatedAt());
    }
}
