/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

package com.agentretry.manager.sso;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.List;

final class SamlMetadataSupport {

    static final String SAML_METADATA_NS = "urn:oasis:names:tc:SAML:2.0:metadata";
    static final String HTTP_REDIRECT_BINDING = "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect";

    private SamlMetadataSupport() {
    }

    record ParsedMetadata(String entityId, String singleSignOnServiceUrl, List<X509Certificate> verificationCertificates) {
    }

    static Document parseDocument(String metadataXml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        return factory.newDocumentBuilder()
                .parse(new ByteArrayInputStream(metadataXml.getBytes(StandardCharsets.UTF_8)));
    }

    static boolean hasEntityDescriptor(Document document) {
        return firstElement(document, "EntityDescriptor") != null;
    }

    static ParsedMetadata parseIdpMetadata(String metadataXml) throws Exception {
        Document document = parseDocument(metadataXml);
        Element entity = firstElement(document, "EntityDescriptor");
        if (entity == null) {
            throw new IllegalStateException("Missing EntityDescriptor in SAML metadata");
        }
        String entityId = entity.getAttribute("entityID");
        Element idpDescriptor = firstChildElement(entity, "IDPSSODescriptor");
        String ssoUrl = resolveSingleSignOnServiceUrl(idpDescriptor);
        List<X509Certificate> certificates = readVerificationCertificates(idpDescriptor);
        return new ParsedMetadata(entityId, ssoUrl, certificates);
    }

    private static String resolveSingleSignOnServiceUrl(Element idpDescriptor) {
        String fallback = null;
        NodeList ssoServices = elements(idpDescriptor, "SingleSignOnService");
        for (int i = 0; i < ssoServices.getLength(); i++) {
            Element service = (Element) ssoServices.item(i);
            String location = service.getAttribute("Location");
            if (location == null || location.isBlank()) {
                continue;
            }
            if (HTTP_REDIRECT_BINDING.equals(service.getAttribute("Binding"))) {
                return location;
            }
            fallback = location;
        }
        if (fallback == null) {
            throw new IllegalStateException("Missing SingleSignOnService in SAML metadata");
        }
        return fallback;
    }

    private static List<X509Certificate> readVerificationCertificates(Element idpDescriptor) throws Exception {
        List<X509Certificate> certificates = new ArrayList<>();
        NodeList certNodes = elements(idpDescriptor, "X509Certificate");
        CertificateFactory factory = CertificateFactory.getInstance("X.509");
        for (int i = 0; i < certNodes.getLength(); i++) {
            String encoded = certNodes.item(i).getTextContent().replaceAll("\\s+", "");
            byte[] decoded = java.util.Base64.getDecoder().decode(encoded);
            certificates.add((X509Certificate) factory.generateCertificate(new ByteArrayInputStream(decoded)));
        }
        return certificates;
    }

    private static Element firstElement(Document document, String localName) {
        Element element = (Element) document.getElementsByTagNameNS(SAML_METADATA_NS, localName).item(0);
        if (element != null) {
            return element;
        }
        return (Element) document.getElementsByTagName(localName).item(0);
    }

    private static Element firstChildElement(Element parent, String localName) {
        NodeList children = parent.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (!(child instanceof Element element)) {
                continue;
            }
            if (localName.equals(element.getLocalName()) || localName.equals(element.getTagName())) {
                return element;
            }
        }
        throw new IllegalStateException("Missing " + localName + " in SAML metadata");
    }

    private static NodeList elements(Element parent, String localName) {
        NodeList nodes = parent.getElementsByTagNameNS(SAML_METADATA_NS, localName);
        if (nodes.getLength() > 0) {
            return nodes;
        }
        // Elements from other namespaces (e.g. ds:X509Certificate in xmldsig) under any prefix.
        nodes = parent.getElementsByTagNameNS("*", localName);
        if (nodes.getLength() > 0) {
            return nodes;
        }
        return parent.getElementsByTagName(localName);
    }
}
