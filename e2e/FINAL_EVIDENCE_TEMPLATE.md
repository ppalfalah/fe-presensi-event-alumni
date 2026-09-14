# Final Black-Box Evidence Template

Isi satu baris per test case setelah eksekusi final. `Actual Output` dan `Status`
harus berasal dari hasil browser yang benar-benar diamati, bukan dari prediksi
statis atau Expected Output.

| ID Test Case | Fitur | Komponen Uji | Kondisi | Teknik | Expected Output | Actual Output | Status | Catatan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC-BB___ |  |  |  |  |  | _(hasil observasi final)_ | _(PASS/FAIL/SPECIAL_ENV)_ |  |

Panduan singkat:

- TC-BB020 dan TC-BB028 dicatat sebagai `SPECIAL_ENV` sampai pengujian OAuth
  deterministik tersedia.
- Untuk PASS, tulis perilaku UI utama yang terlihat dan bukti navigasi/download
  bila relevan.
- Untuk FAIL, tulis Expected, Observed, dan bukti faktual seperti teks UI,
  route, status kontrol, atau artefak yang tidak dihasilkan.
- Catatan kegagalan menjelaskan mismatch yang diamati tanpa menyarankan atau
  mengasumsikan perbaikan produk.
- EXTRA-* dan smoke tidak dimasukkan ke inventaris 244 test case resmi.
