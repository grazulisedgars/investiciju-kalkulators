# Basic / PRO un lokāls testa režīms

Plāns glabājas users.plan (basic/pro). Basic: līdz 3 īpašumiem, pamata analīze. PRO: neierobežots īpašumu skaits, dienasgrāmata, galerija un padziļinātā analīze.

Lokālais pārslēdzējs pieejams tikai tad, ja vienlaikus:
- APP_ENV=development
- ENABLE_TEST_PLANS=true
- lietotāja ID ir TEST_PLAN_USER_IDS sarakstā.

Šie iestatījumi ir backend/.env. Pieprasījums maina tikai pašreizējā autorizētā lietotāja plānu, nesaņem cita lietotāja ID un nav maksājums.
Produkcijā APP_ENV=production un ENABLE_TEST_PLANS=false. Izstrādes .env nedrīkst pārnest uz produkciju.

API aizsardzība: entitlements.enforce_feature_access kā FastAPI globālā atkarība aizsargā visus diary, gallery un advanced-analysis maršrutus, arī attēlu nolasīšanu. Īpašuma izveidē serveris pārbauda 3 īpašumu limitu, bloķējot lietotāja rindu transakcijā.

Plāna samazināšana neko nedzēš. Ja Basic kontam ir vairāk nekā 3 īpašumi, esošie īpašumi ir pieejami ar pamata analīzi, bet jaunus pievienot nevar. PRO ieraksti paliek datubāzē un atkal pieejami, ieslēdzot PRO.

Reāli maksājumi, abonementu atjaunošana un apmaksas atcelšana vēl nav integrēti. PRO iegādes poga rāda informatīvu paziņojumu; mēneša/gada cenu izvēle ir salīdzinājuma skatā.
