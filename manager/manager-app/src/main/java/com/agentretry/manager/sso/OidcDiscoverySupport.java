/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

package com.agentretry.manager.sso;

import org.springframework.web.client.RestClient;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;

final class OidcDiscoverySupport {

    private OidcDiscoverySupport() {
    }

    record OidcEndpoints(
            String issuer,
            String authorizationUri,
            String tokenUri,
            String jwkSetUri,
            String userInfoUri
    ) {
    }

    static OidcEndpoints fetch(String issuerUri, RestClient restClient) {
        String discoveryUrl = issuerUri.replaceAll("/$", "") + "/.well-known/openid-configuration";
        Map<?, ?> body = restClient.get()
                .uri(URI.create(discoveryUrl))
                .retrieve()
                .body(Map.class);
        if (body == null) {
            throw new IllegalStateException("OIDC discovery document was empty");
        }
        String authorizationUri = stringValue(body.get("authorization_endpoint"));
        String tokenUri = stringValue(body.get("token_endpoint"));
        String jwkSetUri = stringValue(body.get("jwks_uri"));
        if (authorizationUri == null || tokenUri == null) {
            throw new IllegalStateException("OIDC discovery document missing authorization or token endpoint");
        }
        return new OidcEndpoints(
                stringValue(body.get("issuer")),
                authorizationUri,
                tokenUri,
                jwkSetUri,
                stringValue(body.get("user_info_endpoint"))
        );
    }

    /**
     * Rewrites OIDC endpoint URLs to a container-reachable IdP origin (e.g. {@code localhost}
     * → {@code host.docker.internal}) for server-side token exchange and JWKS fetch.
     */
    static String containerEndpointUri(String endpointUri, String internalBaseUrl) {
        if (endpointUri == null || endpointUri.isBlank()) {
            return endpointUri;
        }
        if (internalBaseUrl == null || internalBaseUrl.isBlank()) {
            return endpointUri;
        }
        try {
            URI endpoint = URI.create(endpointUri);
            URI internal = URI.create(internalBaseUrl.replaceAll("/$", ""));
            int port = internal.getPort() > 0 ? internal.getPort() : endpoint.getPort();
            return new URI(
                    internal.getScheme() != null ? internal.getScheme() : endpoint.getScheme(),
                    endpoint.getUserInfo(),
                    internal.getHost(),
                    port,
                    endpoint.getPath(),
                    endpoint.getQuery(),
                    endpoint.getFragment()
            ).toString();
        } catch (URISyntaxException ex) {
            return endpointUri;
        }
    }

    /**
     * Rewrites the browser redirect URL (e.g. {@code host.docker.internal} → {@code localhost})
     * while leaving server-side token/JWKS URLs on the container-reachable host.
     */
    static String browserAuthorizationUri(String authorizationUri, String browserBaseUrl) {
        if (authorizationUri == null || authorizationUri.isBlank()) {
            return authorizationUri;
        }
        if (browserBaseUrl == null || browserBaseUrl.isBlank()) {
            return authorizationUri.replace("host.docker.internal", "localhost");
        }
        try {
            URI endpoint = URI.create(authorizationUri);
            URI browser = URI.create(browserBaseUrl.replaceAll("/$", ""));
            int port = browser.getPort() > 0 ? browser.getPort() : endpoint.getPort();
            return new URI(
                    browser.getScheme() != null ? browser.getScheme() : endpoint.getScheme(),
                    endpoint.getUserInfo(),
                    browser.getHost(),
                    port,
                    endpoint.getPath(),
                    endpoint.getQuery(),
                    endpoint.getFragment()
            ).toString();
        } catch (URISyntaxException ex) {
            return authorizationUri.replace("host.docker.internal", "localhost");
        }
    }

    private static String stringValue(Object value) {
        return value == null ? null : value.toString();
    }
}
