import path from "node:path"
import fs from "node:fs/promises"
import * as XLSX from "xlsx"

const OUTPUT_DIR = path.resolve("public/templates")
const TEMPLATE_PATH = path.join(OUTPUT_DIR, "finger-import-template.xlsx")

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
}

function createTemplateWorkbook() {
  const headers = [
    "NIK",
    "Nama Lengkap",
    "Nickname",
    "NISN",
    "Jenis Kelamin",
    "Tempat Lahir",
    "Tanggal Lahir",
    "Agama",
    "Jalan",
    "RT",
    "RW",
    "Dusun",
    "Kelurahan",
    "Kecamatan",
    "No Telepon",
    "Email",
    "Group"
  ]

  const instructions = [
    "Contoh: 3578XXXXXXXXXXXX",
    "Contoh: Budi Santoso",
    "Contoh: Budi",
    "Contoh: 1234567890",
    "Contoh: L atau P",
    "Contoh: Surabaya",
    "Contoh: 2005-08-17 (YYYY-MM-DD)",
    "Contoh: Islam",
    "Contoh: Jl. Melati No. 10",
    "Contoh: 01",
    "Contoh: 05",
    "Contoh: Dusun Melati",
    "Contoh: Kelurahan Sukamaju",
    "Contoh: Kecamatan Sukamakmur",
    "Contoh: +628123456789",
    "Contoh: budi@example.com",
    "Contoh: X-RPL atau nama Group"
  ]

  const worksheet = XLSX.utils.aoa_to_sheet([headers, instructions])

  worksheet["!cols"] = [
    { wch: 20 }, // NIK
    { wch: 25 }, // Nama Lengkap
    { wch: 18 }, // Nickname
    { wch: 16 }, // NISN
    { wch: 14 }, // Jenis Kelamin
    { wch: 18 }, // Tempat Lahir
    { wch: 18 }, // Tanggal Lahir
    { wch: 16 }, // Agama
    { wch: 30 }, // Jalan
    { wch: 8 },  // RT
    { wch: 8 },  // RW
    { wch: 18 }, // Dusun
    { wch: 20 }, // Kelurahan
    { wch: 20 }, // Kecamatan
    { wch: 18 }, // No Telepon
    { wch: 25 }, // Email
    { wch: 22 }, // Department
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template")
  return workbook
}

async function generateTemplate() {
  await ensureOutputDir()
  const workbook = createTemplateWorkbook()
  XLSX.writeFile(workbook, TEMPLATE_PATH)
  console.log(`Fingerprint template generated at ${TEMPLATE_PATH}`)
}

generateTemplate().catch((error) => {
  console.error("Failed to generate fingerprint template:", error)
  process.exitCode = 1
})

