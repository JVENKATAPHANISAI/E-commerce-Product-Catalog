ProductCatalogApplication.java 
 
package com.example.catalog; 
 
import org.springframework.boot.SpringApplication; 
import org.springframework.boot.autoconfigure.SpringBootApplication; 
 
@SpringBootApplication 
public class ProductCatalogApplication { 
    public static void main(String[] args) { 
        SpringApplication.run(ProductCatalogApplication.class, args); 
    } 
} 
 
 
entity/Product.java 
 
package com.example.catalog.entity; 
 
import jakarta.persistence.*; 
 
@Entity 
public class Product { 
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long productId; 
 
    private String name; 
    private String description; 
    private double price; 
    private String category; 
    private int stockQuantity; 
 
    // Getters and Setters 
} 
 
 
repository/ProductRepository.java 
 
package com.example.catalog.repository; 
 
import com.example.catalog.entity.Product; 
import org.springframework.data.jpa.repository.JpaRepository; 
import org.springframework.data.jpa.repository.Query; 
 
import java.util.List; 
 
public interface ProductRepository extends JpaRepository<Product, Long> { 
    List<Product> findByCategory(String category); 
    List<Product> findByPriceBetween(double min, double max); 
    List<Product> findByNameContainingIgnoreCase(String name); 
 
    @Query("SELECT p FROM Product p WHERE " + 
           "(:category IS NULL OR p.category = :category) AND " + 
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " + 
           "(:maxPrice IS NULL OR p.price <= :maxPrice)") 
    List<Product> filter(String category, Double minPrice, Double maxPrice); 
} 
 
 
controller/ProductController.java 
 
package com.example.catalog.controller; 
 
import com.example.catalog.entity.Product; 
import com.example.catalog.repository.ProductRepository; 
import org.springframework.beans.factory.annotation.Autowired; 
import org.springframework.http.ResponseEntity; 
import org.springframework.web.bind.annotation.*; 
 
import java.util.List; 
 
@RestController 
@RequestMapping("/api/products") 
public class ProductController { 
 
    @Autowired 
    private ProductRepository repo; 
 
    @GetMapping 
    public List<Product> getAll() { 
        return repo.findAll(); 
    } 
 
    @PostMapping 
    public Product create(@RequestBody Product p) { 
        return repo.save(p); 
    } 
 
    @PutMapping("/{id}") 
    public ResponseEntity<Product> update(@PathVariable Long id, @RequestBody Product p) 
{ 
        return repo.findById(id).map(existing -> { 
            existing.setName(p.getName()); 
            existing.setDescription(p.getDescription()); 
            existing.setPrice(p.getPrice()); 
            existing.setCategory(p.getCategory()); 
            existing.setStockQuantity(p.getStockQuantity()); 
            return ResponseEntity.ok(repo.save(existing)); 
        }).orElse(ResponseEntity.notFound().build()); 
    } 
 
    @DeleteMapping("/{id}") 
    public ResponseEntity<Void> delete(@PathVariable Long id) { 
        return repo.findById(id).map(p -> { 
            repo.delete(p); 
            return ResponseEntity.ok().build(); 
        }).orElse(ResponseEntity.notFound().build()); 
    } 
 
    @GetMapping("/search") 
    public List<Product> searchByName(@RequestParam String name) { 
        return repo.findByNameContainingIgnoreCase(name); 
    } 
 
    @GetMapping("/filter") 
    public List<Product> filter( 
        @RequestParam(required = false) String category, 
        @RequestParam(required = false) Double minPrice, 
        @RequestParam(required = false) Double maxPrice 
    ) { 
        return repo.filter(category, minPrice, maxPrice); 
    } 
} 
 
 
config/SecurityConfig.java 
 
package com.example.catalog.config; 
 
import org.springframework.context.annotation.Bean; 
import org.springframework.context.annotation.Configuration; 
import org.springframework.security.config.annotation.web.builders.HttpSecurity; 
import org.springframework.security.web.SecurityFilterChain; 
 
@Configuration 
public class SecurityConfig { 
    @Bean 
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception { 
        http 
            .csrf().disable() 
            .authorizeHttpRequests(auth -> auth 
                .requestMatchers("/api/products").hasAnyRole("ADMIN", "USER") 
                .requestMatchers("/api/products/**").hasRole("ADMIN") 
                .anyRequest().authenticated() 
            ) 
            .httpBasic(); 
        return http.build(); 
    } 
} 
 
 
resources/application.properties 
 
spring.datasource.url=jdbc:mysql://localhost:3306/product_catalog 
spring.datasource.username=root 
spring.datasource.password=yourpassword 
spring.jpa.hibernate.ddl-auto=update 
spring.jpa.show-sql=true
