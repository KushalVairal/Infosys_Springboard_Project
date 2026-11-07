package com.carbontrack.carbontrackbackend.security.oauth2;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.Serializable;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class CookieUtilsTest {

    static class SampleData implements Serializable {
        private String key;
        private int value;

        public SampleData() {}
        public SampleData(String key, int value) {
            this.key = key;
            this.value = value;
        }
        public String getKey() { return key; }
        public int getValue() { return value; }
    }

    @Test
    void testAddAndGetCookie() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        CookieUtils.addCookie(response, "test_cookie", "hello_world", 100);

        Cookie cookie = response.getCookie("test_cookie");
        assertNotNull(cookie);
        assertEquals("hello_world", cookie.getValue());
        assertTrue(cookie.isHttpOnly());
        assertEquals("/", cookie.getPath());
        assertEquals("Lax", cookie.getAttribute("SameSite"));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(cookie);
        Optional<Cookie> retrieved = CookieUtils.getCookie(request, "test_cookie");
        assertTrue(retrieved.isPresent());
        assertEquals("hello_world", retrieved.get().getValue());
    }

    @Test
    void testDeleteCookie() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        Cookie cookie = new Cookie("cookie_to_delete", "val");
        request.setCookies(cookie);

        MockHttpServletResponse response = new MockHttpServletResponse();
        CookieUtils.deleteCookie(request, response, "cookie_to_delete");

        Cookie deleted = response.getCookie("cookie_to_delete");
        assertNotNull(deleted);
        assertEquals("", deleted.getValue());
        assertEquals(0, deleted.getMaxAge());
    }

    @Test
    void testSerializationAndDeserialization() {
        SampleData data = new SampleData("carbon", 2026);
        String serialized = CookieUtils.serialize(data);
        assertNotNull(serialized);
        assertFalse(serialized.isBlank());

        Cookie cookie = new Cookie("sample", serialized);
        SampleData deserialized = CookieUtils.deserialize(cookie, SampleData.class);
        assertNotNull(deserialized);
        assertEquals("carbon", deserialized.getKey());
        assertEquals(2026, deserialized.getValue());
    }
}
