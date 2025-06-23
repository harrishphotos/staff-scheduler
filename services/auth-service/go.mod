module github.com/salobook/services/auth-service

go 1.24.3

toolchain go1.24.4

require (
	github.com/alexedwards/argon2id v1.0.0
	github.com/gofiber/fiber/v2 v2.52.0
	github.com/google/uuid v1.5.0
	github.com/joho/godotenv v1.5.1
	github.com/o1egl/paseto v1.0.0
	services/shared v0.0.0-00010101000000-000000000000
)

replace services/shared => ../shared

require (
	github.com/aead/chacha20 v0.0.0-20180709150244-8b13a72661da // indirect
	github.com/aead/chacha20poly1305 v0.0.0-20170617001512-233f39982aeb // indirect
	github.com/aead/poly1305 v0.0.0-20180717145839-3fee0db0b635 // indirect
	github.com/andybalholm/brotli v1.0.5 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/pgx/v5 v5.5.5 // indirect
	github.com/jackc/puddle/v2 v2.2.1 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	github.com/klauspost/compress v1.17.0 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mattn/go-runewidth v0.0.15 // indirect
	github.com/pkg/errors v0.8.0 // indirect
	github.com/rivo/uniseg v0.2.0 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasthttp v1.51.0 // indirect
	github.com/valyala/tcplisten v1.0.0 // indirect
	golang.org/x/crypto v0.17.0 // indirect
	golang.org/x/sync v0.9.0 // indirect
	golang.org/x/sys v0.15.0 // indirect
	golang.org/x/text v0.20.0 // indirect
	gorm.io/driver/postgres v1.5.11 // indirect
	gorm.io/gorm v1.26.1 // indirect
)
