package com.carbontrack.carbontrackbackend.service;

import com.carbontrack.carbontrackbackend.dto.chat.ChatMessageDTO;
import com.carbontrack.carbontrackbackend.dto.chat.ChatRequestDTO;
import com.carbontrack.carbontrackbackend.dto.chat.ChatResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class GroqChatService {

    private static final Logger logger = LoggerFactory.getLogger(GroqChatService.class);
    private static final String SYSTEM_MESSAGE =
            "You are a helpful, general-purpose AI assistant. Be clear, accurate, and concise.";

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public GroqChatService(
            RestClient.Builder restClientBuilder,
            @Value("${app.groq.api-url:https://api.groq.com/openai/v1}") String apiUrl,
            @Value("${app.groq.api-key:}") String apiKey,
            @Value("${app.groq.model:openai/gpt-oss-20b}") String model) {
        this.restClient = restClientBuilder.baseUrl(apiUrl).build();
        this.apiKey = apiKey;
        this.model = model;
    }

    public ChatResponseDTO chat(ChatRequestDTO request) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "The AI assistant is not configured. Set GROQ_API_KEY in the backend environment."
            );
        }

        List<ChatMessageDTO> messages = request.messages();
        for (ChatMessageDTO message : messages) {
            String role = message.role().toLowerCase(Locale.ROOT);
            if (!role.equals("user") && !role.equals("assistant")) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Message roles must be user or assistant"
                );
            }
        }
        if (!messages.get(messages.size() - 1).role().equalsIgnoreCase("user")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The last message must be from the user"
            );
        }

        List<Map<String, String>> apiMessages = new ArrayList<>();
        apiMessages.add(Map.of("role", "system", "content", SYSTEM_MESSAGE));
        messages.forEach(message -> apiMessages.add(Map.of(
                "role", message.role().toLowerCase(Locale.ROOT),
                "content", message.content()
        )));

        try {
            JsonNode response = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .body(Map.of(
                            "model", model,
                            "messages", apiMessages,
                            "temperature", 0.7,
                            "max_completion_tokens", 1000
                    ))
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode content = response == null
                    ? null
                    : response.at("/choices/0/message/content");
            if (content == null || !content.isTextual() || content.asText().isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "The AI assistant returned an empty response. Please try again."
                );
            }
            return new ChatResponseDTO(content.asText());
        } catch (RestClientResponseException ex) {
            logger.warn("Groq API returned HTTP {}", ex.getStatusCode().value());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "The AI assistant could not complete your request. Please try again later."
            );
        } catch (RestClientException ex) {
            logger.warn("Could not reach the Groq API: {}", ex.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "The AI assistant is temporarily unreachable. Please try again later."
            );
        }
    }
}
