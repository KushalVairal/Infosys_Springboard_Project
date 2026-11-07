package com.carbontrack.carbontrackbackend.security.oauth2;

import com.carbontrack.carbontrackbackend.dto.auth.AuthResponseDTO;
import com.carbontrack.carbontrackbackend.service.OAuth2AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final OAuth2AuthService oAuth2AuthService;
    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Value("${app.oauth2.authorized-redirect-uri:http://localhost:5173/login}")
    private String defaultTargetUrl;

    public OAuth2AuthenticationSuccessHandler(
            OAuth2AuthService oAuth2AuthService,
            HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository
    ) {
        this.oAuth2AuthService = oAuth2AuthService;
        this.httpCookieOAuth2AuthorizationRequestRepository = httpCookieOAuth2AuthorizationRequestRepository;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        String targetBaseUrl = determineTargetUrl(request);

        try {
            if (!(authentication.getPrincipal() instanceof OAuth2User oAuth2User)) {
                throw new IllegalStateException("Authentication principal is not an OAuth2User");
            }

            Map<String, Object> attributes = oAuth2User.getAttributes();
            String email = (String) attributes.get("email");

            Object verifiedAttr = attributes.get("email_verified");
            boolean isEmailVerified = false;
            if (verifiedAttr instanceof Boolean b) {
                isEmailVerified = b;
            } else if (verifiedAttr instanceof String s) {
                isEmailVerified = Boolean.parseBoolean(s);
            }

            if (email == null || email.isBlank()) {
                redirectToError(request, response, targetBaseUrl, "Google did not return an email address.");
                return;
            }

            if (!isEmailVerified) {
                redirectToError(
                        request,
                        response,
                        targetBaseUrl,
                        "Your Google account email is not verified. Please verify your email with Google or log in with your password."
                );
                return;
            }

            String fullName = (String) attributes.get("name");
            String pictureUrl = (String) attributes.get("picture");

            AuthResponseDTO authResponse = oAuth2AuthService.processGoogleUser(email, fullName, pictureUrl);

            String targetUrl = UriComponentsBuilder.fromUriString(targetBaseUrl)
                    .queryParam("oauth", "success")
                    .queryParam("token", authResponse.getToken())
                    .queryParam("userId", authResponse.getUserId())
                    .queryParam("email", authResponse.getEmail())
                    .build().toUriString();

            clearAuthenticationAttributes(request, response);
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
        } catch (Exception ex) {
            log.error("OAuth2 success handler error: {}", ex.getMessage(), ex);
            redirectToError(request, response, targetBaseUrl, "Google authentication processing failed: " + ex.getMessage());
        }
    }

    private String determineTargetUrl(HttpServletRequest request) {
        Optional<String> redirectUri = CookieUtils.getCookie(
                request,
                HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME
        ).map(Cookie::getValue);

        if (redirectUri.isPresent() && isAuthorizedRedirectUri(redirectUri.get())) {
            return redirectUri.get();
        }

        return defaultTargetUrl;
    }

    private boolean isAuthorizedRedirectUri(String uriString) {
        try {
            URI clientRedirectUri = URI.create(uriString);
            URI defaultUri = URI.create(defaultTargetUrl);

            return clientRedirectUri.getHost().equalsIgnoreCase(defaultUri.getHost())
                    && clientRedirectUri.getPort() == defaultUri.getPort();
        } catch (Exception e) {
            return false;
        }
    }

    private void redirectToError(
            HttpServletRequest request,
            HttpServletResponse response,
            String targetBaseUrl,
            String errorMessage
    ) throws IOException {
        clearAuthenticationAttributes(request, response);
        String targetUrl = UriComponentsBuilder.fromUriString(targetBaseUrl)
                .queryParam("error", URLEncoder.encode(errorMessage, StandardCharsets.UTF_8))
                .build().toUriString();
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        clearAuthenticationAttributes(request);
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }
}
