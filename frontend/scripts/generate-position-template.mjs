import path from "node:path"
import fs from "node:fs/promises"
import * as XLSX from "xlsx"

const OUTPUT_DIR = path.resolve("public/templates")
const TEMPLATE_PATH = path.join(OUTPUT_DIR, "position-import-template.xlsx")

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
}

function createTemplateWorkbook() {
  const headers = ["Code", "Title", "Description", "Level", "Active Status"]
  const instructions = [
    "Contoh: MGR",
    "Manager",
    "Manajerial level menengah",
    "3",
    "true",
  ]

  const worksheet = XLSX.utils.aoa_to_sheet([headers, instructions])

  const columnWidths = [
    { wch: 15 }, // Code
    { wch: 30 }, // Title
    { wch: 40 }, // Description
    { wch: 10 }, // Level
    { wch: 15 }, // Active Status
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
  console.log(`Position template generated at ${TEMPLATE_PATH}`)
}

generateTemplate().catch((error) => {
  console.error("Failed to generate position template:", error)
  process.exitCode = 1
})


