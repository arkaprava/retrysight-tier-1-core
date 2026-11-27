/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

package com.agentretry.manager.sso;

import com.agentretry.manager.config.ManagerAuthProperties;
import com.agentretry.manager.domain.IdentityProviderConfigEntity;
import com.agentretry.manager.domain.IdentityProviderType;
import com.agentretry.manager.security.SsoStateService;
import org.springframework.security.saml2.core.Saml2X509Credential;
import org.springframework.security.saml2.provider.service.registration.RelyingPartyRegistration;
import org.springframework.security.saml2.provider.service.registration.RelyingPartyRegistrationRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;

@Component
public class DatabaseRelyingPartyRegistrationRepository implements RelyingPartyRegistrationRepository {

    private final SsoStateService ssoStateService;
    private final ManagerAuthProperties authProperties;
    private final RestClient restClient = RestClient.create();
    private volatile RelyingPartyRegistration cachedRegistration;

    public DatabaseRelyingPartyRegistrationRepository(
            SsoStateService ssoStateService,
            ManagerAuthProperties authProperties
    ) {
        this.ssoStateService = ssoStateService;
        this.authProperties = authProperties;
    }

    @Override
    public RelyingPartyRegistration findByRegistrationId(String registrationId) {
        if (!SsoConfigService.REGISTRATION_ID.equals(registrationId)) {
            return null;
        }
        RelyingPartyRegistration registration = cachedRegistration;
        if (registration != null) {
            return registration;
        }
        return refresh();
    }

    public synchronized RelyingPartyRegistration refresh() {
        cachedRegistration = loadFromDatabase();
        return cachedRegistration;
    }

    private RelyingPartyRegistration loadFromDatabase() {
        return ssoStateService.getActiveConfig()
                .filter(config -> config.getProviderType() == IdentityProviderType.SAML)
                .map(this::buildRegistration)
                .orElse(null);
    }

    private RelyingPartyRegistration buildRegistration(IdentityProviderConfigEntity config) {
        try {
            String metadata = resolveMetadata(config);
            SamlMetadataSupport.ParsedMetadata idp = SamlMetadataSupport.parseIdpMetadata(metadata);
            String browserSsoUrl = OidcDiscoverySupport.browserAuthorizationUri(
                    idp.singleSignOnServiceUrl(),
                    authProperties.getSso().getIdpBrowserBaseUrl()
            );
            return RelyingPartyRegistration.withRegistrationId(SsoConfigService.REGISTRATION_ID)
                    .entityId(config.getEntityId())
                    .assertionConsumerServiceLocation(config.getAcsUrl())
                    .assertingPartyDetails(party -> party
                            .entityId(idp.entityId())
                            .singleSignOnServiceLocation(browserSsoUrl)
                            .wantAuthnRequestsSigned(false)
                            .verificationX509Credentials(credentials -> idp.verificationCertificates()
                                    .forEach(cert -> credentials.add(Saml2X509Credential.verification(cert))))
                    )
                    .build();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to build SAML relying party registration", ex);
        }
    }

    private String resolveMetadata(IdentityProviderConfigEntity config) {
        if (config.getIdpMetadataXml() != null && !config.getIdpMetadataXml().isBlank()) {
            return config.getIdpMetadataXml();
        }
        return restClient.get()
                .uri(URI.create(config.getIdpMetadataUrl()))
                .retrieve()
                .body(String.class);
    }
}
