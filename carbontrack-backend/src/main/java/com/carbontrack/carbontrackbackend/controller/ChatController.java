package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.chat.ChatRequestDTO;
import com.carbontrack.carbontrackbackend.dto.chat.ChatResponseDTO;
import com.carbontrack.carbontrackbackend.service.GroqChatService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class ChatController {

    private final GroqChatService groqChatService;

    public ChatController(GroqChatService groqChatService) {
        this.groqChatService = groqChatService;
    }

    @PostMapping("/chat")
    public ChatResponseDTO chat(@Valid @RequestBody ChatRequestDTO request) {
        return groqChatService.chat(request);
    }
}
