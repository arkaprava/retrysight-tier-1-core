/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

package com.agentretry.manager.graphql;

import com.agentretry.contract.CollectorDiscoveryEntry;
import com.agentretry.contract.ParseErrorEntry;
import com.agentretry.manager.domain.AgentEntity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.util.Collections;
import java.util.List;

@Controller
public class AgentGraphqlResolver {

    private static final TypeReference<List<CollectorDiscoveryEntry>> DISCOVERY_TYPE =
            new TypeReference<>() {
            };
    private static final TypeReference<List<ParseErrorEntry>> PARSE_HEALTH_TYPE =
            new TypeReference<>() {
            };

    private final ObjectMapper objectMapper;

    public AgentGraphqlResolver(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @SchemaMapping(typeName = "Agent", field = "discoveryResults")
    public List<CollectorDiscoveryEntry> discoveryResults(AgentEntity agent) {
        return readJsonList(agent.getDiscoveryStatus(), DISCOVERY_TYPE);
    }

    @SchemaMapping(typeName = "Agent", field = "parseErrors")
    public List<ParseErrorEntry> parseErrors(AgentEntity agent) {
        return readJsonList(agent.getParseHealth(), PARSE_HEALTH_TYPE);
    }

    private <T> List<T> readJsonList(String json, TypeReference<List<T>> type) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, type);
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }
}
