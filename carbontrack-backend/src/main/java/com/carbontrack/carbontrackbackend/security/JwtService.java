<<<<<<< HEAD

=======
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
package com.carbontrack.carbontrackbackend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
<<<<<<< HEAD
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
=======
            @Value("${app.jwt.expiration-ms:3600000}") long expirationMs) {
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170

        byte[] keyBytes = Decoders.BASE64.decode(secret);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
    }

<<<<<<< HEAD
    public String generateToken(String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiry)
=======
    public String generateToken(Long userId, String email) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(expiration)
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
                .signWith(signingKey)
                .compact();
    }

<<<<<<< HEAD
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, String expectedEmail) {
        Claims claims = parseClaims(token);

        return expectedEmail.equals(claims.getSubject())
                && claims.getExpiration().after(new Date());
    }

    private Claims parseClaims(String token) {
=======
    public Claims extractClaims(String token) {
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
<<<<<<< HEAD
}

=======

    public boolean isTokenValid(String token, String expectedEmail) {
        try {
            Claims claims = extractClaims(token);

            return expectedEmail.equals(claims.getSubject())
                    && claims.getExpiration() != null
                    && claims.getExpiration().after(new Date());

        } catch (io.jsonwebtoken.JwtException
                 | IllegalArgumentException ex) {
            return false;
        }
    }
}
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
