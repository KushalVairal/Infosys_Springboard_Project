<<<<<<< HEAD

=======
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
package com.carbontrack.carbontrackbackend.security;

import com.carbontrack.carbontrackbackend.entity.User;
import com.carbontrack.carbontrackbackend.repository.UserRepository;
<<<<<<< HEAD
import io.jsonwebtoken.JwtException;
=======

import io.jsonwebtoken.Claims;
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
<<<<<<< HEAD
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
=======

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

<<<<<<< HEAD
=======
import org.springframework.stereotype.Component;

>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

<<<<<<< HEAD
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header == null || !header.startsWith("Bearer ")) {
=======
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170
            filterChain.doFilter(request, response);
            return;
        }

<<<<<<< HEAD
        String token = header.substring(7);

        try {
            String email = jwtService.extractEmail(token);

            if (SecurityContextHolder.getContext()
                    .getAuthentication() == null) {
=======
        String token = authHeader.substring(7);

        try {
            Claims claims = jwtService.extractClaims(token);
            String email = claims.getSubject();

            if (email != null
                    && SecurityContextHolder.getContext()
                            .getAuthentication() == null) {
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170

                User user = userRepository.findByEmail(email)
                        .orElse(null);

                if (user != null
<<<<<<< HEAD
                        && jwtService.isTokenValid(token, email)) {

                    var authorities = List.of(
                            new SimpleGrantedAuthority(
                                    "ROLE_" + user.getRole()));

                    var authentication =
                            new UsernamePasswordAuthenticationToken(
                                    email, null, authorities);
=======
                        && jwtService.isTokenValid(token, user.getEmail())) {

                    var authentication =
                            new UsernamePasswordAuthenticationToken(
                                    user.getEmail(),
                                    null,
                                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
                            );
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170

                    SecurityContextHolder.getContext()
                            .setAuthentication(authentication);
                }
            }
<<<<<<< HEAD
        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
            response.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Invalid or expired access token");
            return;
        }
=======

        } catch (io.jsonwebtoken.JwtException
         | IllegalArgumentException ex) {

    SecurityContextHolder.clearContext();
}
>>>>>>> eec714c510ae2dd7060d48dff727a8ca369f3170

        filterChain.doFilter(request, response);
    }
}
