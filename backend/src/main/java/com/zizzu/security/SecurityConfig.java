package com.zizzu.security;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/** Security rules: which routes are public, who may write, and how CORS is handled. */
@Configuration
public class SecurityConfig {
  /** GET routes that anyone may call without logging in. */
  private static final String[] PUBLIC_GET_ROUTES = {
    "/products/**",
  };

  /**
   * Builds the filter chain. Public GET routes are open, writes need the {@code write} authority,
   * and everything else requires login.
   */
  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.cors(Customizer.withDefaults())
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(HttpMethod.GET, PUBLIC_GET_ROUTES)
                    .permitAll()
                    .anyRequest()
                    .hasAuthority("write"))
        .oauth2Login(Customizer.withDefaults())
        .logout(logout -> logout.logoutSuccessUrl("/"));
    return http.build();
  }

  /** Applies the allowed frontend origins to every route. */
  @Bean
  public CorsConfigurationSource corsConfigurationSource(
      @Value("${app.cors.origins}") List<String> origins) {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(origins);
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }

  /** Grants {@code write} to verified users whose email is in {@code app.write-emails}. */
  @Bean
  public OAuth2UserService<OidcUserRequest, OidcUser> customOidcUserService(
      @Value("${app.write-emails}") List<String> writeEmails) {

    return userRequest -> {
      OidcUser user = new OidcUserService().loadUser(userRequest);

      if (!writeEmails.contains(user.getEmail())) {
        return user;
      }

      return new DefaultOidcUser(List.of(new SimpleGrantedAuthority("write")), user.getIdToken());
    };
  }
}
