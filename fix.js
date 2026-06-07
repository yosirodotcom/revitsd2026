import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mappingsRaw = `
SD Negeri 01 Ella Hilir	https://maps.app.goo.gl/GF3Rwpqr32NSTc6N9
SD Negeri 01 Pemuar	https://maps.app.goo.gl/Pqo3F512GBqngW2R9
SD Negeri 01 Pinoh Utara	https://maps.app.goo.gl/7GGh7kKFkp5hCwxC9
SD Negeri 02 Belitang	https://maps.app.goo.gl/hS8P4zBpdTkNHsXn7
SD Negeri 02 Keberak	https://maps.app.goo.gl/kFiEnjppU1QBRksV8
SD Negeri 03 Jongkat	https://maps.app.goo.gl/wUrHLnHZMci9aBDp6
SD Negeri 04 Kampung Baru	https://maps.app.goo.gl/bNVC6owYQbVdmHRy6
SD Negeri 04 Pontianak Timur	https://maps.app.goo.gl/hmvk7QkVLRdPEqLz6
SD Negeri 04 Setolo	https://maps.app.goo.gl/NiVvVLkP8ZUvxhuk9
SD Negeri 04 Tanjung Putat	https://maps.app.goo.gl/RU5wgBcghP1TCZZA6
SD Negeri 06 Nanga Seberuang	https://maps.app.goo.gl/PDcgzN8UkwRjMkiu5
SD Negeri 06 Pontianak Timur	https://maps.app.goo.gl/hxPXBacboVeRHbuE6
SD Negeri 07 Mangkau	https://maps.app.goo.gl/1FMCWXf8ukqjbwwz6
SD Negeri 07 Raba	https://maps.app.goo.gl/rirYbFerZmxmqFUs8
SD Negeri 08 Benua Kayong	https://maps.app.goo.gl/8wSRa8vZMpVRkPoq9
SD Negeri 08 Sungai Pinyuh	https://maps.app.goo.gl/haDFuhyaaDub2A2h9
SD Negeri 09 Selayang	https://maps.app.goo.gl/Z4basNxmBXxXFCeB9
SD Negeri 10 Ampadan	https://maps.app.goo.gl/evXDsCysyZSqg1oWA
SD Negeri 10 Melugai	https://maps.app.goo.gl/f7KrB958WiF43Tcm7
SD Negeri 10 Sandai	https://maps.app.goo.gl/U5PwUQqmYs44JnkV8
SD Negeri 10 Segedong	https://maps.app.goo.gl/RgKnJyAUCST11j6C6
SD Negeri 10 Senangak	https://maps.app.goo.gl/eaRVix9CheXFGEHt8
SD Negeri 11 Sandai	https://maps.app.goo.gl/9E4e1qxtZUj9jTof6
SD Negeri 12 Nyonak	https://maps.app.goo.gl/UfBCAfWc8m4NKr7CA
SD Negeri 15 UPT III Silat	https://maps.app.goo.gl/SFTwDLojNQcLwVUw8
SD Negeri 17 Mungguk	https://maps.app.goo.gl/ETtEDSnMmg417JBy6
SD Negeri 18 Nanga Toran	https://maps.app.goo.gl/Uakb5PKLEC1244gd7
SD Negeri 19 Tanjung Tengang	https://maps.app.goo.gl/VWZMmroSseNtA57W9
SD Negeri 20 Pakato	https://maps.app.goo.gl/kVpKZ88no1atSmWN9
SD Negeri 20 Pakucing II	https://maps.app.goo.gl/dk6hLkkyGc8ah5Fh8
SD Negeri 21 Tempapan Hulu	https://maps.app.goo.gl/5YdnEDMCL6tEbZQr9
SD Negeri 23 Periang	https://maps.app.goo.gl/Y7kbYrs7LX4AnmXFA
SD Negeri 26 Raba Bayur	https://maps.app.goo.gl/85LSSc2PEodgJvSK6
SD Negeri 27 Pontianak Timur	https://maps.app.goo.gl/TV1dvqX6MVNJakNx9
SD Negeri 27 Tengkook	https://maps.app.goo.gl/vXUjcdEfdftqenxv5
SD Negeri 31 Begantung	https://maps.app.goo.gl/CrMYHWPJSJWCNxDVA
SD Negeri 32 Pontianak Tenggara	https://maps.app.goo.gl/BciFDQP9M594QUd18
SD Negeri 34 Suka Ramai	https://maps.app.goo.gl/fqANSgA2zbXTiaGG7
SD Negeri 44 Sungai Akar	https://maps.app.goo.gl/jqBx9hJ6DkJHKyWz5
SD Negeri 62 Singkawang	https://maps.app.goo.gl/wrnMs4d8j6KexJeg6
SD Panca Setya 01 Sintang	https://maps.app.goo.gl/WQUjsNEqahBA1eY6A
`;

const mapObj = {};
mappingsRaw.trim().split('\n').forEach(line => {
  const parts = line.split('\t');
  if (parts.length >= 2) {
    mapObj[parts[0].trim()] = parts[1].trim();
  }
});

const initialSchools = [
  { npsn: "30104982", nama_sekolah: "SD Negeri 19 Tanjung Tengang", kabupaten: "Melawi" },
  { npsn: "30105005", nama_sekolah: "SD Negeri 01 Pemuar", kabupaten: "Melawi" },
  { npsn: "30104987", nama_sekolah: "SD Negeri 02 Keberak", kabupaten: "Melawi" },
  { npsn: "30104971", nama_sekolah: "SD Negeri 01 Pinoh Utara", kabupaten: "Melawi" },
  { npsn: "30104991", nama_sekolah: "SD Negeri 01 Ella Hilir", kabupaten: "Melawi" },
  { npsn: "30102754", nama_sekolah: "SD Negeri 18 Nanga Toran", kabupaten: "Sintang" },
  { npsn: "30102686", nama_sekolah: "SD Negeri 23 Periang", kabupaten: "Sintang" },
  { npsn: "30105740", nama_sekolah: "SD Negeri 17 Mungguk", kabupaten: "Sekadau" },
  { npsn: "30105938", nama_sekolah: "SD Negeri 44 Sungai Akar", kabupaten: "Sekadau" },
  { npsn: "30104282", nama_sekolah: "SD Negeri 27 Tengkook", kabupaten: "Landak" },
  { npsn: "30104275", nama_sekolah: "SD Negeri 26 Raba Bayur", kabupaten: "Landak" },
  { npsn: "30103866", nama_sekolah: "SD Negeri 10 Sandai", kabupaten: "Ketapang" },
  { npsn: "30103918", nama_sekolah: "SD Negeri 11 Sandai", kabupaten: "Ketapang" },
  { npsn: "30105665", nama_sekolah: "SD Negeri 12 Nyonak", kabupaten: "Sekadau" },
  { npsn: "30102233", nama_sekolah: "SD Negeri 10 Melugai", kabupaten: "Sanggau" },
  { npsn: "30102127", nama_sekolah: "SD Negeri 04 Kampung Baru", kabupaten: "Sanggau" },
  { npsn: "30101565", nama_sekolah: "SD Negeri 03 Jongkat", kabupaten: "Mempawah" },
  { npsn: "30107886", nama_sekolah: "SD Negeri 34 Suka Ramai", kabupaten: "Landak" },
  { npsn: "30104701", nama_sekolah: "SD Negeri 20 Pakato", kabupaten: "Landak" },
  { npsn: "30104522", nama_sekolah: "SD Negeri 07 Raba", kabupaten: "Landak" },
  { npsn: "30104241", nama_sekolah: "SD Negeri 31 Begantung", kabupaten: "Landak" },
  { npsn: "30104510", nama_sekolah: "SD Negeri 04 Setolo", kabupaten: "Landak" },
  { npsn: "30104344", nama_sekolah: "SD Negeri 10 Ampadan", kabupaten: "Landak" },
  { npsn: "30100855", nama_sekolah: "SD Negeri 10 Segedong", kabupaten: "Mempawah" },
  { npsn: "30101553", nama_sekolah: "SD Negeri 08 Sungai Pinyuh", kabupaten: "Mempawah" },
  { npsn: "30105395", nama_sekolah: "SD Negeri 27 Pontianak Timur", kabupaten: "Pontianak" },
  { npsn: "30105415", nama_sekolah: "SD Negeri 06 Pontianak Timur", kabupaten: "Pontianak" },
  { npsn: "30105277", nama_sekolah: "SD Negeri 04 Pontianak Timur", kabupaten: "Pontianak" },
  { npsn: "30104187", nama_sekolah: "SD Negeri 10 Senangak", kabupaten: "Bengkayang" },
  { npsn: "30103967", nama_sekolah: "SD Negeri 20 Pakucing II", kabupaten: "Bengkayang" },
  { npsn: "30105386", nama_sekolah: "SD Negeri 32 Pontianak Tenggara", kabupaten: "Pontianak" },
  { npsn: "69888560", nama_sekolah: "SD Negeri 21 Tempapan Hulu", kabupaten: "Sambas" },
  { npsn: "30100435", nama_sekolah: "SD Negeri 04 Tanjung Putat", kabupaten: "Sambas" },
  { npsn: "30105548", nama_sekolah: "SD Negeri 62 Singkawang", kabupaten: "Singkawang" },
  { npsn: "30102503", nama_sekolah: "SD Panca Setya 01 Sintang", kabupaten: "Sintang" },
  { npsn: "30103248", nama_sekolah: "SD Negeri 06 Nanga Seberuang", kabupaten: "Kapuas Hulu" },
  { npsn: "30102820", nama_sekolah: "SD Negeri 15 UPT III Silat", kabupaten: "Kapuas Hulu" },
  { npsn: "30102240", nama_sekolah: "SD Negeri 09 Selayang", kabupaten: "Sanggau" },
  { npsn: "30105876", nama_sekolah: "SD Negeri 02 Belitang", kabupaten: "Sekadau" },
  { npsn: "30103889", nama_sekolah: "SD Negeri 08 Benua Kayong", kabupaten: "Ketapang" },
  { npsn: "30102041", nama_sekolah: "SD Negeri 07 Mangkau", kabupaten: "Sanggau" }
];

const updatedSchools = initialSchools.map(s => {
  const koordinat = mapObj[s.nama_sekolah] || "";
  return {
    ...s,
    koordinat
  };
});

const content = `// Data awal 41 Sekolah Dasar pelaksana program revitalisasi SD 2027
// Di-seeding dari file data_sekolah.csv
export const initialSchools = ${JSON.stringify(updatedSchools, null, 2).replace(/"(npsn|nama_sekolah|kabupaten|koordinat)":/g, '$1:')};
`;

fs.writeFileSync(path.join(__dirname, 'src/data/initialSchools.js'), content, 'utf8');
console.log('Successfully updated initialSchools.js');
