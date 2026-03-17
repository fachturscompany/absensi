import XLSX from 'xlsx';
import { join } from 'path';

const groups = [
  'X TKJ B',
  'X RPL D',
  'XI METRO B',
  'XII METRO B',
  'XI TKJ B',
  'XII TKJ A',
  'X ELIN B',
  'XI RPL A',
  'XII RPL A',
  'XII TKJ C',
  'X ELIN A',
  'XI TKJ A',
  'XI ELIN B',
  'XI RPL B',
  'X TKJ C',
  'X METRO B',
  'XI METRO A',
  'XII METRO A',
  'XI TKJ D',
  'X RPL A',
  'XII ELIN A',
  'X TKJ A',
  'X TKJ D',
  'XII RPL D',
  'XII RPL C',
  'XIII METRO A',
  'X METRO A',
  'XI RPL C',
  'XI RPL D',
  'X RPL B',
  'XII RPL B',
  'XIII METRO B',
  'XI ELIN A',
  'XII TKJ D',
  'XII TKJ B',
  'XI TKJ C',
  'X RPL C',
];

// Buat workbook
const wb = XLSX.utils.book_new();

// Sheet 1: Panduan
const panduanData = [
  ['PANDUAN IMPORT GROUP/DEPARTMENT'],
  [''],
  ['KOLOM WAJIB:'],
  ['1. Name - Nama group/department (wajib)'],
  [''],
  ['KOLOM OPSIONAL:'],
  ['- Code - Kode unik group (opsional, jika kosong akan auto-generate)'],
  ['- Description - Deskripsi group'],
  ['- Active Status - Status aktif (true/false), default: true'],
  [''],
  ['CONTOH DATA:'],
  ['Code: IT-001, HR-001, FIN-001'],
  ['Name: IT Department, HR Department'],
  ['Description: Deskripsi singkat tentang department'],
  ['Active Status: true (aktif) atau false (tidak aktif)'],
  [''],
  ['CATATAN PENTING:'],
  ['✅ Jika Name sudah ada, data akan di-UPDATE'],
  ['✅ Jika Name belum ada, data akan DIBUAT BARU'],
  ['✅ Active Status: gunakan "true" atau "false" (lowercase)'],
  ['✅ Code harus unik jika diisi'],
  [''],
  ['LANGKAH IMPORT:'],
  ['1. Isi data group di sheet "Data Group"'],
  ['2. Upload file Excel di halaman Import Group'],
  ['3. Mapping kolom akan otomatis terdeteksi'],
  ['4. Test import untuk validasi data'],
  ['5. Klik Import untuk proses ke database'],
  [''],
  ['TIPS:'],
  ['💡 Gunakan format Excel (.xlsx) untuk hasil terbaik'],
  ['💡 Pastikan Name tidak ada yang duplicate'],
  ['💡 Code bisa dikosongkan, sistem akan generate otomatis'],
];

const panduanWs = XLSX.utils.aoa_to_sheet(panduanData);
panduanWs['!cols'] = [{ wch: 80 }];
XLSX.utils.book_append_sheet(wb, panduanWs, 'Panduan');

// Sheet 2: Data Group
const dataGroupData = [
  ['Code', 'Name', 'Description', 'Active Status'], // Header
  ...groups.map(name => ['', name, '', 'true']) // Data rows (Code kosong, Description kosong, Active Status = true)
];

const dataGroupWs = XLSX.utils.aoa_to_sheet(dataGroupData);
dataGroupWs['!cols'] = [
  { wch: 15 }, // Code
  { wch: 20 }, // Name
  { wch: 40 }, // Description
  { wch: 15 }, // Active Status
];
XLSX.utils.book_append_sheet(wb, dataGroupWs, 'Data Group');

// Simpan file
const outputPath = join(process.cwd(), 'groups-import.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ File berhasil dibuat: ${outputPath}`);
console.log(`📊 Total ${groups.length} group`);
console.log(`📄 Sheet: Panduan dan Data Group`);

