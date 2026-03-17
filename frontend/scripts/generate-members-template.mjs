import path from "node:path"
import fs from "node:fs/promises"
import * as XLSX from "xlsx"

const OUTPUT_DIR = path.resolve("public/templates")
const TEMPLATE_PATH = path.join(OUTPUT_DIR, "members-import-template.xlsx")

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
}

function createTemplateWorkbook() {
  const headers = ["Nama Lengkap", "Email", "Nomor Telepon", "Group", "Peran", "Status"]
  const instructions = [
    "Contoh: Budi Santoso",
    "nama@perusahaan.com",
    "08123456789",
    "Masukkan nama grup",
    "Pengguna / Petugas",
    "Aktif",
  ]

  const worksheet = XLSX.utils.aoa_to_sheet([headers, instructions])
  
  // Set column widths to prevent truncation
  const columnWidths = [
    { wch: 25 }, // Nama Lengkap
    { wch: 30 }, // Email
    { wch: 18 }, // Nomor Telepon
    { wch: 25 }, // Group
    { wch: 20 }, // Peran
    { wch: 15 }, // Status
  ]
  worksheet['!cols'] = columnWidths
  
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template")
  return workbook
}

async function generateTemplate() {
  await ensureOutputDir()
  const workbook = createTemplateWorkbook()
  XLSX.writeFile(workbook, TEMPLATE_PATH)
  console.log(`Members template generated at ${TEMPLATE_PATH}`)
}

generateTemplate().catch((error) => {
  console.error("Failed to generate members template:", error)
  process.exitCode = 1
})

