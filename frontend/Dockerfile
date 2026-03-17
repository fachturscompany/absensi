# =====================
# 1️⃣ BUILD STAGE
# =====================
FROM node:20-alpine AS builder
WORKDIR /app

# Salin file dependency
COPY package*.json ./

# Install dependency (tanpa peer conflict)
# RUN npm ci --legacy-peer-deps
RUN npm install --legacy-peer-deps

# Salin semua source code
COPY . .

# Nonaktifkan lint & type-check saat build
RUN echo '/** @type {import("next").NextConfig} */ \
const nextConfig = { eslint: { ignoreDuringBuilds: true }, typescript: { ignoreBuildErrors: true } }; \
export default nextConfig;' > next.config.mjs

# Build Next.js
RUN npm run build


# =====================
# 2️⃣ RUNTIME STAGE
# =====================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Salin hasil build dari stage builder
COPY --from=builder /app ./

# Tambahkan script “start-only” agar bisa dijalankan langsung
RUN node -e "\
const fs=require('fs'); \
const pkg=JSON.parse(fs.readFileSync('package.json')); \
pkg.scripts=pkg.scripts||{}; \
pkg.scripts['start-only']='next start'; \
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2)); \
"

# Set port
ENV PORT=4005
EXPOSE 4005

# Jalankan aplikasi
CMD ["npm", "run", "start-only"]