# <%= projectName %>

Created with `llscreate` · Maven + JDK 21.

Author: <%= answers.authorName %>

## Prerequisites

- JDK 21+
- Maven 3.9+ (or use the bundled `./mvnw` if you add Maven Wrapper)

## Getting started

```bash
mvn compile
mvn exec:java          # 运行 com.example.Main
```

## Package layout

The default package is `com.example`. To rename:

1. Move `src/main/java/com/example/` to your package path
2. Update the `package` declaration in `Main.java`
3. Update `<mainClass>` in `pom.xml`

## Scripts

- `mvn compile` — 编译
- `mvn exec:java` — 运行 Main
- `mvn test` — 跑测试（暂未配置）
- `mvn package` — 打 jar
