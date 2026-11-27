/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

package com.agentretry.manager.config;

import com.agentretry.manager.security.AgentApiKeyFilter;
import com.agentretry.manager.security.IngestRateLimitFilter;
import com.agentretry.manager.security.JwtAuthFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Security filters are registered only on the Spring Security filter chain.
 * Disable Boot's automatic servlet registration so JWT auth is not applied twice.
 */
@Configuration
public class SecurityFilterRegistrationConfig {

    @Bean
    public FilterRegistrationBean<JwtAuthFilter> disableJwtAuthServletRegistration(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public FilterRegistrationBean<AgentApiKeyFilter> disableAgentApiKeyServletRegistration(
            AgentApiKeyFilter filter
    ) {
        FilterRegistrationBean<AgentApiKeyFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public FilterRegistrationBean<IngestRateLimitFilter> disableIngestRateLimitServletRegistration(
            IngestRateLimitFilter filter
    ) {
        FilterRegistrationBean<IngestRateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
