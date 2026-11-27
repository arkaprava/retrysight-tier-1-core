/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

package com.agentretry.manager.sso;

import com.agentretry.manager.config.ManagerAuthProperties;
import com.agentretry.manager.domain.IdentityProviderConfigEntity;
import com.agentretry.manager.domain.IdentityProviderType;
import com.agentretry.manager.security.SecretEncryptionService;
import com.agentretry.manager.security.SsoStateService;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Arrays;

@Component
public class DatabaseClientRegistrationRepository implements ClientRegistrationRepository {

    private final SsoStateService ssoStateService;
    private final SecretEncryptionService secretEncryptionService;
    private final ManagerAuthProperties authProperties;
    private final RestClient restClient = RestClient.create();
    private volatile ClientRegistration cachedRegistration;

    public DatabaseClientRegistrationRepository(
            SsoStateService ssoStateService,
            SecretEncryptionService secretEncryptionService,
            ManagerAuthProperties authProperties
    ) {
        this.ssoStateService = ssoStateService;
        this.secretEncryptionService = secretEncryptionService;
        this.authProperties = authProperties;
    }

    @Override
    public ClientRegistration findByRegistrationId(String registrationId) {
        if (!SsoConfigService.REGISTRATION_ID.equals(registrationId)) {
            return null;
        }
        ClientRegistration registration = cachedRegistration;
        if (registration != null && hasAuthorizationUri(registration)) {
            return registration;
        }
        return refresh();
    }

    public synchronized ClientRegistration refresh() {
        cachedRegistration = loadFromDatabase();
        return cachedRegistration;
    }

    private ClientRegistration loadFromDatabase() {
        return ssoStateService.getActiveConfig()
                .filter(config -> config.getProviderType() == IdentityProviderType.OIDC)
                .map(this::buildRegistration)
                .orElse(null);
    }

    private ClientRegistration buildRegistration(IdentityProviderConfigEntity config) {
        OidcDiscoverySupport.OidcEndpoints endpoints = OidcDiscoverySupport.fetch(config.getIssuerUri(), restClient);
        String internalBaseUrl = authProperties.getSso().getIdpInternalBaseUrl();
        String browserAuthorizationUri = OidcDiscoverySupport.browserAuthorizationUri(
                endpoints.authorizationUri(),
                authProperties.getSso().getIdpBrowserBaseUrl()
        );
        String tokenUri = OidcDiscoverySupport.containerEndpointUri(endpoints.tokenUri(), internalBaseUrl);
        String jwkSetUri = OidcDiscoverySupport.containerEndpointUri(endpoints.jwkSetUri(), internalBaseUrl);
        String clientSecret = secretEncryptionService.decrypt(config.getClientSecretEnc());
        ClientRegistration.Builder builder = ClientRegistration.withRegistrationId(SsoConfigService.REGISTRATION_ID)
                .clientId(config.getClientId())
                .clientSecret(clientSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(config.getRedirectUri())
                .scope(Arrays.asList(config.getScopes().split("\\s+")))
                .authorizationUri(browserAuthorizationUri)
                .tokenUri(tokenUri)
                .jwkSetUri(jwkSetUri);
        if (endpoints.issuer() != null && !endpoints.issuer().isBlank()) {
            builder.issuerUri(endpoints.issuer());
        }
        if (endpoints.userInfoUri() != null && !endpoints.userInfoUri().isBlank()) {
            builder.userInfoUri(OidcDiscoverySupport.containerEndpointUri(endpoints.userInfoUri(), internalBaseUrl));
        }
        return builder.build();
    }

    private static boolean hasAuthorizationUri(ClientRegistration registration) {
        String authorizationUri = registration.getProviderDetails().getAuthorizationUri();
        return authorizationUri != null && !authorizationUri.isBlank();
    }
}
