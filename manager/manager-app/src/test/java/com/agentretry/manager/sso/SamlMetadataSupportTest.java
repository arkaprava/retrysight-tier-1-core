/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

package com.agentretry.manager.sso;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SamlMetadataSupportTest {

    private static final String KEYCLOAK_METADATA = """
            <md:EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                entityID="http://localhost:8082/realms/retrysight">
              <md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
                <md:KeyDescriptor use="signing">
                  <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
                    <ds:X509Data>
                      <ds:X509Certificate>MIICozCCAYsCBgGf16vnpjANBgkqhkiG9w0BAQsFADAVMRMwEQYDVQQDDApyZXRyeXNpZ2h0MB4XDTI2MDgwNjE1MjEzNVoXDTM2MDgwNjE1MjMxNVowFTETMBEGA1UEAwwKcmV0cnlzaWdodDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAOHVAFR/sTllyH33h8T3zvctiZl+rppntnBw3ceMzRlrugQGpj5G4Ua74by3tsTrMBKpiozhLxXH94BJF2LBwbFQh4HxLyye9L45Xota2bkfW01Y7ddPWa0uwmCo90NzjZ/0IFr0TFmiofGE1nBQ9qf1OsH/TJnAXoApsny+8zTenAxO+Ixcsp3/l/ci1eAsrw4lCp3TAfNskkZgVSCSHl2emJO8qmgDRAB37ZEfQZ9CpFUlvGeNtbptfJaDehthlQDmEW5txW0Gq303HkaeD+bDE6e0hzLNBzRBoQ/SF24gQWZY2gPceR3+pCs0gr+7G5WJfOUaAyQTOwzJD/bbS3MCAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAei2NEcgnfI0Eqyc9edcA3DkqhXoDoBi1ZoreIwQgbv7rggulKKGNozfqN8PHOM0ZV8RQZLty9dufRbNTBdCP3rLF0nfYcUu6I4GctrvYvUHMHjRc+P6oY99QbnxMB+4WLQbjEbH8JZ/54++70NZHBFVJxsRFzPqHZeoSmyjIRCgvW6/yNJx6QjCfpIxq1GlmmqcziglxdF92H8TK2cn14P3NujWKSTtB8gUoKG5pPUuaRe88x1ivRI3O8OIZrMWb0NiFoKqw5oaKNX76hR5KD6toTPWeVUzvwpmfkRv5RUiRTknugC9XTYMUQON09fNV0MuJfvVA4pMUn0LqU+w4AQ==</ds:X509Certificate>
                    </ds:X509Data>
                  </ds:KeyInfo>
                </md:KeyDescriptor>
                <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                    Location="http://localhost:8082/realms/retrysight/protocol/saml"/>
              </md:IDPSSODescriptor>
            </md:EntityDescriptor>
            """;

    @Test
    void parsesKeycloakMetadataWithNamespacePrefixes() throws Exception {
        assertTrue(SamlMetadataSupport.hasEntityDescriptor(SamlMetadataSupport.parseDocument(KEYCLOAK_METADATA)));

        SamlMetadataSupport.ParsedMetadata parsed = SamlMetadataSupport.parseIdpMetadata(KEYCLOAK_METADATA);
        assertEquals("http://localhost:8082/realms/retrysight", parsed.entityId());
        assertEquals("http://localhost:8082/realms/retrysight/protocol/saml", parsed.singleSignOnServiceUrl());
        assertNotNull(parsed.verificationCertificates());
        assertEquals(1, parsed.verificationCertificates().size());
    }
}
