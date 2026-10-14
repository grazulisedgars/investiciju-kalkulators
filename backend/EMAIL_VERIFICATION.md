# E-pasta apstiprināšana lokāli

Pēc reģistrācijas vēstules saglabājas `backend/private_uploads/mail/*.html` (ārpus publiskā uploads).
Atver jaunāko HTML failu pārlūkā un nospied Apstiprināt e-pastu. Frontend un backend jādarbojas.
Vēstules netiek sūtītas uz Gmail vai citu ārēju pastkasti.

FRONTEND_URL noklusējums: http://localhost:5173. MAIL_DELIVERY noklusējums: local.
Publiskai palaišanai jāievieš SMTP/piegādes pakalpojums; local režīms nav īstu vēstuļu piegāde.

Saite derīga 24 stundas, vienreizēja. Jauna saite atceļ iepriekšējo. Atkārtota sūtīšana ne biežāk kā reizi 60 sekundēs.
Datubāzē glabājas tikai marķiera SHA-256 kopsavilkums. E-pasts netiek mainīts ar apstiprināšanas saiti.
Esošie konti automātiski netiek atzīmēti kā apstiprināti. Nepieciešama sava saite profilā.
Neapstiprinātie konti var atvērt profilu, mainīt paroli un iziet; jauna īpašuma izveide bloķēta arī serverī.
Lokālo testa vēstuļu faili satur vienreizējās saites: tos nedrīkst publicēt vai iekļaut versiju kontrolē.
