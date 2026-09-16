# Interactive Transformation Playground — Pertemuan 3

**Mata Kuliah:** EF234504 — Grafika Komputer  
**Topik:** Interactive Transformation & Coordinate System dengan WebGL2  
**NRP:** 5025241085
**Nama:** Mario Napitupulu
**NRP:** 5025241109
**Nama:** Nathanael Oliver

## Deskripsi
Project ini mengimplementasikan konsep local coordinate, world placement melalui Model Matrix, translation, rotation, uniform/non-uniform scaling, homogeneous coordinate, matrix multiplication, transform composition, keyboard state, delta time, automatic animation, transform-order comparison, pivot, coordinate axes, parent-child hierarchy, orbit challenge, mouse translation, preset, dan HUD transform.

## Struktur
```text
praktikum-transform-03/
├── index.html
├── style.css
├── main.js
├── matrix3.js
├── README.md
├── screenshot.png
└── .gitignore
```

## Cara Menjalankan
Gunakan local development server. Contoh:

```bash
python3 -m http.server 8000
```

Buka `http://localhost:8000/` pada folder project.

## Kontrol
| Input | Fungsi |
|---|---|
| `W A S D` | Gerak Object A |
| Arrow Keys | Gerak Object A |
| `Q / E` | Rotasi berlawanan / searah jarum jam |
| `+ / -` | Uniform scaling |
| `Z / X` | Scale X turun / naik |
| `C / V` | Scale Y turun / naik |
| `1 / 2 / 3` | Preset transform |
| `T` | Toggle transform order |
| `O` | Toggle orbit challenge |
| `M` | Mouse translation mode |
| `P` | Pause / Resume animasi |
| `Y` | Pivot demo seperti engsel pintu |
| `R` | Reset transform |
| `H` | Toggle parent-child challenge |
| `SPACE` | Pause / Resume animasi |

## UI / Challenge
- Rotation speed dan scale speed dapat diatur melalui slider.
- Auto Object B dapat diaktifkan/nonaktifkan.
- Coordinate axes dan pivot marker dapat diaktifkan/nonaktifkan.
- Parent-child menampilkan child yang mengikuti parent melalui `ChildWorld = ParentWorld × ChildLocal`.
- Toggle order membandingkan composition `T × R × S` dengan `T × R`.
- Pivot demo dapat diaktifkan melalui tombol UI atau `Y`. Pivot demo menggunakan composition `T(position) × T(pivot) × R × S × T(-pivot)`.
- Orbit challenge membuat object bergerak mengitari world origin.

## Matrix Convention
Project menggunakan **column-vector convention** dan matrix 3×3 untuk transformasi 2D. Vertex shader menerima homogeneous position `(x, y, 1)` dan menghitung:

```text
P' = M × P
```

Untuk TRS:

```text
P' = T × R × S × P
```

Dengan konvensi ini, transform paling dekat dengan vertex diterapkan lebih dahulu.

## 30 Pertanyaan Pemahaman

1. **Apa perbedaan local coordinate dan world coordinate?**  
   Local coordinate menyatakan posisi vertex relatif terhadap origin object. World coordinate menyatakan posisi object setelah Model Matrix menempatkannya di scene.

2. **Apa fungsi object origin?**  
   Origin menjadi referensi lokal object dan biasanya menjadi pivot default untuk rotation serta scaling.

3. **Apa fungsi Model Matrix?**  
   Model Matrix mengubah vertex dari local coordinate menjadi posisi object di world coordinate.

4. **Mengapa geometry sebaiknya tetap berada di local space?**  
   Geometry dapat disimpan sekali di GPU dan digunakan ulang untuk banyak instance/object. Yang berubah cukup state transform-nya.

5. **Apa perbedaan translation, rotation, dan scaling?**  
   Translation menggeser posisi, rotation memutar orientasi, dan scaling mengubah ukuran.

6. **Apa perbedaan uniform dan non-uniform scaling?**  
   Uniform scaling menggunakan faktor X dan Y yang sama. Non-uniform scaling menggunakan faktor yang berbeda sehingga bentuk dapat melebar atau memanjang.

7. **Mengapa homogeneous coordinate diperlukan?**  
   Homogeneous coordinate memungkinkan translation, rotation, dan scaling direpresentasikan dalam satu bentuk matrix yang konsisten.

8. **Mengapa titik menggunakan w = 1?**  
   Dengan `w = 1`, komponen translation pada matrix ikut memengaruhi titik.

9. **Mengapa direction vector dapat menggunakan w = 0?**  
   Dengan `w = 0`, translation tidak memengaruhi vector arah.

10. **Mengapa transformation matrix menggunakan 3×3 untuk kasus 2D ini?**  
    Karena `(x, y, 1)` membutuhkan tiga komponen sehingga transformasi affine 2D dapat direpresentasikan dengan matrix 3×3.

11. **Mengapa rotation membutuhkan sin dan cos?**  
    Karena koordinat hasil rotasi merupakan kombinasi komponen X dan Y berdasarkan sudut, yang secara matematis dinyatakan dengan sin dan cos.

12. **Mengapa JavaScript perlu konversi degree ke radian?**  
    `Math.sin()` dan `Math.cos()` menerima sudut dalam radian.

13. **Apa yang dimaksud transform composition?**  
    Transform composition adalah penggabungan beberapa matrix transformasi menjadi satu matrix gabungan.

14. **Mengapa T × R berbeda dengan R × T?**  
    Matrix multiplication tidak komutatif. Urutan perkalian menentukan urutan transformasi dan hasil akhir object.

15. **Apa fungsi matrix uniform?**  
    Uniform `u_matrix` menyimpan transformasi yang digunakan oleh semua vertex dalam satu draw call.

16. **Apa perbedaan attribute dan uniform?**  
    Attribute membawa data yang dapat berbeda untuk setiap vertex, sedangkan uniform bernilai sama untuk seluruh draw call.

17. **Mengapa matrix uniform lebih baik daripada mengubah seluruh vertex pada CPU untuk transformasi object?**  
    Vertex buffer dapat tetap statis di GPU sehingga CPU tidak perlu menulis ulang seluruh geometry setiap frame.

18. **Mengapa satu geometry buffer dapat digunakan untuk beberapa object?**  
    Karena setiap object dapat memakai buffer yang sama tetapi mengirim Model Matrix dan color uniform yang berbeda.

19. **Apa hubungan pivot dengan rotation?**  
    Pivot menentukan titik yang dijadikan pusat rotasi.

20. **Apa hubungan pivot dengan scaling?**  
    Scaling juga dapat dilakukan terhadap pivot tertentu dengan mentranslasikan pivot ke origin, melakukan scaling, lalu mentranslasikan kembali.

21. **Apa hubungan Model Matrix dengan local dan world coordinate?**  
    Model Matrix menjadi jembatan dari local coordinate menuju world coordinate.

22. **Apa fungsi View Matrix secara konseptual?**  
    View Matrix mengubah world coordinate menjadi coordinate yang relatif terhadap kamera.

23. **Apa fungsi Projection Matrix secara konseptual?**  
    Projection Matrix memetakan coordinate kamera ke clip coordinate sesuai model proyeksi yang dipakai.

24. **Apa hubungan clip coordinate dan NDC?**  
    Setelah projection menghasilkan clip coordinate, pembagian dengan `w` menghasilkan Normalized Device Coordinates (NDC).

25. **Apa yang dilakukan perspective divide?**  
    Komponen X, Y, dan Z clip coordinate dibagi dengan W.

26. **Apa fungsi viewport transform?**  
    Viewport mengubah NDC ke koordinat pixel pada area canvas/window.

27. **Mengapa state-based keyboard input cocok untuk kontrol kontinu?**  
    Program cukup menyimpan key state dan memeriksanya setiap frame sehingga gerakan berlangsung selama tombol ditahan.

28. **Mengapa deltaTime diperlukan?**  
    Agar perpindahan, rotasi, dan scaling berbasis waktu nyata, bukan jumlah frame, sehingga lebih konsisten pada FPS berbeda.

29. **Bagaimana parent transform memengaruhi child?**  
    Child menggunakan local transform sendiri kemudian digabungkan dengan parent world transform: `ChildWorld = ParentWorld × ChildLocal`.

30. **Mengapa matrix convention harus konsisten?**  
    Layout matrix, vector convention, urutan perkalian, dan interpretasi shader harus cocok. Jika tercampur, hasil transformasi dapat salah.

## Eksperimen
### Translation
Object A dapat diuji pada posisi `(-0.5, 0)` dan `(0.5, 0.4)`. Nilai X/Y langsung menentukan perpindahan relatif terhadap world origin NDC.

### Rotation
Uji `0°`, `90°`, dan `180°`. Bentuk/geometry lokal tetap sama; orientasi object dan posisi vertex hasil transformasi yang terlihat pada canvas berubah.

### Scaling
Uji `(2,2)` dan `(2,0.5)`. Yang pertama mempertahankan proporsi, sedangkan yang kedua melebarkan sumbu X dan memendekkan sumbu Y.

### Transform Order
Uji `T × R × S` dan mode pembanding `T × R`. Perubahan composition dapat menghasilkan posisi/orientasi/ukuran visual yang berbeda karena urutan transformasi memengaruhi hasil.

### Pivot
Pivot rectangle dapat diamati melalui tombol `P` atau pivot demo pada UI. Saat pivot dipindahkan dari pusat ke sisi, rotation terlihat seperti object berputar pada engsel.

## Test Case
| No | Pengujian | Hasil yang Diharapkan |
|---:|---|---|
| 1 | Load halaman | Canvas dan UI tampil |
| 2 | Identity / awal | Object tampil tanpa transform tambahan |
| 3 | WASD / Arrow | Translation X/Y kontinu |
| 4 | Q/E | Rotation kontinu |
| 5 | +/- | Uniform scaling |
| 6 | Z/X | Scale X berubah |
| 7 | C/V | Scale Y berubah |
| 8 | R | Transform kembali ke awal |
| 9 | Auto Object B | Rotation dan scaling otomatis |
| 10 | Toggle order | Composition berubah |
| 11 | Axis | Origin dan sumbu terlihat |
| 12 | Pivot | Pivot dapat diamati |
| 13 | Parent-child | Child mengikuti parent |
| 14 | Orbit | Object bergerak mengitari origin |
| 15 | Mouse mode | Klik canvas memindahkan Object A |
| 16 | HUD | Nilai transform diperbarui |
| 17 | Normal usage | Console tidak menunjukkan error runtime normal |

## Debugging
Periksa shader compile/link, uniform location, `NaN` pada matrix, nilai scale, posisi di luar NDC, degree-vs-radian, waktu pengiriman uniform sebelum draw call, urutan composition, dan konsistensi matrix convention.

## Refleksi
Konsep yang paling mudah adalah translation karena hubungan nilai X/Y dengan posisi object dapat langsung diamati. Bagian yang paling menantang adalah matrix multiplication dan transform order karena hasilnya sangat bergantung pada convention yang digunakan. Kesalahan yang umum adalah mencampur degree dengan radian atau menukar urutan matrix. Pivot menunjukkan bahwa rotation bukan hanya tentang sudut, tetapi juga titik pusat transformasi. Konsep ini menjadi dasar API transform pada Three.js dan Unity, walaupun engine menyediakan abstraction yang lebih sederhana.
