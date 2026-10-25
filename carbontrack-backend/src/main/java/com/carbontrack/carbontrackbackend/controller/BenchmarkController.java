package com.carbontrack.carbontrackbackend.controller;

import com.carbontrack.carbontrackbackend.dto.benchmark.BenchmarkResponseDTO;
import com.carbontrack.carbontrackbackend.service.BenchmarkService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/benchmarks")
public class BenchmarkController {

    private final BenchmarkService benchmarkService;

    public BenchmarkController(BenchmarkService benchmarkService) {
        this.benchmarkService = benchmarkService;
    }

    @GetMapping("/me")
    public BenchmarkResponseDTO getMyBenchmark(Authentication authentication) {
        return benchmarkService.getMyBenchmark(authentication.getName());
    }
}
